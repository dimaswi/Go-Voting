package service

import (
	"context"
	"database/sql"
	"errors"

	"go-vote/internal/config"
	"go-vote/internal/dto"
	"go-vote/internal/model"
	"go-vote/internal/repository"
	"go-vote/internal/utils"

	"github.com/google/uuid"
)

var (
	ErrVoterNotFound      = errors.New("voter not found")
	ErrVoterBlocked       = errors.New("voter is blocked")
	ErrVoterAlreadyVoted  = errors.New("voter has already voted in this event")
	ErrVoterNotAssigned   = errors.New("voter is not assigned to this event")
	ErrEventVoterBlocked  = errors.New("voter is blocked from this event")
)

type VoterService struct {
	voterRepo      repository.VoterRepository
	eventVoterRepo repository.EventVoterRepository
	cfg            *config.Config
}

func NewVoterService(
	voterRepo repository.VoterRepository,
	eventVoterRepo repository.EventVoterRepository,
	cfg *config.Config,
) *VoterService {
	return &VoterService{
		voterRepo:      voterRepo,
		eventVoterRepo: eventVoterRepo,
		cfg:            cfg,
	}
}

func (s *VoterService) List(ctx context.Context, search, status string, page, perPage int) ([]model.Voter, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.voterRepo.List(ctx, search, status, page, perPage)
}

func (s *VoterService) FindByID(ctx context.Context, id uuid.UUID) (*model.Voter, error) {
	voter, err := s.voterRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrVoterNotFound
		}
		return nil, err
	}
	return voter, nil
}

func (s *VoterService) Create(ctx context.Context, req dto.CreateVoterRequest) (*model.Voter, error) {
	// Generate unique code
	code, err := s.generateUniqueCode(ctx)
	if err != nil {
		return nil, err
	}

	voter := &model.Voter{
		ID:             uuid.New(),
		FullName:       req.FullName,
		IdentityNumber: req.IdentityNumber,
		Phone:          req.Phone,
		Email:          req.Email,
		GroupName:      req.GroupName,
		UniqueCode:     code,
		IsAnonymous:    req.IsAnonymous,
		Status:         model.VoterStatusActive,
	}

	if err := s.voterRepo.Create(ctx, voter); err != nil {
		return nil, err
	}

	// Auto-generate QR code
	qrContent := voter.UniqueCode
	qrURL, err := utils.GenerateQRCode(qrContent, s.cfg.Upload.Dir, voter.ID.String())
	if err == nil {
		_ = s.voterRepo.UpdateQRCode(ctx, voter.ID, qrURL)
		voter.QRCodeURL = &qrURL
	}

	return voter, nil
}

func (s *VoterService) Update(ctx context.Context, id uuid.UUID, req dto.UpdateVoterRequest) (*model.Voter, error) {
	voter, err := s.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	voter.FullName = req.FullName
	voter.IdentityNumber = req.IdentityNumber
	voter.Phone = req.Phone
	voter.Email = req.Email
	voter.GroupName = req.GroupName
	voter.IsAnonymous = req.IsAnonymous

	if err := s.voterRepo.Update(ctx, voter); err != nil {
		return nil, err
	}
	return voter, nil
}

func (s *VoterService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.FindByID(ctx, id)
	if err != nil {
		return err
	}
	return s.voterRepo.Delete(ctx, id)
}

func (s *VoterService) RegenerateQR(ctx context.Context, id uuid.UUID) (*model.Voter, error) {
	voter, err := s.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	qrURL, err := utils.GenerateQRCode(voter.UniqueCode, s.cfg.Upload.Dir, voter.ID.String()+"_qr")
	if err != nil {
		return nil, err
	}

	if err := s.voterRepo.UpdateQRCode(ctx, voter.ID, qrURL); err != nil {
		return nil, err
	}
	voter.QRCodeURL = &qrURL
	return voter, nil
}

// AssignToEvent assigns voters to an event
func (s *VoterService) AssignToEvent(ctx context.Context, eventID uuid.UUID, voterIDs []uuid.UUID) error {
	return s.eventVoterRepo.BulkAssign(ctx, eventID, voterIDs)
}

// ListByEvent lists voters assigned to an event
func (s *VoterService) ListByEvent(ctx context.Context, eventID uuid.UUID, search, votedFilter string, page, perPage int) ([]model.EventVoter, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.eventVoterRepo.ListByEvent(ctx, eventID, search, votedFilter, page, perPage)
}

func (s *VoterService) generateUniqueCode(ctx context.Context) (string, error) {
	for i := 0; i < 10; i++ {
		code, err := utils.GenerateUniqueCode(16)
		if err != nil {
			return "", err
		}
		isUnique, err := s.voterRepo.IsCodeUnique(ctx, code)
		if err != nil {
			return "", err
		}
		if isUnique {
			return code, nil
		}
	}
	return "", errors.New("failed to generate unique code after 10 attempts")
}
