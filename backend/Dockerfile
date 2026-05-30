# ============================================================
# Backend Dockerfile — Production (Multi-stage build)
# ============================================================

# Stage 1: Builder
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o govote-api ./cmd/api

# Stage 2: Production runtime
FROM alpine:3.19 AS production

RUN apk add --no-cache ca-certificates tzdata curl

WORKDIR /app

# Copy binary and migrations
COPY --from=builder /build/govote-api .
COPY --from=builder /build/internal/migration ./internal/migration

# Create upload directories
RUN mkdir -p /app/uploads/candidates /app/uploads/qrcodes

# Non-root user for security
RUN addgroup -S govote && adduser -S govote -G govote
RUN chown -R govote:govote /app
USER govote

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./govote-api"]
