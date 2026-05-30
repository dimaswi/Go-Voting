package repository

import (
	"context"
	"time"

	"go-vote/internal/dto"
	"go-vote/internal/model"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type VoteRepository interface {
	FindByEventAndVoter(ctx context.Context, eventID, voterID uuid.UUID) (*model.Vote, error)
	CreateWithDetails(ctx context.Context, vote *model.Vote, details []model.VoteDetail, eventVoterUpdate func() error) error
	GetResultsByEvent(ctx context.Context, eventID uuid.UUID) ([]dto.CandidateResult, error)
	CreateSession(ctx context.Context, session *model.VotingSession) error
	FindSession(ctx context.Context, token string) (*model.VotingSession, error)
	MarkSessionUsed(ctx context.Context, token string) error
	CleanExpiredSessions(ctx context.Context) error
}

type voteRepo struct{ db *sqlx.DB }

func NewVoteRepository(db *sqlx.DB) VoteRepository {
	return &voteRepo{db: db}
}

func (r *voteRepo) FindByEventAndVoter(ctx context.Context, eventID, voterID uuid.UUID) (*model.Vote, error) {
	var v model.Vote
	err := r.db.GetContext(ctx, &v,
		`SELECT * FROM votes WHERE event_id=$1 AND voter_id=$2`, eventID, voterID)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// CreateWithDetails uses a transaction to atomically insert vote + vote_details + mark event_voter
func (r *voteRepo) CreateWithDetails(ctx context.Context, vote *model.Vote, details []model.VoteDetail, markVoted func() error) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert vote
	err = tx.QueryRowContext(ctx, `
		INSERT INTO votes (id, event_id, voter_id, submitted_at, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id`,
		vote.ID, vote.EventID, vote.VoterID, vote.SubmittedAt, vote.IPAddress, vote.UserAgent,
	).Scan(&vote.ID)
	if err != nil {
		return err
	}

	// Insert vote_details
	for _, detail := range details {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO vote_details (id, vote_id, candidate_id, event_id, created_at)
			VALUES ($1, $2, $3, $4, NOW())`,
			detail.ID, vote.ID, detail.CandidateID, detail.EventID)
		if err != nil {
			return err
		}
	}

	// Mark event_voter as voted
	_, err = tx.ExecContext(ctx, `
		UPDATE event_voters SET has_voted=TRUE, voted_at=$1 WHERE event_id=$2 AND voter_id=$3`,
		time.Now(), vote.EventID, vote.VoterID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *voteRepo) GetResultsByEvent(ctx context.Context, eventID uuid.UUID) ([]dto.CandidateResult, error) {
	var results []dto.CandidateResult
	err := r.db.SelectContext(ctx, &results, `
		SELECT
			ec.candidate_id,
			c.full_name,
			ec.candidate_number,
			c.photo_url,
			COUNT(vd.id) AS vote_count,
			RANK() OVER (ORDER BY COUNT(vd.id) DESC) AS rank
		FROM event_candidates ec
		JOIN candidates c ON c.id = ec.candidate_id
		LEFT JOIN vote_details vd ON vd.candidate_id = ec.candidate_id AND vd.event_id = ec.event_id
		WHERE ec.event_id = $1
		GROUP BY ec.candidate_id, c.full_name, ec.candidate_number, c.photo_url
		ORDER BY vote_count DESC, ec.candidate_number`, eventID)
	return results, err
}

func (r *voteRepo) CreateSession(ctx context.Context, s *model.VotingSession) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO voting_sessions (id, token, voter_id, event_id, expires_at, used, created_at)
		VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
		s.ID, s.Token, s.VoterID, s.EventID, s.ExpiresAt)
	return err
}

func (r *voteRepo) FindSession(ctx context.Context, token string) (*model.VotingSession, error) {
	var s model.VotingSession
	err := r.db.GetContext(ctx, &s,
		`SELECT * FROM voting_sessions WHERE token=$1 AND used=FALSE AND expires_at > NOW()`, token)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *voteRepo) MarkSessionUsed(ctx context.Context, token string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE voting_sessions SET used=TRUE WHERE token=$1`, token)
	return err
}

func (r *voteRepo) CleanExpiredSessions(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM voting_sessions WHERE expires_at < NOW()`)
	return err
}
