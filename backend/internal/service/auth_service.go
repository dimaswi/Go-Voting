package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"go-vote/internal/config"
	"go-vote/internal/dto"
	"go-vote/internal/middleware"
	"go-vote/internal/model"
	"go-vote/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrAdminInactive      = errors.New("admin account is inactive")
)

type AuthService struct {
	adminRepo repository.AdminRepository
	cfg       *config.Config
}

func NewAuthService(adminRepo repository.AdminRepository, cfg *config.Config) *AuthService {
	return &AuthService{adminRepo: adminRepo, cfg: cfg}
}

func (s *AuthService) Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error) {
	admin, err := s.adminRepo.FindByUsername(ctx, req.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !admin.IsActive {
		return nil, ErrAdminInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	// Generate token
	token, err := middleware.GenerateToken(admin.ID, admin.Username, string(admin.Role), s.cfg)
	if err != nil {
		return nil, err
	}

	// Update last login
	now := time.Now()
	_ = s.adminRepo.UpdateLastLogin(ctx, admin.ID, now)

	return &dto.LoginResponse{
		Token:     token,
		ExpiresAt: now.Add(s.cfg.JWT.JWTExpiry()),
		Admin: dto.AdminInfo{
			ID:       admin.ID,
			Username: admin.Username,
			Name:     admin.Name,
			Role:     string(admin.Role),
		},
	}, nil
}

func (s *AuthService) GetMe(ctx context.Context, adminID interface{}) (*model.Admin, error) {
	id, ok := adminID.(interface{ String() string })
	if !ok {
		return nil, errors.New("invalid admin ID")
	}
	_ = id
	// Re-fetch from context properly via UUID
	return nil, nil
}

func (s *AuthService) ChangePassword(ctx context.Context, adminID interface{}, oldPass, newPass string) error {
	return nil
}

// HashPassword creates a bcrypt hash of a password
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
