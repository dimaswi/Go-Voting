package router

import (
	"net/http"
	"path/filepath"

	"go-vote/internal/config"
	"go-vote/internal/handler"
	"go-vote/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth      *handler.AuthHandler
	Event     *handler.EventHandler
	Candidate *handler.CandidateHandler
	Voter     *handler.VoterHandler
	Voting    *handler.VotingHandler
}

func Setup(cfg *config.Config, h *Handlers) *gin.Engine {
	if cfg.App.IsDevelopment() {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.CORS.AllowedOrigins
	corsConfig.AllowHeaders = []string{
		"Origin", "Content-Type", "Authorization",
		"X-Voting-Token", "Accept",
	}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// Serve uploaded files
	uploadsPath := filepath.Clean(cfg.Upload.Dir)
	r.Static("/uploads", uploadsPath)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "Go-Vote API"})
	})

	api := r.Group("/api")

	// ============================================================
	// AUTH routes (public)
	// ============================================================
	auth := api.Group("/auth")
	{
		auth.POST("/login", h.Auth.Login)
		auth.POST("/logout", middleware.JWTAuth(cfg), h.Auth.Logout)
		auth.GET("/me", middleware.JWTAuth(cfg), h.Auth.Me)
	}

	// ============================================================
	// PUBLIC VOTING routes
	// ============================================================
	vote := api.Group("/vote")
	{
		vote.POST("/validate-code", h.Voting.ValidateCode)
		vote.GET("/session/:token", h.Voting.GetSession)
		vote.GET("/events/:event_id/candidates", h.Voting.GetEventCandidates)
		vote.POST("/events/:event_id/submit", h.Voting.SubmitVote)
	}

	// ============================================================
	// ADMIN routes (JWT protected)
	// ============================================================
	admin := api.Group("/admin")
	admin.Use(middleware.JWTAuth(cfg))
	{
		// Dashboard
		admin.GET("/dashboard/stats", h.Event.DashboardStats)

		// Events
		events := admin.Group("/events")
		{
			events.GET("", h.Event.List)
			events.POST("", h.Event.Create)
			events.GET("/:id", h.Event.GetByID)
			events.PUT("/:id", h.Event.Update)
			events.DELETE("/:id", h.Event.Delete)
			events.PATCH("/:id/status", h.Event.UpdateStatus)

			// Event Candidates
			events.GET("/:id/candidates", h.Candidate.ListByEvent)
			events.POST("/:id/candidates/assign", h.Candidate.AssignToEvent)
			events.PUT("/:id/candidates/reorder", h.Candidate.ReorderEventCandidates)
			events.DELETE("/:id/candidates/:candidate_id", h.Candidate.RemoveFromEvent)

			// Event Voters
			events.GET("/:id/voters", h.Voter.ListByEvent)
			events.POST("/:id/voters/assign", h.Voter.AssignToEvent)

			// Results
			events.GET("/:id/results", h.Voting.GetResults)
		}

		// Candidates
		candidates := admin.Group("/candidates")
		{
			candidates.GET("", h.Candidate.List)
			candidates.POST("", h.Candidate.Create)
			candidates.GET("/:id", h.Candidate.GetByID)
			candidates.PUT("/:id", h.Candidate.Update)
			candidates.DELETE("/:id", h.Candidate.Delete)
			candidates.POST("/:id/photo", h.Candidate.UploadPhoto)
		}

		// Voters
		voters := admin.Group("/voters")
		{
			voters.GET("", h.Voter.List)
			voters.POST("", h.Voter.Create)
			voters.GET("/:id", h.Voter.GetByID)
			voters.PUT("/:id", h.Voter.Update)
			voters.DELETE("/:id", h.Voter.Delete)
			voters.POST("/:id/generate-qr", h.Voter.GenerateQR)
		}
	}

	return r
}
