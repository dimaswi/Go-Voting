package repository

import (
	"context"
	"time"

	"go-vote/internal/model"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type AdminRepository interface {
	FindByUsername(ctx context.Context, username string) (*model.Admin, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Admin, error)
	UpdateLastLogin(ctx context.Context, id uuid.UUID, t time.Time) error
	UpdatePassword(ctx context.Context, id uuid.UUID, hash string) error
}

type adminRepo struct{ db *sqlx.DB }

func NewAdminRepository(db *sqlx.DB) AdminRepository {
	return &adminRepo{db: db}
}

func (r *adminRepo) FindByUsername(ctx context.Context, username string) (*model.Admin, error) {
	var admin model.Admin
	err := r.db.GetContext(ctx, &admin,
		`SELECT * FROM admins WHERE username = $1 AND is_active = TRUE`, username)
	if err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Admin, error) {
	var admin model.Admin
	err := r.db.GetContext(ctx, &admin,
		`SELECT * FROM admins WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID, t time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE admins SET last_login_at = $1, updated_at = NOW() WHERE id = $2`, t, id)
	return err
}

func (r *adminRepo) UpdatePassword(ctx context.Context, id uuid.UUID, hash string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2`, hash, id)
	return err
}
