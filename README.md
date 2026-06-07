# Go-Vote 🗳️

Sistem E-Voting digital berbasis Go + React — aman, transparan, dan modern.

---

## 🚀 Quick Start (Development)

### Prasyarat
- Docker & Docker Compose
- Go 1.23+
- Node.js 20+

### 1. Clone & Setup Environment

```bash
cp .env.example .env.dev
# Edit .env.dev sesuai kebutuhan (opsional, default sudah siap pakai)
```

### 2. Jalankan dengan Docker Compose (Dev)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Ini akan menjalankan:
| Layanan | URL |
|---------|-----|
| Frontend (Vite HMR) | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| pgAdmin | http://localhost:5050 |

### 3. Seed Admin Default

```bash
docker compose -f docker-compose.dev.yml exec backend go run ./cmd/seed
```

```
Username : admin
Password : Admin123!
```

---

## 🏭 Production

### 1. Setup Environment

```bash
cp .env.prod .env.prod.local
# Atau edit langsung .env.prod bila dipakai lokal di server
```

Gunakan nilai production yang valid untuk domain, password database, `APP_SECRET_KEY`, dan `JWT_SECRET`.

### 2. Jalankan

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d
```

| Layanan | Port |
|---------|------|
| Frontend (Nginx) | 5175 |
| Backend API | 8085 |
| PostgreSQL | 5432 (internal) |

Container production yang akan aktif:

- `voting_frontend`
- `voting_backend`
- `voting_database`

`FRONTEND_URL` di `.env.prod` harus sama persis dengan origin frontend yang diizinkan backend untuk CORS, termasuk port bila frontend diakses lewat `5175`.

---

## 🏗️ Arsitektur

```
Go-Voting/
├── backend/                    # Go API (Gin + sqlx + PostgreSQL)
│   ├── cmd/
│   │   ├── api/main.go         # Entry point + DI + graceful shutdown
│   │   └── seed/main.go        # Admin seeder
│   └── internal/
│       ├── config/             # Environment config
│       ├── database/           # PostgreSQL connection + migration runner
│       ├── dto/                # Request/Response structs
│       ├── handler/            # HTTP handlers (Gin)
│       ├── middleware/         # JWT, CORS, rate limiting
│       ├── migration/          # SQL migration files (001–010)
│       ├── model/              # Database models
│       ├── repository/         # SQL queries (sqlx)
│       ├── router/             # Route definitions
│       ├── service/            # Business logic
│       └── utils/              # Helpers (QR, upload, tokens)
│
└── frontend/                   # React + Vite + TypeScript + Tailwind v4
    └── src/
        ├── features/auth/      # AuthContext (JWT management)
        ├── layouts/            # AdminLayout (sidebar navigation)
        ├── lib/                # api.ts (axios), utils.ts
        ├── pages/
        │   ├── admin/          # Dashboard, Events, Candidates, Voters, Results
        │   └── vote/           # Scan, Voting, Confirm, Success, Error
        └── types/              # TypeScript interfaces
```

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Info admin |

### Admin — Events
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/admin/events` | List events |
| POST | `/api/admin/events` | Buat event |
| GET | `/api/admin/events/:id` | Detail event |
| PUT | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Hapus event |
| PATCH | `/api/admin/events/:id/status` | Update status |
| GET | `/api/admin/events/:id/results` | Hasil voting |
| GET | `/api/admin/events/:id/candidates` | Kandidat di event |
| POST | `/api/admin/events/:id/candidates/assign` | Assign kandidat |
| DELETE | `/api/admin/events/:id/candidates/:candidateId` | Hapus kandidat |
| GET | `/api/admin/events/:id/voters` | Voter di event |
| POST | `/api/admin/events/:id/voters/assign` | Assign voter |

### Admin — Candidates
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/admin/candidates` | List kandidat |
| POST | `/api/admin/candidates` | Buat kandidat |
| PUT | `/api/admin/candidates/:id` | Update kandidat |
| DELETE | `/api/admin/candidates/:id` | Hapus kandidat |
| POST | `/api/admin/candidates/:id/photo` | Upload foto |

### Admin — Voters
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/admin/voters` | List voter |
| POST | `/api/admin/voters` | Buat voter |
| PUT | `/api/admin/voters/:id` | Update voter |
| DELETE | `/api/admin/voters/:id` | Hapus voter |
| POST | `/api/admin/voters/:id/generate-qr` | Generate QR code |

### Public Voting
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/vote/validate-code` | Validasi kode unik voter |
| GET | `/api/vote/events/:id/candidates` | List kandidat (butuh X-Voting-Token) |
| POST | `/api/vote/events/:id/submit` | Submit vote (butuh X-Voting-Token) |

---

## 🗺️ Alur Voting

```
1. Admin: Buat Event → Assign Kandidat → Assign Voter → Aktifkan Event
2. Voter: Buka /vote → Masukkan Kode Unik → Pilih Kandidat → Konfirmasi → Selesai
3. Admin: Lihat Hasil Real-time di /admin/events/:id/results
```

---

## 🔧 Development Tanpa Docker

### Backend
```bash
cd backend
cp .env.example .env.dev
go mod download
go run ./cmd/api
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Security

- JWT HS256 untuk admin session
- Short-lived voting token (1 jam) per voter per event
- bcrypt untuk password hashing
- CORS restricted ke frontend URL
- File upload validation (type + size)
- One-vote enforcement via transaction lock

---

## 📝 License

MIT
