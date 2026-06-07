package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go-vote/internal/config"
	"go-vote/internal/database"
	"go-vote/internal/handler"
	"go-vote/internal/repository"
	"go-vote/internal/router"
	"go-vote/internal/service"
)

func main() {
	// ========================
	// Load configuration
	// ========================
	cfg := config.Load()
	log.Printf("🚀 Starting Go-Vote API in %s mode on port %s", cfg.App.Env, cfg.App.Port)

	// ========================
	// Connect to database
	// ========================
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()

	// ========================
	// Run database migrations
	// ========================
	if os.Getenv("RUN_MIGRATIONS") == "true" {
		migrationsDir := os.Getenv("MIGRATIONS_DIR")
		if migrationsDir == "" {
			if _, err := os.Stat("./internal/migration"); err == nil {
				migrationsDir = "./internal/migration"
			} else {
				migrationsDir = "../../internal/migration"
			}
		}
		if err := database.RunMigrations(context.Background(), migrationsDir); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
	} else {
		log.Println("⏭️ Skipping automatic database migrations")
	}

	// ========================
	// Ensure upload directories exist
	// ========================
	for _, dir := range []string{
		cfg.Upload.Dir + "/candidates",
		cfg.Upload.Dir + "/qrcodes",
	} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatalf("❌ Failed to create upload directory %s: %v", dir, err)
		}
	}

	// ========================
	// Initialize repositories
	// ========================
	adminRepo        := repository.NewAdminRepository(db)
	eventRepo        := repository.NewEventRepository(db)
	candidateRepo    := repository.NewCandidateRepository(db)
	eventCandRepo    := repository.NewEventCandidateRepository(db)
	voterRepo        := repository.NewVoterRepository(db)
	eventVoterRepo   := repository.NewEventVoterRepository(db)
	voteRepo         := repository.NewVoteRepository(db)

	// ========================
	// Initialize services
	// ========================
	authService   := service.NewAuthService(adminRepo, cfg)
	eventService  := service.NewEventService(eventRepo)
	voterService  := service.NewVoterService(voterRepo, eventVoterRepo, cfg)
	votingService := service.NewVotingService(voterRepo, eventRepo, eventVoterRepo, eventCandRepo, voteRepo, cfg)

	// ========================
	// Initialize handlers
	// ========================
	handlers := &router.Handlers{
		Auth:      handler.NewAuthHandler(authService, adminRepo),
		Event:     handler.NewEventHandler(eventService),
		Candidate: handler.NewCandidateHandler(candidateRepo, eventCandRepo, cfg),
		Voter:     handler.NewVoterHandler(voterService),
		Voting:    handler.NewVotingHandler(votingService),
	}

	// ========================
	// Setup router
	// ========================
	r := router.Setup(cfg, handlers)

	// ========================
	// Start HTTP server
	// ========================
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.App.Port),
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("✅ Go-Vote API listening on http://0.0.0.0:%s", cfg.App.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server error: %v", err)
		}
	}()

	<-quit
	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("⚠️ Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server stopped gracefully")
}
