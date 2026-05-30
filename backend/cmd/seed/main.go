package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"go-vote/internal/config"
	"go-vote/internal/database"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()

	ctx := context.Background()

	// Hash default password
	password := "Admin123!"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ Failed to hash password: %v", err)
	}

	// Insert default admin (idempotent)
	_, err = db.ExecContext(ctx, `
		INSERT INTO admins (id, username, name, password_hash, role, is_active, created_at, updated_at)
		VALUES (gen_random_uuid(), 'admin', 'Super Admin', $1, 'superadmin', TRUE, NOW(), NOW())
		ON CONFLICT (username) DO UPDATE
			SET password_hash = EXCLUDED.password_hash,
			    updated_at = NOW()
	`, string(hash))

	if err != nil {
		log.Fatalf("❌ Failed to seed admin: %v", err)
	}

	fmt.Println("✅ Admin seeded successfully!")
	fmt.Printf("   Username : admin\n")
	fmt.Printf("   Password : %s\n", password)
	fmt.Println("⚠️  Please change the password after first login!")
	os.Exit(0)
}
