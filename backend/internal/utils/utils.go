package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	qrcode "github.com/skip2/go-qrcode"
)

// GenerateUniqueCode generates a secure random hex string for voter unique codes
func GenerateUniqueCode(length int) (string, error) {
	bytes := make([]byte, length/2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return strings.ToUpper(hex.EncodeToString(bytes)), nil
}

// GenerateSecureToken generates a secure random token for voting sessions
func GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GenerateEventCode generates a short unique event code
func GenerateEventCode() (string, error) {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("EV%s", strings.ToUpper(hex.EncodeToString(bytes))), nil
}

// GenerateSlug creates a URL-friendly slug from a string
func GenerateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove non-alphanumeric except hyphens
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	// Append timestamp to ensure uniqueness
	result.WriteString(fmt.Sprintf("-%d", time.Now().Unix()))
	return result.String()
}

// GenerateQRCode generates a QR code PNG file and returns the file path
func GenerateQRCode(content, uploadDir, filename string) (string, error) {
	dir := filepath.Join(uploadDir, "qrcodes")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create qrcode dir: %w", err)
	}

	filePath := filepath.Join(dir, filename+".png")
	err := qrcode.WriteFile(content, qrcode.High, 256, filePath)
	if err != nil {
		return "", fmt.Errorf("failed to generate QR code: %w", err)
	}

	return "/uploads/qrcodes/" + filename + ".png", nil
}

// Pointer helpers
func StringPtr(s string) *string { return &s }
func BoolPtr(b bool) *bool       { return &b }
func IntPtr(i int) *int          { return &i }
