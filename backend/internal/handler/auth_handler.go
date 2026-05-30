package handler

import (
	"errors"
	"net/http"

	"go-vote/internal/dto"
	"go-vote/internal/middleware"
	"go-vote/internal/repository"
	"go-vote/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
	adminRepo   repository.AdminRepository
}

func NewAuthHandler(authService *service.AuthService, adminRepo repository.AdminRepository) *AuthHandler {
	return &AuthHandler{authService: authService, adminRepo: adminRepo}
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) || errors.Is(err, service.ErrAdminInactive) {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Login failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Login successful", "data": resp})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Client-side token removal; no server-side blacklist in this implementation
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Logged out successfully"})
}

// GET /api/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	adminID := middleware.GetAdminID(c)
	admin, err := h.adminRepo.FindByID(c.Request.Context(), adminID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Admin not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": dto.AdminInfo{
			ID:       admin.ID,
			Username: admin.Username,
			Name:     admin.Name,
			Role:     string(admin.Role),
		},
	})
}
