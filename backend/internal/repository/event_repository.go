package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"go-vote/internal/dto"
	"go-vote/internal/model"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type EventRepository interface {
	List(ctx context.Context, search string, status string, page, perPage int) ([]model.VotingEvent, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.VotingEvent, error)
	FindBySlug(ctx context.Context, slug string) (*model.VotingEvent, error)
	FindByCode(ctx context.Context, code string) (*model.VotingEvent, error)
	Create(ctx context.Context, event *model.VotingEvent) error
	Update(ctx context.Context, event *model.VotingEvent) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status model.EventStatus) error
	Delete(ctx context.Context, id uuid.UUID) error
	CountByStatus(ctx context.Context) (map[string]int, error)
	GetDashboardStats(ctx context.Context) (*dto.DashboardStats, error)
}

type eventRepo struct{ db *sqlx.DB }

func NewEventRepository(db *sqlx.DB) EventRepository {
	return &eventRepo{db: db}
}

func (r *eventRepo) List(ctx context.Context, search, status string, page, perPage int) ([]model.VotingEvent, int, error) {
	offset := (page - 1) * perPage
	args := []interface{}{}
	where := []string{}
	i := 1

	if search != "" {
		where = append(where, fmt.Sprintf("(name ILIKE $%d OR code ILIKE $%d)", i, i+1))
		search = "%" + search + "%"
		args = append(args, search, search)
		i += 2
	}
	if status != "" {
		where = append(where, fmt.Sprintf("status = $%d", i))
		args = append(args, status)
		i++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM voting_events %s`, whereClause)
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT ve.*,
			(SELECT COUNT(*) FROM event_candidates ec WHERE ec.event_id = ve.id) AS total_candidates,
			(SELECT COUNT(*) FROM event_voters ev WHERE ev.event_id = ve.id) AS total_voters,
			(SELECT COUNT(*) FROM event_voters ev WHERE ev.event_id = ve.id AND ev.has_voted = TRUE) AS total_voted
		FROM voting_events ve
		%s
		ORDER BY ve.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, i, i+1)
	args = append(args, perPage, offset)

	var events []model.VotingEvent
	if err := r.db.SelectContext(ctx, &events, query, args...); err != nil {
		return nil, 0, err
	}
	return events, total, nil
}

func (r *eventRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.VotingEvent, error) {
	var event model.VotingEvent
	err := r.db.GetContext(ctx, &event, `
		SELECT ve.*,
			(SELECT COUNT(*) FROM event_candidates ec WHERE ec.event_id = ve.id) AS total_candidates,
			(SELECT COUNT(*) FROM event_voters ev WHERE ev.event_id = ve.id) AS total_voters,
			(SELECT COUNT(*) FROM event_voters ev WHERE ev.event_id = ve.id AND ev.has_voted = TRUE) AS total_voted
		FROM voting_events ve WHERE ve.id = $1`, id)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepo) FindBySlug(ctx context.Context, slug string) (*model.VotingEvent, error) {
	var event model.VotingEvent
	err := r.db.GetContext(ctx, &event, `SELECT * FROM voting_events WHERE slug = $1`, slug)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepo) FindByCode(ctx context.Context, code string) (*model.VotingEvent, error) {
	var event model.VotingEvent
	err := r.db.GetContext(ctx, &event, `SELECT * FROM voting_events WHERE code = $1`, code)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepo) Create(ctx context.Context, event *model.VotingEvent) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO voting_events
			(id, name, slug, code, description, banner_url, start_at, end_at, status,
			 min_choices, max_choices, allow_multiple_choices, is_result_public, created_at, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
		RETURNING id, created_at, updated_at`,
		event.ID, event.Name, event.Slug, event.Code, event.Description,
		event.BannerURL, event.StartAt, event.EndAt, event.Status,
		event.MinChoices, event.MaxChoices, event.AllowMultipleChoices,
		event.IsResultPublic,
	).Scan(&event.ID, &event.CreatedAt, &event.UpdatedAt)
}

func (r *eventRepo) Update(ctx context.Context, event *model.VotingEvent) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE voting_events SET
			name=$1, description=$2, banner_url=$3, start_at=$4, end_at=$5,
			min_choices=$6, max_choices=$7, allow_multiple_choices=$8,
			is_result_public=$9, updated_at=NOW()
		WHERE id=$10`,
		event.Name, event.Description, event.BannerURL, event.StartAt, event.EndAt,
		event.MinChoices, event.MaxChoices, event.AllowMultipleChoices,
		event.IsResultPublic, event.ID,
	)
	return err
}

func (r *eventRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status model.EventStatus) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE voting_events SET status=$1, updated_at=NOW() WHERE id=$2`, status, id)
	return err
}

func (r *eventRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM voting_events WHERE id=$1`, id)
	return err
}

func (r *eventRepo) CountByStatus(ctx context.Context) (map[string]int, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT status, COUNT(*) FROM voting_events GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string]int{}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		result[status] = count
	}
	return result, nil
}

func (r *eventRepo) GetDashboardStats(ctx context.Context) (*dto.DashboardStats, error) {
	var stats dto.DashboardStats

	// Total and Active Events
	err := r.db.GetContext(ctx, &stats, `
		SELECT 
			COUNT(*) AS total_events,
			COUNT(*) FILTER (WHERE status = 'active') AS active_events
		FROM voting_events`)
	if err != nil {
		return nil, err
	}

	// Total Candidates
	err = r.db.GetContext(ctx, &stats.TotalCandidates, `SELECT COUNT(*) FROM candidates`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Total Voters
	err = r.db.GetContext(ctx, &stats.TotalVoters, `SELECT COUNT(*) FROM voters`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Total Voted
	err = r.db.GetContext(ctx, &stats.TotalVoted, `SELECT COUNT(DISTINCT voter_id) FROM event_voters WHERE has_voted = TRUE`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	stats.TotalNotVoted = stats.TotalVoters - stats.TotalVoted

	// Monthly Data
	var monthlyData []dto.MonthlyVoterStat
	err = r.db.SelectContext(ctx, &monthlyData, `
		SELECT TO_CHAR(voted_at, 'Mon') as name, COUNT(voter_id) as voters
		FROM event_voters 
		WHERE has_voted = TRUE 
		  AND voted_at >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY TO_CHAR(voted_at, 'Mon'), DATE_TRUNC('month', voted_at)
		ORDER BY DATE_TRUNC('month', voted_at)
	`)
	if err != nil && err != sql.ErrNoRows {
		// Log or ignore
	}
	if monthlyData == nil {
		monthlyData = []dto.MonthlyVoterStat{}
	}
	stats.MonthlyData = monthlyData

	return &stats, nil
}
