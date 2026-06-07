package dto

import (
	"time"

	"github.com/google/uuid"
)

// ========================
// AUTH
// ========================

type LoginRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Admin     AdminInfo `json:"admin"`
}

type AdminInfo struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	Name     string    `json:"name"`
	Role     string    `json:"role"`
}

// ========================
// EVENT
// ========================

type CreateEventRequest struct {
	Name                 string    `json:"name"                   binding:"required,min=3,max=255"`
	Description          *string   `json:"description"`
	StartAt              time.Time `json:"start_at"               binding:"required"`
	EndAt                time.Time `json:"end_at"                 binding:"required"`
	MinChoices           int       `json:"min_choices"            binding:"required,min=1"`
	MaxChoices           int       `json:"max_choices"            binding:"required,min=1"`
	AllowMultipleChoices bool      `json:"allow_multiple_choices"`
	IsResultPublic       bool      `json:"is_result_public"`
}

type UpdateEventRequest struct {
	Name                 string    `json:"name"                   binding:"omitempty,min=3,max=255"`
	Description          *string   `json:"description"`
	StartAt              time.Time `json:"start_at"               binding:"omitempty"`
	EndAt                time.Time `json:"end_at"                 binding:"omitempty"`
	MinChoices           int       `json:"min_choices"            binding:"omitempty,min=1"`
	MaxChoices           int       `json:"max_choices"            binding:"omitempty,min=1"`
	AllowMultipleChoices *bool     `json:"allow_multiple_choices"`
	IsResultPublic       *bool     `json:"is_result_public"`
}

type UpdateEventStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=draft active finished closed"`
}

// ========================
// CANDIDATE
// ========================

type CreateCandidateRequest struct {
	FullName               string     `json:"full_name"               binding:"required,min=2,max=200"`
	CandidateNumber        *int       `json:"candidate_number"`
	NIK                    *string    `json:"nik"                     binding:"omitempty,max=50"`
	BirthPlace             *string    `json:"birth_place"             binding:"omitempty,max=100"`
	BirthDate              *time.Time `json:"birth_date"`
	Gender                 *string    `json:"gender"                  binding:"omitempty,oneof=male female other"`
	Address                *string    `json:"address"`
	Phone                  *string    `json:"phone"                   binding:"omitempty,max=20"`
	Email                  *string    `json:"email"                   binding:"omitempty,email"`
	Education              *string    `json:"education"`
	OrganizationExperience *string    `json:"organization_experience"`
	CurrentPosition        *string    `json:"current_position"        binding:"omitempty,max=200"`
	Vision                 *string    `json:"vision"`
	Mission                *string    `json:"mission"`
	WorkProgram            *string    `json:"work_program"`
	Goals                  *string    `json:"goals"`
	Motto                  *string    `json:"motto"                   binding:"omitempty,max=500"`
	Description            *string    `json:"description"`
	IsActive               *bool      `json:"is_active"`
}

type UpdateCandidateRequest = CreateCandidateRequest

// ========================
// EVENT CANDIDATE
// ========================

type AssignCandidatesRequest struct {
	Candidates []AssignCandidateItem `json:"candidates" binding:"required,min=1"`
}

type AssignCandidateItem struct {
	CandidateID     uuid.UUID `json:"candidate_id"     binding:"required"`
	CandidateNumber int       `json:"candidate_number" binding:"required,min=1"`
	SortOrder       int       `json:"sort_order"`
}

type ReorderCandidatesRequest struct {
	Orders []CandidateOrder `json:"orders" binding:"required,min=1"`
}

type CandidateOrder struct {
	EventCandidateID uuid.UUID `json:"event_candidate_id" binding:"required"`
	SortOrder        int       `json:"sort_order"`
}

// ========================
// VOTER
// ========================

type CreateVoterRequest struct {
	FullName       string  `json:"full_name"        binding:"required,min=2,max=200"`
	IdentityNumber *string `json:"identity_number"  binding:"omitempty,max=50"`
	Phone          *string `json:"phone"            binding:"omitempty,max=20"`
	Email          *string `json:"email"            binding:"omitempty,email"`
	GroupName      *string `json:"group_name"       binding:"omitempty,max=200"`
	IsAnonymous    bool    `json:"is_anonymous"`
}

type UpdateVoterRequest = CreateVoterRequest

// ========================
// EVENT VOTER
// ========================

type AssignVotersRequest struct {
	VoterIDs []uuid.UUID `json:"voter_ids" binding:"required,min=1"`
}

type PrintBulkVotersRequest struct {
	VoterIDs []uuid.UUID `json:"voter_ids" binding:"required,min=1"`
}

// ========================
// VOTING (PUBLIC)
// ========================

type ValidateCodeRequest struct {
	Code string `json:"code" binding:"required,min=1"`
}

type ValidateCodeResponse struct {
	Token     string              `json:"token"`
	ExpiresAt time.Time           `json:"expires_at"`
	Voter     PublicVoterInfo     `json:"voter"`
	Events    []PublicEventInfo   `json:"events"`
}

type PublicVoterInfo struct {
	ID          uuid.UUID `json:"id"`
	FullName    string    `json:"full_name"`
	IsAnonymous bool      `json:"is_anonymous"`
}

type PublicEventInfo struct {
	ID                   uuid.UUID `json:"id"`
	Name                 string    `json:"name"`
	Description          *string   `json:"description"`
	StartAt              time.Time `json:"start_at"`
	EndAt                time.Time `json:"end_at"`
	MinChoices           int       `json:"min_choices"`
	MaxChoices           int       `json:"max_choices"`
	AllowMultipleChoices bool      `json:"allow_multiple_choices"`
	HasVoted             bool      `json:"has_voted"`
}

type SubmitVoteRequest struct {
	CandidateIDs []uuid.UUID `json:"candidate_ids" binding:"required,min=1"`
}

// ========================
// RESULTS
// ========================

type EventResultResponse struct {
	Event           EventSummary      `json:"event"`
	TotalVoters     int               `json:"total_voters"`
	TotalVoted      int               `json:"total_voted"`
	TotalNotVoted   int               `json:"total_not_voted"`
	ParticipationPct float64          `json:"participation_pct"`
	Candidates      []CandidateResult `json:"candidates"`
}

type EventSummary struct {
	ID     uuid.UUID `json:"id"`
	Name   string    `json:"name"`
	Status string    `json:"status"`
}

type CandidateResult struct {
	CandidateID     uuid.UUID `json:"candidate_id" db:"candidate_id"`
	FullName        string    `json:"full_name" db:"full_name"`
	CandidateNumber int       `json:"candidate_number" db:"candidate_number"`
	PhotoURL        *string   `json:"photo_url" db:"photo_url"`
	VoteCount       int       `json:"vote_count" db:"vote_count"`
	Percentage      float64   `json:"percentage" db:"-"`
	Rank            int       `json:"rank" db:"rank"`
}

// ========================
// COMMON RESPONSES
// ========================

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Meta    PaginateMeta `json:"meta"`
}

type PaginateMeta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type MonthlyVoterStat struct {
	Name   string `json:"name" db:"name"`
	Voters int    `json:"voters" db:"voters"`
}

type DashboardStats struct {
	TotalEvents     int                `json:"total_events" db:"total_events"`
	ActiveEvents    int                `json:"active_events" db:"active_events"`
	TotalCandidates int                `json:"total_candidates"`
	TotalVoters     int                `json:"total_voters"`
	TotalVoted      int                `json:"total_voted"`
	TotalNotVoted   int                `json:"total_not_voted"`
	MonthlyData     []MonthlyVoterStat `json:"monthly_data"`
}
