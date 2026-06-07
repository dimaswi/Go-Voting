package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"go-vote/internal/dto"
	"go-vote/internal/model"
	"go-vote/internal/repository"
	"go-vote/internal/utils"

	"github.com/google/uuid"
)

var (
	ErrEventNotFound   = errors.New("event not found")
	ErrSlugExists      = errors.New("event with this slug already exists")
	ErrCodeExists      = errors.New("event code already exists")
	ErrInvalidStatus   = errors.New("invalid status transition")
	ErrEventNotDraft   = errors.New("event can only be edited in draft status")
)

type EventService struct {
	eventRepo repository.EventRepository
}

func NewEventService(eventRepo repository.EventRepository) *EventService {
	return &EventService{eventRepo: eventRepo}
}

func (s *EventService) List(ctx context.Context, search, status string, page, perPage int) ([]model.VotingEvent, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.eventRepo.List(ctx, search, status, page, perPage)
}

func (s *EventService) FindByID(ctx context.Context, id uuid.UUID) (*model.VotingEvent, error) {
	event, err := s.eventRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	return event, nil
}

func (s *EventService) Create(ctx context.Context, req dto.CreateEventRequest) (*model.VotingEvent, error) {
	if req.MinChoices > req.MaxChoices {
		return nil, fmt.Errorf("min_choices (%d) cannot be greater than max_choices (%d)", req.MinChoices, req.MaxChoices)
	}
	if req.EndAt.Before(req.StartAt) {
		return nil, errors.New("end_at must be after start_at")
	}

	// Generate slug and code
	slug := utils.GenerateSlug(req.Name)
	code, err := utils.GenerateEventCode()
	if err != nil {
		return nil, fmt.Errorf("failed to generate event code: %w", err)
	}

	event := &model.VotingEvent{
		ID:                   uuid.New(),
		Name:                 req.Name,
		Slug:                 slug,
		Code:                 code,
		Description:          req.Description,
		StartAt:              req.StartAt,
		EndAt:                req.EndAt,
		Status:               model.EventStatusDraft,
		MinChoices:           req.MinChoices,
		MaxChoices:           req.MaxChoices,
		AllowMultipleChoices: req.AllowMultipleChoices,
		IsResultPublic:       req.IsResultPublic,
	}

	if err := s.eventRepo.Create(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *EventService) Update(ctx context.Context, id uuid.UUID, req dto.UpdateEventRequest) (*model.VotingEvent, error) {
	event, err := s.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if event.Name != "" && req.Name != "" {
		event.Name = req.Name
	}
	if req.Description != nil {
		event.Description = req.Description
	}
	if !req.StartAt.IsZero() {
		event.StartAt = req.StartAt
	}
	if !req.EndAt.IsZero() {
		event.EndAt = req.EndAt
	}
	if req.MinChoices > 0 {
		event.MinChoices = req.MinChoices
	}
	if req.MaxChoices > 0 {
		event.MaxChoices = req.MaxChoices
	}
	if req.AllowMultipleChoices != nil {
		event.AllowMultipleChoices = *req.AllowMultipleChoices
	}
	if req.IsResultPublic != nil {
		event.IsResultPublic = *req.IsResultPublic
	}

	if event.MinChoices > event.MaxChoices {
		return nil, fmt.Errorf("min_choices cannot be greater than max_choices")
	}

	if err := s.eventRepo.Update(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *EventService) UpdateStatus(ctx context.Context, id uuid.UUID, newStatus string) error {
	event, err := s.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Validate status transitions
	validTransitions := map[model.EventStatus][]model.EventStatus{
		model.EventStatusDraft:    {model.EventStatusActive},
		model.EventStatusActive:   {model.EventStatusFinished, model.EventStatusClosed},
		model.EventStatusFinished: {model.EventStatusClosed},
		model.EventStatusClosed:   {},
	}

	target := model.EventStatus(newStatus)
	allowed := validTransitions[event.Status]
	ok := false
	for _, s := range allowed {
		if s == target {
			ok = true
			break
		}
	}
	if !ok {
		return fmt.Errorf("cannot transition from %s to %s", event.Status, target)
	}

	return s.eventRepo.UpdateStatus(ctx, id, target)
}

func (s *EventService) Delete(ctx context.Context, id uuid.UUID) error {
	event, err := s.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if event.Status != model.EventStatusDraft {
		return errors.New("only draft events can be deleted")
	}
	return s.eventRepo.Delete(ctx, id)
}

func (s *EventService) GetDashboardStats(ctx context.Context) (*dto.DashboardStats, error) {
	return s.eventRepo.GetDashboardStats(ctx)
}
