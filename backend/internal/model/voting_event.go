package model

import (
	"time"

	"github.com/google/uuid"
)

type EventStatus string

const (
	EventStatusDraft    EventStatus = "draft"
	EventStatusActive   EventStatus = "active"
	EventStatusFinished EventStatus = "finished"
	EventStatusClosed   EventStatus = "closed"
)

type VotingEvent struct {
	ID                   uuid.UUID   `db:"id"                     json:"id"`
	Name                 string      `db:"name"                   json:"name"`
	Slug                 string      `db:"slug"                   json:"slug"`
	Code                 string      `db:"code"                   json:"code"`
	Description          *string     `db:"description"            json:"description"`
	BannerURL            *string     `db:"banner_url"             json:"banner_url"`
	StartAt              time.Time   `db:"start_at"               json:"start_at"`
	EndAt                time.Time   `db:"end_at"                 json:"end_at"`
	Status               EventStatus `db:"status"                 json:"status"`
	MinChoices           int         `db:"min_choices"            json:"min_choices"`
	MaxChoices           int         `db:"max_choices"            json:"max_choices"`
	AllowMultipleChoices bool        `db:"allow_multiple_choices" json:"allow_multiple_choices"`
	IsResultPublic       bool        `db:"is_result_public"       json:"is_result_public"`
	CreatedAt            time.Time   `db:"created_at"             json:"created_at"`
	UpdatedAt            time.Time   `db:"updated_at"             json:"updated_at"`

	// Virtual fields (populated by queries)
	TotalCandidates int `db:"total_candidates" json:"total_candidates,omitempty"`
	TotalVoters     int `db:"total_voters"     json:"total_voters,omitempty"`
	TotalVoted      int `db:"total_voted"      json:"total_voted,omitempty"`
}
