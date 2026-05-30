package database

import (
	"fmt"
	"log"
	"time"

	"go-vote/internal/config"

	_ "github.com/lib/pq"
	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB

// Connect establishes a connection to the PostgreSQL database
func Connect(cfg *config.Config) (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", cfg.Database.DSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	db.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	db.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetimeMin) * time.Minute)

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("✅ Connected to database: %s@%s:%s/%s",
		cfg.Database.User,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	DB = db
	return db, nil
}

// Close closes the database connection
func Close() {
	if DB != nil {
		if err := DB.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}
}
