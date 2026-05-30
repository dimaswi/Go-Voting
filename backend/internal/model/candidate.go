package model

import (
	"time"

	"github.com/google/uuid"
)

type GenderType string

const (
	GenderMale   GenderType = "male"
	GenderFemale GenderType = "female"
	GenderOther  GenderType = "other"
)

type Candidate struct {
	ID                     uuid.UUID  `db:"id"                       json:"id"`
	FullName               string     `db:"full_name"                json:"full_name"`
	CandidateNumber        *int       `db:"candidate_number"         json:"candidate_number"`
	NIK                    *string    `db:"nik"                      json:"nik"`
	BirthPlace             *string    `db:"birth_place"              json:"birth_place"`
	BirthDate              *time.Time `db:"birth_date"               json:"birth_date"`
	Gender                 *GenderType `db:"gender"                  json:"gender"`
	Address                *string    `db:"address"                  json:"address"`
	Phone                  *string    `db:"phone"                    json:"phone"`
	Email                  *string    `db:"email"                    json:"email"`
	PhotoURL               *string    `db:"photo_url"                json:"photo_url"`
	Education              *string    `db:"education"                json:"education"`
	OrganizationExperience *string    `db:"organization_experience"  json:"organization_experience"`
	CurrentPosition        *string    `db:"current_position"         json:"current_position"`
	Vision                 *string    `db:"vision"                   json:"vision"`
	Mission                *string    `db:"mission"                  json:"mission"`
	WorkProgram            *string    `db:"work_program"             json:"work_program"`
	Goals                  *string    `db:"goals"                    json:"goals"`
	Motto                  *string    `db:"motto"                    json:"motto"`
	Description            *string    `db:"description"              json:"description"`
	IsActive               bool       `db:"is_active"                json:"is_active"`
	CreatedAt              time.Time  `db:"created_at"               json:"created_at"`
	UpdatedAt              time.Time  `db:"updated_at"               json:"updated_at"`
}

type EventCandidate struct {
	ID              uuid.UUID `db:"id"               json:"id"`
	EventID         uuid.UUID `db:"event_id"         json:"event_id"`
	CandidateID     uuid.UUID `db:"candidate_id"     json:"candidate_id"`
	CandidateNumber int       `db:"candidate_number" json:"candidate_number"`
	SortOrder       int       `db:"sort_order"       json:"sort_order"`
	CreatedAt       time.Time `db:"created_at"       json:"created_at"`
	UpdatedAt       time.Time `db:"updated_at"       json:"updated_at"`

	// Joined from candidates
	FullName   string  `db:"full_name"  json:"full_name,omitempty"`
	PhotoURL   *string `db:"photo_url"  json:"photo_url,omitempty"`
	Vision     *string `db:"vision"     json:"vision,omitempty"`
}
