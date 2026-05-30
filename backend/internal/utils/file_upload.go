package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
}

// SaveUploadedFile saves a multipart file to the upload directory
// Returns the public URL path
func SaveUploadedFile(file *multipart.FileHeader, uploadDir, subDir string) (string, error) {
	// Validate content type
	contentType := file.Header.Get("Content-Type")
	if !AllowedImageTypes[contentType] {
		return "", fmt.Errorf("invalid file type: %s. Only JPEG, PNG, WEBP allowed", contentType)
	}

	// Validate size (max 5MB)
	if file.Size > 5*1024*1024 {
		return "", fmt.Errorf("file too large: maximum 5MB allowed")
	}

	// Get extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		switch contentType {
		case "image/jpeg", "image/jpg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		default:
			ext = ".jpg"
		}
	}

	// Create directory
	dir := filepath.Join(uploadDir, subDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload dir: %w", err)
	}

	// Generate unique filename
	filename := uuid.New().String() + ext
	filePath := filepath.Join(dir, filename)

	// Open source
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	// Create destination
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy
	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	return "/uploads/" + subDir + "/" + filename, nil
}

// DeleteFile removes a file from disk given its URL path
func DeleteFile(uploadDir, urlPath string) error {
	// Convert URL path to disk path
	rel := strings.TrimPrefix(urlPath, "/uploads/")
	filePath := filepath.Join(uploadDir, rel)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
