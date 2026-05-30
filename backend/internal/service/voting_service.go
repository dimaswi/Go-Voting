package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"go-vote/internal/config"
	"go-vote/internal/dto"
	"go-vote/internal/model"
	"go-vote/internal/repository"
	"go-vote/internal/utils"

	"github.com/google/uuid"
)

var (
	ErrSessionNotFound     = errors.New("Sesi voting sudah expired!")
	ErrSessionAlreadyUsed  = errors.New("Sesi voting sudah digunakan!")
	ErrEventNotActive      = errors.New("Event voting belum aktif!")
	ErrEventExpired        = errors.New("Event voting sudah berakhir!")
	ErrInvalidChoiceCount  = errors.New("Jumlah pilihan tidak valid!")
	ErrCandidateNotInEvent = errors.New("salah satu atau lebih kandidat tidak ada di event ini!")
)

type VotingService struct {
	voterRepo      repository.VoterRepository
	eventRepo      repository.EventRepository
	eventVoterRepo repository.EventVoterRepository
	eventCandRepo  repository.EventCandidateRepository
	voteRepo       repository.VoteRepository
	cfg            *config.Config
}

func NewVotingService(
	voterRepo repository.VoterRepository,
	eventRepo repository.EventRepository,
	eventVoterRepo repository.EventVoterRepository,
	eventCandRepo repository.EventCandidateRepository,
	voteRepo repository.VoteRepository,
	cfg *config.Config,
) *VotingService {
	return &VotingService{
		voterRepo:      voterRepo,
		eventRepo:      eventRepo,
		eventVoterRepo: eventVoterRepo,
		eventCandRepo:  eventCandRepo,
		voteRepo:       voteRepo,
		cfg:            cfg,
	}
}

// ValidateCode validates a voter's unique code and returns session info
func (s *VotingService) ValidateCode(ctx context.Context, code string) (*dto.ValidateCodeResponse, error) {
	// Find voter by unique code
	voter, err := s.voterRepo.FindByUniqueCode(ctx, code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("Pemilih tidak ditemukan!")
		}
		return nil, err
	}

	if voter.Status == model.VoterStatusBlocked {
		return nil, ErrVoterBlocked
	}

	// Get active events for this voter
	events, err := s.eventVoterRepo.GetActiveEventsByVoter(ctx, voter.ID)
	if err != nil {
		return nil, err
	}

	if len(events) == 0 {
		return nil, errors.New("Tidak ada voting yang tersedia untuk pemilih ini")
	}

	// Create session for the first available event (or let frontend choose)
	firstEvent := events[0]

	// Generate session token
	token, err := utils.GenerateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	session := &model.VotingSession{
		ID:        uuid.New(),
		Token:     token,
		VoterID:   voter.ID,
		EventID:   firstEvent.ID,
		ExpiresAt: time.Now().Add(30 * time.Minute),
	}
	if err := s.voteRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to create voting session: %w", err)
	}

	publicEvents := make([]dto.PublicEventInfo, len(events))
	for i, e := range events {
		ev, _ := s.eventVoterRepo.FindByEventAndVoter(ctx, e.ID, voter.ID)
		hasVoted := false
		if ev != nil {
			hasVoted = ev.HasVoted
		}
		publicEvents[i] = dto.PublicEventInfo{
			ID:                   e.ID,
			Name:                 e.Name,
			Description:          e.Description,
			StartAt:              e.StartAt,
			EndAt:                e.EndAt,
			MinChoices:           e.MinChoices,
			MaxChoices:           e.MaxChoices,
			AllowMultipleChoices: e.AllowMultipleChoices,
			HasVoted:             hasVoted,
		}
	}

	voterName := voter.FullName
	if voter.IsAnonymous {
		voterName = "Pemilih Anonim"
	}

	return &dto.ValidateCodeResponse{
		Token:     token,
		ExpiresAt: session.ExpiresAt,
		Voter: dto.PublicVoterInfo{
			ID:          voter.ID,
			FullName:    voterName,
			IsAnonymous: voter.IsAnonymous,
		},
		Events: publicEvents,
	}, nil
}

// GetSession returns session info for a token
func (s *VotingService) GetSession(ctx context.Context, token string) (*model.VotingSession, error) {
	session, err := s.voteRepo.FindSession(ctx, token)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return session, nil
}

// GetEventCandidates returns candidates for a specific event (public view)
func (s *VotingService) GetEventCandidates(ctx context.Context, token string, eventID uuid.UUID) ([]model.EventCandidate, error) {
	session, err := s.GetSession(ctx, token)
	if err != nil {
		return nil, err
	}
	_ = session // session is valid

	candidates, err := s.eventCandRepo.ListByEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}
	return candidates, nil
}

// SubmitVote handles the voting submission with full validation
func (s *VotingService) SubmitVote(ctx context.Context, token string, eventID uuid.UUID, req dto.SubmitVoteRequest, ipAddr, userAgent string) error {
	// 1. Validate session
	session, err := s.voteRepo.FindSession(ctx, token)
	if err != nil {
		return ErrSessionNotFound
	}
	if session.Used {
		return ErrSessionAlreadyUsed
	}
	if session.EventID != eventID {
		return errors.New("Sesi voting tidak sesuai dengan event!")
	}

	// 2. Get voter
	voter, err := s.voterRepo.FindByID(ctx, session.VoterID)
	if err != nil {
		return ErrVoterNotFound
	}
	if voter.Status == model.VoterStatusBlocked {
		return ErrVoterBlocked
	}

	// 3. Get event
	event, err := s.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return ErrEventNotFound
	}
	if event.Status != model.EventStatusActive {
		return ErrEventNotActive
	}
	if time.Now().After(event.EndAt) {
		return ErrEventExpired
	}

	// 4. Check voter assignment
	eventVoter, err := s.eventVoterRepo.FindByEventAndVoter(ctx, eventID, voter.ID)
	if err != nil {
		return ErrVoterNotAssigned
	}
	if eventVoter.Status == model.EventVoterStatusBlocked {
		return ErrEventVoterBlocked
	}
	if eventVoter.HasVoted {
		return ErrVoterAlreadyVoted
	}

	// 5. Validate choice count
	choiceCount := len(req.CandidateIDs)
	if choiceCount < event.MinChoices {
		return fmt.Errorf("minimal %d pilihan, tapi kamu hanya memilih %d", event.MinChoices, choiceCount)
	}
	if choiceCount > event.MaxChoices {
		return fmt.Errorf("maksimal %d pilihan, tapi kamu hanya memilih %d", event.MaxChoices, choiceCount)
	}

	// 6. Validate candidates belong to event
	eventCandidates, err := s.eventCandRepo.ListByEvent(ctx, eventID)
	if err != nil {
		return err
	}
	validCandIDs := make(map[uuid.UUID]bool)
	for _, ec := range eventCandidates {
		validCandIDs[ec.CandidateID] = true
	}
	for _, cid := range req.CandidateIDs {
		if !validCandIDs[cid] {
			return ErrCandidateNotInEvent
		}
	}

	// 7. Build vote and details
	now := time.Now()
	ipStr := ipAddr
	uaStr := userAgent
	vote := &model.Vote{
		ID:          uuid.New(),
		EventID:     eventID,
		VoterID:     voter.ID,
		SubmittedAt: now,
		IPAddress:   &ipStr,
		UserAgent:   &uaStr,
	}

	details := make([]model.VoteDetail, len(req.CandidateIDs))
	for i, cid := range req.CandidateIDs {
		details[i] = model.VoteDetail{
			ID:          uuid.New(),
			VoteID:      vote.ID,
			CandidateID: cid,
			EventID:     eventID,
		}
	}

	// 8. Submit in transaction
	if err := s.voteRepo.CreateWithDetails(ctx, vote, details, nil); err != nil {
		return fmt.Errorf("Gagal melakukan voting: %w", err)
	}

	// 9. Mark session as used
	_ = s.voteRepo.MarkSessionUsed(ctx, token)

	return nil
}

// GetResults returns voting results for an event
func (s *VotingService) GetResults(ctx context.Context, eventID uuid.UUID) (*dto.EventResultResponse, error) {
	event, err := s.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, ErrEventNotFound
	}

	results, err := s.voteRepo.GetResultsByEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}

	totalVoters := event.TotalVoters
	totalVoted := event.TotalVoted
	totalNotVoted := totalVoters - totalVoted
	pct := 0.0
	if totalVoters > 0 {
		pct = float64(totalVoted) / float64(totalVoters) * 100
	}

	// Calculate percentages
	totalVotes := 0
	for _, r := range results {
		totalVotes += r.VoteCount
	}
	for i := range results {
		if totalVotes > 0 {
			results[i].Percentage = float64(results[i].VoteCount) / float64(totalVotes) * 100
		}
	}

	return &dto.EventResultResponse{
		Event: dto.EventSummary{
			ID:     event.ID,
			Name:   event.Name,
			Status: string(event.Status),
		},
		TotalVoters:      totalVoters,
		TotalVoted:       totalVoted,
		TotalNotVoted:    totalNotVoted,
		ParticipationPct: pct,
		Candidates:       results,
	}, nil
}
