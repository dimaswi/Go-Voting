package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// RunMigrations executes all pending SQL migration files in the given directory
func RunMigrations(ctx context.Context, migrationsDir string) error {
	if DB == nil {
		return fmt.Errorf("database not connected")
	}

	// Ensure migrations table exists
	_, err := DB.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version     VARCHAR(255) PRIMARY KEY,
			applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Read migration files from disk
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory '%s': %w", migrationsDir, err)
	}

	// Collect and sort .sql files
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied := 0
	for _, filename := range files {
		version := strings.TrimSuffix(filename, ".sql")

		// Check if already applied
		var count int
		if err := DB.GetContext(ctx, &count,
			`SELECT COUNT(*) FROM schema_migrations WHERE version=$1`, version); err != nil {
			return fmt.Errorf("failed to check migration %s: %w", version, err)
		}
		if count > 0 {
			continue
		}

		// Read file
		fullPath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		// Execute in transaction
		tx, err := DB.BeginTxx(ctx, nil)
		if err != nil {
			return fmt.Errorf("failed to begin transaction for %s: %w", filename, err)
		}

		if _, err := tx.ExecContext(ctx, string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w\nSQL:\n%s", filename, err, string(content))
		}

		if _, err := tx.ExecContext(ctx,
			`INSERT INTO schema_migrations (version) VALUES ($1)`, version); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", filename, err)
		}

		log.Printf("✅ Applied migration: %s", filename)
		applied++
	}

	if applied == 0 {
		log.Println("✅ Database schema is up to date")
	} else {
		log.Printf("✅ Applied %d migration(s)", applied)
	}

	return nil
}
