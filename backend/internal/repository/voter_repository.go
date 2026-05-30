package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go-vote/internal/model"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type VoterRepository interface {
	List(ctx context.Context, search string, status string, page, perPage int) ([]model.Voter, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.Voter, error)
	FindByUniqueCode(ctx context.Context, code string) (*model.Voter, error)
	Create(ctx context.Context, v *model.Voter) error
	Update(ctx context.Context, v *model.Voter) error
	UpdateQRCode(ctx context.Context, id uuid.UUID, qrURL string) error
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int, error)
	IsCodeUnique(ctx context.Context, code string) (bool, error)
	BulkCreate(ctx context.Context, voters []model.Voter) error
}

type voterRepo struct{ db *sqlx.DB }

func NewVoterRepository(db *sqlx.DB) VoterRepository {
	return &voterRepo{db: db}
}

func (r *voterRepo) List(ctx context.Context, search, status string, page, perPage int) ([]model.Voter, int, error) {
	offset := (page - 1) * perPage
	args := []interface{}{}
	where := []string{}
	i := 1

	if search != "" {
		where = append(where, fmt.Sprintf("(full_name ILIKE $%d OR unique_code ILIKE $%d)", i, i+1))
		s := "%" + search + "%"
		args = append(args, s, s)
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

	var total int
	if err := r.db.GetContext(ctx, &total,
		fmt.Sprintf(`SELECT COUNT(*) FROM voters %s`, whereClause), args...); err != nil {
		return nil, 0, err
	}

	var voters []model.Voter
	query := fmt.Sprintf(`SELECT * FROM voters %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereClause, i, i+1)
	args = append(args, perPage, offset)
	if err := r.db.SelectContext(ctx, &voters, query, args...); err != nil {
		return nil, 0, err
	}
	return voters, total, nil
}

func (r *voterRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Voter, error) {
	var v model.Voter
	err := r.db.GetContext(ctx, &v, `SELECT * FROM voters WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *voterRepo) FindByUniqueCode(ctx context.Context, code string) (*model.Voter, error) {
	var v model.Voter
	err := r.db.GetContext(ctx, &v, `SELECT * FROM voters WHERE unique_code=$1`, code)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *voterRepo) Create(ctx context.Context, v *model.Voter) error {
	return r.db.QueryRowContext(ctx, `
		INSERT INTO voters
			(id, full_name, identity_number, phone, email, group_name,
			 unique_code, qr_code_url, is_anonymous, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
		RETURNING id, created_at, updated_at`,
		v.ID, v.FullName, v.IdentityNumber, v.Phone, v.Email, v.GroupName,
		v.UniqueCode, v.QRCodeURL, v.IsAnonymous, v.Status,
	).Scan(&v.ID, &v.CreatedAt, &v.UpdatedAt)
}

func (r *voterRepo) Update(ctx context.Context, v *model.Voter) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE voters SET
			full_name=$1, identity_number=$2, phone=$3, email=$4,
			group_name=$5, is_anonymous=$6, updated_at=NOW()
		WHERE id=$7`,
		v.FullName, v.IdentityNumber, v.Phone, v.Email,
		v.GroupName, v.IsAnonymous, v.ID,
	)
	return err
}

func (r *voterRepo) UpdateQRCode(ctx context.Context, id uuid.UUID, qrURL string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE voters SET qr_code_url=$1, updated_at=NOW() WHERE id=$2`, qrURL, id)
	return err
}

func (r *voterRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM voters WHERE id=$1`, id)
	return err
}

func (r *voterRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `SELECT COUNT(*) FROM voters`)
	return count, err
}

func (r *voterRepo) IsCodeUnique(ctx context.Context, code string) (bool, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `SELECT COUNT(*) FROM voters WHERE unique_code=$1`, code)
	return count == 0, err
}

func (r *voterRepo) BulkCreate(ctx context.Context, voters []model.Voter) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, v := range voters {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO voters
				(id, full_name, identity_number, phone, email, group_name,
				 unique_code, is_anonymous, status, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
			ON CONFLICT (unique_code) DO NOTHING`,
			v.ID, v.FullName, v.IdentityNumber, v.Phone, v.Email, v.GroupName,
			v.UniqueCode, v.IsAnonymous, v.Status,
		)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ============================================================
// Event Voter Repository
// ============================================================

type EventVoterRepository interface {
	ListByEvent(ctx context.Context, eventID uuid.UUID, search, votedFilter string, page, perPage int) ([]model.EventVoter, int, error)
	FindByEventAndVoter(ctx context.Context, eventID, voterID uuid.UUID) (*model.EventVoter, error)
	Assign(ctx context.Context, ev *model.EventVoter) error
	BulkAssign(ctx context.Context, eventID uuid.UUID, voterIDs []uuid.UUID) error
	Remove(ctx context.Context, eventID, voterID uuid.UUID) error
	MarkVoted(ctx context.Context, eventID, voterID uuid.UUID, votedAt time.Time) error
	UpdateStatus(ctx context.Context, eventID, voterID uuid.UUID, status model.EventVoterStatus) error
	GetActiveEventsByVoter(ctx context.Context, voterID uuid.UUID) ([]model.VotingEvent, error)
	CountVoted(ctx context.Context) (int, error)
	CountTotal(ctx context.Context) (int, error)
}

type eventVoterRepo struct{ db *sqlx.DB }

func NewEventVoterRepository(db *sqlx.DB) EventVoterRepository {
	return &eventVoterRepo{db: db}
}

func (r *eventVoterRepo) ListByEvent(ctx context.Context, eventID uuid.UUID, search, votedFilter string, page, perPage int) ([]model.EventVoter, int, error) {
	offset := (page - 1) * perPage
	args := []interface{}{eventID}
	where := []string{"ev.event_id = $1"}
	i := 2

	if search != "" {
		where = append(where, fmt.Sprintf("(v.full_name ILIKE $%d OR v.unique_code ILIKE $%d)", i, i+1))
		s := "%" + search + "%"
		args = append(args, s, s)
		i += 2
	}
	if votedFilter == "voted" {
		where = append(where, fmt.Sprintf("ev.has_voted = TRUE"))
	} else if votedFilter == "not_voted" {
		where = append(where, fmt.Sprintf("ev.has_voted = FALSE"))
	}

	whereClause := "WHERE " + strings.Join(where, " AND ")

	var total int
	if err := r.db.GetContext(ctx, &total,
		fmt.Sprintf(`SELECT COUNT(*) FROM event_voters ev JOIN voters v ON v.id = ev.voter_id %s`, whereClause),
		args...); err != nil {
		return nil, 0, err
	}

	var voters []model.EventVoter
	query := fmt.Sprintf(`
		SELECT ev.*, v.full_name, v.identity_number, v.group_name, v.unique_code,
			   v.qr_code_url, v.is_anonymous, v.status AS voter_status
		FROM event_voters ev
		JOIN voters v ON v.id = ev.voter_id
		%s
		ORDER BY ev.assigned_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, i, i+1)
	args = append(args, perPage, offset)

	if err := r.db.SelectContext(ctx, &voters, query, args...); err != nil {
		return nil, 0, err
	}
	return voters, total, nil
}

func (r *eventVoterRepo) FindByEventAndVoter(ctx context.Context, eventID, voterID uuid.UUID) (*model.EventVoter, error) {
	var ev model.EventVoter
	err := r.db.GetContext(ctx, &ev,
		`SELECT * FROM event_voters WHERE event_id=$1 AND voter_id=$2`, eventID, voterID)
	if err != nil {
		return nil, err
	}
	return &ev, nil
}

func (r *eventVoterRepo) Assign(ctx context.Context, ev *model.EventVoter) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO event_voters (id, event_id, voter_id, assigned_at, has_voted, status)
		VALUES ($1, $2, $3, NOW(), FALSE, 'active')
		ON CONFLICT (event_id, voter_id) DO NOTHING`,
		ev.ID, ev.EventID, ev.VoterID)
	return err
}

func (r *eventVoterRepo) BulkAssign(ctx context.Context, eventID uuid.UUID, voterIDs []uuid.UUID) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, vid := range voterIDs {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO event_voters (id, event_id, voter_id, assigned_at, has_voted, status)
			VALUES (gen_random_uuid(), $1, $2, NOW(), FALSE, 'active')
			ON CONFLICT (event_id, voter_id) DO NOTHING`, eventID, vid)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *eventVoterRepo) Remove(ctx context.Context, eventID, voterID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM event_voters WHERE event_id=$1 AND voter_id=$2`, eventID, voterID)
	return err
}

func (r *eventVoterRepo) MarkVoted(ctx context.Context, eventID, voterID uuid.UUID, votedAt time.Time) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE event_voters SET has_voted=TRUE, voted_at=$1 WHERE event_id=$2 AND voter_id=$3`,
		votedAt, eventID, voterID)
	return err
}

func (r *eventVoterRepo) UpdateStatus(ctx context.Context, eventID, voterID uuid.UUID, status model.EventVoterStatus) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE event_voters SET status=$1 WHERE event_id=$2 AND voter_id=$3`, status, eventID, voterID)
	return err
}

func (r *eventVoterRepo) GetActiveEventsByVoter(ctx context.Context, voterID uuid.UUID) ([]model.VotingEvent, error) {
	var events []model.VotingEvent
	err := r.db.SelectContext(ctx, &events, `
		SELECT ve.* FROM voting_events ve
		JOIN event_voters ev ON ev.event_id = ve.id
		WHERE ev.voter_id = $1
		  AND ev.status = 'active'
		  AND ev.has_voted = FALSE
		  AND ve.status = 'active'
		  AND ve.start_at <= NOW()
		  AND ve.end_at >= NOW()
		ORDER BY ve.start_at`, voterID)
	return events, err
}

func (r *eventVoterRepo) CountVoted(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `SELECT COUNT(DISTINCT voter_id) FROM event_voters WHERE has_voted = TRUE`)
	return count, err
}

func (r *eventVoterRepo) CountTotal(ctx context.Context) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `SELECT COUNT(*) FROM event_voters`)
	return count, err
}
