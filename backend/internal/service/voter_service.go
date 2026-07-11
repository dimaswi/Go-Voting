package service

import (
	"bytes"
	"context"
	"database/sql"
	"errors"

	"go-vote/internal/config"
	"go-vote/internal/dto"
	"go-vote/internal/model"
	"go-vote/internal/repository"
	"go-vote/internal/utils"

	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
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
	if perPage < 1 || perPage > 1000000 {
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

// RemoveFromEvent removes a voter from an event
func (s *VoterService) RemoveFromEvent(ctx context.Context, eventID, voterID uuid.UUID) error {
	return s.eventVoterRepo.Remove(ctx, eventID, voterID)
}

// ListByEvent lists voters assigned to an event
func (s *VoterService) ListByEvent(ctx context.Context, eventID uuid.UUID, search, votedFilter string, page, perPage int) ([]model.EventVoter, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 1000000 {
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

// GenerateBulkQRPDF generates a PDF containing QR codes for selected voters
func (s *VoterService) GenerateBulkQRPDF(ctx context.Context, voterIDs []uuid.UUID) (*bytes.Buffer, error) {
	if len(voterIDs) == 0 {
		return nil, errors.New("no voters selected")
	}

	var voters []model.Voter
	for _, id := range voterIDs {
		v, err := s.voterRepo.FindByID(ctx, id)
		if err == nil {
			voters = append(voters, *v)
		}
	}

	if len(voters) == 0 {
		return nil, errors.New("no valid voters found")
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(false, 0)
	pdf.AddPage()

	cols := 4
	rows := 5

	pageWidth, pageHeight := pdf.GetPageSize()

	qrSize := 31.0
	boxWidth := 46.0
	boxHeight := 48.0

	gapX := 2.5
	gapY := 3.0

	colWidth := boxWidth + gapX
	rowHeight := boxHeight + gapY

	gridWidth := float64(cols)*colWidth - gapX
	gridHeight := float64(rows)*rowHeight - gapY

	marginX := (pageWidth - gridWidth) / 2.0
	marginY := (pageHeight - gridHeight) / 2.0

	idx := 0
	for _, v := range voters {
		if idx > 0 && idx%(cols*rows) == 0 {
			pdf.AddPage()
			idx = 0
		}

		col := idx % cols
		row := idx / cols

		x := marginX + float64(col)*colWidth
		y := marginY + float64(row)*rowHeight

		qr, err := qrcode.New(v.UniqueCode, qrcode.Medium)
		if err != nil {
			continue
		}
		qr.DisableBorder = true
		qrBytes, err := qr.PNG(256)
		if err != nil {
			continue
		}

		opt := gofpdf.ImageOptions{ImageType: "PNG"}
		imageName := v.ID.String()
		pdf.RegisterImageOptionsReader(imageName, opt, bytes.NewReader(qrBytes))

		qrX := x + (boxWidth-qrSize)/2.0
		qrY := y + 3.5

		pdf.ImageOptions(imageName, qrX, qrY, qrSize, qrSize, false, opt, 0, "")

		name := v.FullName
		groupName := "-"
		if v.GroupName != nil && *v.GroupName != "" {
			groupName = *v.GroupName
		}

		textY := qrY + qrSize + 2.0

		pdf.SetFont("Arial", "B", 9)
		if pdf.GetStringWidth(name) > boxWidth-2 {
			pdf.SetFont("Arial", "B", 8)
			if pdf.GetStringWidth(name) > boxWidth-2 {
				pdf.SetFont("Arial", "B", 7)
				if pdf.GetStringWidth(name) > boxWidth-2 {
					pdf.SetFont("Arial", "B", 6)
				}
			}
		}
		pdf.SetXY(x, textY)
		pdf.CellFormat(boxWidth, 4.0, name, "", 0, "C", false, 0, "")

		pdf.SetFont("Arial", "I", 8)
		if pdf.GetStringWidth(groupName) > boxWidth-2 {
			pdf.SetFont("Arial", "I", 7)
			if pdf.GetStringWidth(groupName) > boxWidth-2 {
				pdf.SetFont("Arial", "I", 6)
			}
		}
		pdf.SetXY(x, textY+3.5)
		pdf.CellFormat(boxWidth, 4.0, groupName, "", 0, "C", false, 0, "")

		pdf.SetFont("Arial", "", 8)
		pdf.SetXY(x, textY+7.5)
		pdf.CellFormat(boxWidth, 4.0, "Kode: "+v.UniqueCode, "", 0, "C", false, 0, "")

		// Draw border
		pdf.Rect(x, y, boxWidth, boxHeight, "D")

		idx++
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return &buf, nil
}
