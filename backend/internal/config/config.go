package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	App      AppConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Upload   UploadConfig
	CORS     CORSConfig
	RateLimit RateLimitConfig
}

type AppConfig struct {
	Env       string
	Port      string
	SecretKey string
}

type DatabaseConfig struct {
	Host                string
	Port                string
	User                string
	Password            string
	Name                string
	SSLMode             string
	MaxOpenConns        int
	MaxIdleConns        int
	ConnMaxLifetimeMin  int
}

type JWTConfig struct {
	Secret      string
	ExpiryHours int
}

type UploadConfig struct {
	Dir        string
	MaxSizeMB  int64
}

type CORSConfig struct {
	AllowedOrigins []string
}

type RateLimitConfig struct {
	Requests      int
	WindowSeconds int
}

var Global *Config

// Load reads configuration from environment variables
func Load() *Config {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	// Load .env file in development
	if env == "development" {
		envPaths := []string{
			".env.dev",
			"../.env.dev",
			"../../.env.dev",
			"../../../.env.dev",
			".env",
			"../.env",
			"../../.env",
			"../../../.env",
		}
		
		envLoaded := false
		for _, path := range envPaths {
			if err := godotenv.Load(path); err == nil {
				log.Printf("Loaded env file from: %s\n", path)
				envLoaded = true
				break
			}
		}
		
		if !envLoaded {
			log.Println("No .env file found, using environment variables")
		}
	}

	cfg := &Config{
		App: AppConfig{
			Env:       getEnv("APP_ENV", "development"),
			Port:      getEnv("APP_PORT", "8080"),
			SecretKey: getEnv("APP_SECRET_KEY", "default-secret-change-me"),
		},
		Database: DatabaseConfig{
			Host:               getEnv("DB_HOST", "localhost"),
			Port:               getEnv("DB_PORT", "5432"),
			User:               getEnv("DB_USER", "govote"),
			Password:           getEnv("DB_PASSWORD", ""),
			Name:               getEnv("DB_NAME", "Go-Vote"),
			SSLMode:            getEnv("DB_SSLMODE", "disable"),
			MaxOpenConns:       getEnvInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:       getEnvInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetimeMin: getEnvInt("DB_CONN_MAX_LIFETIME_MINUTES", 5),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "default-jwt-secret-change-me"),
			ExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 24),
		},
		Upload: UploadConfig{
			Dir:       getEnv("UPLOAD_DIR", "./uploads"),
			MaxSizeMB: int64(getEnvInt("MAX_UPLOAD_SIZE_MB", 5)),
		},
		CORS: CORSConfig{
			AllowedOrigins: []string{
				getEnv("FRONTEND_URL", "http://localhost:5173"),
			},
		},
		RateLimit: RateLimitConfig{
			Requests:      getEnvInt("RATE_LIMIT_REQUESTS", 100),
			WindowSeconds: getEnvInt("RATE_LIMIT_WINDOW_SECONDS", 60),
		},
	}

	Global = cfg
	return cfg
}

// DSN returns the PostgreSQL connection string
func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

// JWTExpiry returns JWT expiry as time.Duration
func (j *JWTConfig) JWTExpiry() time.Duration {
	return time.Duration(j.ExpiryHours) * time.Hour
}

// IsDevelopment returns true if running in development mode
func (a *AppConfig) IsDevelopment() bool {
	return a.Env == "development"
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return defaultVal
}
