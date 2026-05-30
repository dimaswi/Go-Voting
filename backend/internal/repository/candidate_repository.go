package repository

import (
	"context"
	"fmt"
	"strings"

	"go-vote/internal/model"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type CandidateRepository interface {
	List(ctx context.Context, search string, isActive *bool, page, perPage int) ([]model.Candidate, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Candidate, error)
	Create(ctx context.Context, c *model.Candidate) error
	Update(ctx context.Context, c *model.Candidate) error
	UpdatePhoto(ctx context.Context, id uuid.UUID, photoURL string) error
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int, error)
}

type candidateRepo struct{ db *sqlx.DB }

func NewCandidateRepository(db *sqlx.DB) CandidateRepository {
	return &candidateRepo{db: db}
}

func (r *candidateRepo) List(ctx context.Context, search string, isActive *bool, page, perPage int) ([]model.Candidate, int, error) {
	offset := (page - 1) * perPage
	args := []interface{}{}
	where := []string{}
	i := 1

	if search != "" {
		where = append(where, fmt.Sprintf("full_name ILIKE $%d", i))
		args = append(args, "%"+search+"%")
		i++
	}
	if isActive != nil {
		where = append(where, fmt.Sprintf("is_active = $%d", i))
		args = append(args, *isActive)
		i++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	var total int
	if err := r.db.GetContext(ctx, &total,
		fmt.Sprintf(`SELECT COUNT(*) FROM candidates %s`, whereClause), args...); err != nil {
		return nil, 0, err
	}

	var candidates []model.Candidate
	query := fmt.Sprintf(`SELECT * FROM candidates %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, i, i+1)
	args = append(args, perPage, offset)
	if err := r.db.SelectContext(ctx, &candidates, query, args...); err != nil {
		return nil, 0, err
	}
	return candidates, total, nil
}

func (r *candidateRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Candidate, error) {
	var c model.Candidate
	err := r.db.GetContext(ctx, &c, `SELECT * FROM candidates WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *candidateRepo) Create(ctx context.Context, c *model.Candidate) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO candidates
			(id, full_name, candidate_number, nik, birth_place, birth_date, gender,
			 address, phone, email, education, organization_experience, current_position,
			 vision, mission, work_program, goals, motto, description, is_active, created_at, updated_at)
		VALUES
			($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW())
		RETURNING id, created_at, updated_at`,
		c.ID, c.FullName, c.CandidateNumber, c.NIK, c.BirthPlace, c.BirthDate, c.Gender,
		c.Address, c.Phone, c.Email, c.Education, c.OrganizationExperience, c.CurrentPosition,
		c.Vision, c.Mission, c.WorkProgram, c.Goals, c.Motto, c.Description, c.IsActive,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *candidateRepo) Update(ctx context.Context, c *model.Candidate) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE candidates SET
			full_name=$1, candidate_number=$2, nik=$3, birth_place=$4, birth_date=$5,
			gender=$6, address=$7, phone=$8, email=$9, education=$10,
			organization_experience=$11, current_position=$12, vision=$13, mission=$14,
			work_program=$15, goals=$16, motto=$17, description=$18, is_active=$19, updated_at=NOW()
		WHERE id=$20`,
		c.FullName, c.CandidateNumber, c.NIK, c.BirthPlace, c.BirthDate,
		c.Gender, c.Address, c.Phone, c.Email, c.Education,
		c.OrganizationExperience, c.CurrentPosition, c.Vision, c.Mission,
		c.WorkProgram, c.Goals, c.Motto, c.Description, c.IsActive, c.ID,
	)
	return err
}

func (r *candidateRepo) UpdatePhoto(ctx context.Context, id uuid.UUID, photoURL string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE candidates SET photo_url=$1, updated_at=NOW() WHERE id=$2`, photoURL, id)
	return err
}

func (r *candidateRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM candidates WHERE id=$1`, id)
	return err
}

func (r *candidateRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `SELECT COUNT(*) FROM candidates`)
	return count, err
}

// ============================================================
// Event Candidate Repository
// ============================================================

type EventCandidateRepository interface {
	ListByEvent(ctx context.Context, eventID uuid.UUID) ([]model.EventCandidate, error)
	Assign(ctx context.Context, ec *model.EventCandidate) error
	UpdateOrder(ctx context.Context, id uuid.UUID, sortOrder int) error
	Remove(ctx context.Context, eventID, candidateID uuid.UUID) error
	IsAssigned(ctx context.Context, eventID, candidateID uuid.UUID) (bool, error)
	GetCandidatesByEventIDs(ctx context.Context, eventID uuid.UUID) ([]model.Candidate, error)
}

type eventCandidateRepo struct{ db *sqlx.DB }

func NewEventCandidateRepository(db *sqlx.DB) EventCandidateRepository {
	return &eventCandidateRepo{db: db}
}

func (r *eventCandidateRepo) ListByEvent(ctx context.Context, eventID uuid.UUID) ([]model.EventCandidate, error) {
	var items []model.EventCandidate
	err := r.db.SelectContext(ctx, &items, `
		SELECT ec.*, c.full_name, c.photo_url, c.vision
		FROM event_candidates ec
		JOIN candidates c ON c.id = ec.candidate_id
		WHERE ec.event_id = $1
		ORDER BY ec.sort_order, ec.candidate_number`, eventID)
	return items, err
}

func (r *eventCandidateRepo) Assign(ctx context.Context, ec *model.EventCandidate) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO event_candidates (id, event_id, candidate_id, candidate_number, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (event_id, candidate_id) DO UPDATE
			SET candidate_number=EXCLUDED.candidate_number, sort_order=EXCLUDED.sort_order, updated_at=NOW()
		RETURNING id`,
		ec.ID, ec.EventID, ec.CandidateID, ec.CandidateNumber, ec.SortOrder,
	).Scan(&ec.ID)
}

func (r *eventCandidateRepo) UpdateOrder(ctx context.Context, id uuid.UUID, sortOrder int) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE event_candidates SET sort_order=$1, updated_at=NOW() WHERE id=$2`, sortOrder, id)
	return err
}

func (r *eventCandidateRepo) Remove(ctx context.Context, eventID, candidateID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM event_candidates WHERE event_id=$1 AND candidate_id=$2`, eventID, candidateID)
	return err
}

func (r *eventCandidateRepo) IsAssigned(ctx context.Context, eventID, candidateID uuid.UUID) (bool, error) {
	var count int
	err := r.db.GetContext(ctx, &count,
		`SELECT COUNT(*) FROM event_candidates WHERE event_id=$1 AND candidate_id=$2`, eventID, candidateID)
	return count > 0, err
}

func (r *eventCandidateRepo) GetCandidatesByEventIDs(ctx context.Context, eventID uuid.UUID) ([]model.Candidate, error) {
	var candidates []model.Candidate
	err := r.db.SelectContext(ctx, &candidates, `
		SELECT c.* FROM candidates c
		JOIN event_candidates ec ON ec.candidate_id = c.id
		WHERE ec.event_id = $1
		ORDER BY ec.sort_order, ec.candidate_number`, eventID)
	return candidates, err
}
