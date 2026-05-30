package model

import (
	"time"

	"github.com/google/uuid"
)

type AdminRole string

const (
	RoleSuperAdmin AdminRole = "superadmin"
	RoleAdmin      AdminRole = "admin"
)

type Admin struct {
	ID           uuid.UUID  `db:"id"            json:"id"`
	Username     string     `db:"username"      json:"username"`
	Name         string     `db:"name"          json:"name"`
	PasswordHash string     `db:"password_hash" json:"-"`
	Role         AdminRole  `db:"role"          json:"role"`
	IsActive     bool       `db:"is_active"     json:"is_active"`
	LastLoginAt  *time.Time `db:"last_login_at" json:"last_login_at"`
	CreatedAt    time.Time  `db:"created_at"    json:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"    json:"updated_at"`
}
