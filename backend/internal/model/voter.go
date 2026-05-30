package model

import (
	"time"

	"github.com/google/uuid"
)

type VoterStatus string

const (
	VoterStatusActive  VoterStatus = "active"
	VoterStatusBlocked VoterStatus = "blocked"
)

type EventVoterStatus string

const (
	EventVoterStatusActive  EventVoterStatus = "active"
	EventVoterStatusBlocked EventVoterStatus = "blocked"
)

type Voter struct {
	ID             uuid.UUID   `db:"id"              json:"id"`
	FullName       string      `db:"full_name"       json:"full_name"`
	IdentityNumber *string     `db:"identity_number" json:"identity_number"`
	Phone          *string     `db:"phone"           json:"phone"`
	Email          *string     `db:"email"           json:"email"`
	GroupName      *string     `db:"group_name"      json:"group_name"`
	UniqueCode     string      `db:"unique_code"     json:"unique_code"`
	QRCodeURL      *string     `db:"qr_code_url"     json:"qr_code_url"`
	IsAnonymous    bool        `db:"is_anonymous"    json:"is_anonymous"`
	Status         VoterStatus `db:"status"          json:"status"`
	CreatedAt      time.Time   `db:"created_at"      json:"created_at"`
	UpdatedAt      time.Time   `db:"updated_at"      json:"updated_at"`
}

type EventVoter struct {
	ID         uuid.UUID        `db:"id"          json:"id"`
	EventID    uuid.UUID        `db:"event_id"    json:"event_id"`
	VoterID    uuid.UUID        `db:"voter_id"    json:"voter_id"`
	AssignedAt time.Time        `db:"assigned_at" json:"assigned_at"`
	HasVoted   bool             `db:"has_voted"   json:"has_voted"`
	VotedAt    *time.Time       `db:"voted_at"    json:"voted_at"`
	Status     EventVoterStatus `db:"status"      json:"status"`

	// Joined from voters
	FullName       string      `db:"full_name"       json:"full_name,omitempty"`
	IdentityNumber *string     `db:"identity_number" json:"identity_number,omitempty"`
	GroupName      *string     `db:"group_name"      json:"group_name,omitempty"`
	UniqueCode     string      `db:"unique_code"     json:"unique_code,omitempty"`
	QRCodeURL      *string     `db:"qr_code_url"     json:"qr_code_url,omitempty"`
	IsAnonymous    bool        `db:"is_anonymous"    json:"is_anonymous,omitempty"`
	VoterStatus    VoterStatus `db:"voter_status"    json:"voter_status,omitempty"`
}

type Vote struct {
	ID          uuid.UUID `db:"id"           json:"id"`
	EventID     uuid.UUID `db:"event_id"     json:"event_id"`
	VoterID     uuid.UUID `db:"voter_id"     json:"voter_id"`
	SubmittedAt time.Time `db:"submitted_at" json:"submitted_at"`
	IPAddress   *string   `db:"ip_address"   json:"ip_address"`
	UserAgent   *string   `db:"user_agent"   json:"-"`
	CreatedAt   time.Time `db:"created_at"   json:"created_at"`
}

type VoteDetail struct {
	ID          uuid.UUID `db:"id"           json:"id"`
	VoteID      uuid.UUID `db:"vote_id"      json:"vote_id"`
	CandidateID uuid.UUID `db:"candidate_id" json:"candidate_id"`
	EventID     uuid.UUID `db:"event_id"     json:"event_id"`
	CreatedAt   time.Time `db:"created_at"   json:"created_at"`
}

type VotingSession struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	Token     string    `db:"token"      json:"token"`
	VoterID   uuid.UUID `db:"voter_id"   json:"voter_id"`
	EventID   uuid.UUID `db:"event_id"   json:"event_id"`
	ExpiresAt time.Time `db:"expires_at" json:"expires_at"`
	Used      bool      `db:"used"       json:"used"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type AuditLog struct {
	ID         uuid.UUID   `db:"id"          json:"id"`
	AdminID    *uuid.UUID  `db:"admin_id"    json:"admin_id"`
	Action     string      `db:"action"      json:"action"`
	EntityType string      `db:"entity_type" json:"entity_type"`
	EntityID   *string     `db:"entity_id"   json:"entity_id"`
	OldValue   interface{} `db:"old_value"   json:"old_value"`
	NewValue   interface{} `db:"new_value"   json:"new_value"`
	IPAddress  *string     `db:"ip_address"  json:"ip_address"`
	UserAgent  *string     `db:"user_agent"  json:"-"`
	CreatedAt  time.Time   `db:"created_at"  json:"created_at"`
}
