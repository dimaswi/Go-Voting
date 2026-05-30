package handler

import (
	"database/sql"
	"errors"
	"math"
	"net/http"
	"strconv"

	"go-vote/internal/config"
	"go-vote/internal/dto"
	"go-vote/internal/model"
	"go-vote/internal/repository"
	"go-vote/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CandidateHandler struct {
	candidateRepo     repository.CandidateRepository
	eventCandRepo     repository.EventCandidateRepository
	cfg               *config.Config
}

func NewCandidateHandler(
	candidateRepo repository.CandidateRepository,
	eventCandRepo repository.EventCandidateRepository,
	cfg *config.Config,
) *CandidateHandler {
	return &CandidateHandler{
		candidateRepo: candidateRepo,
		eventCandRepo: eventCandRepo,
		cfg:           cfg,
	}
}

// GET /api/admin/candidates
func (h *CandidateHandler) List(c *gin.Context) {
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	var isActive *bool
	if activeStr := c.Query("is_active"); activeStr != "" {
		val := activeStr == "true"
		isActive = &val
	}

	candidates, total, err := h.candidateRepo.List(c.Request.Context(), search, isActive, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    candidates,
		Meta: dto.PaginateMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

// POST /api/admin/candidates
func (h *CandidateHandler) Create(c *gin.Context) {
	var req dto.CreateCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	candidate := buildCandidateFromRequest(req)

	if err := h.candidateRepo.Create(c.Request.Context(), candidate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Candidate created", "data": candidate})
}

// GET /api/admin/candidates/:id
func (h *CandidateHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	candidate, err := h.candidateRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Candidate not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": candidate})
}

// PUT /api/admin/candidates/:id
func (h *CandidateHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	existing, err := h.candidateRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Candidate not found"})
		return
	}

	var req dto.UpdateCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	updated := buildCandidateFromRequest(req)
	updated.ID = existing.ID
	updated.PhotoURL = existing.PhotoURL

	if err := h.candidateRepo.Update(c.Request.Context(), updated); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Candidate updated", "data": updated})
}

// DELETE /api/admin/candidates/:id
func (h *CandidateHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	if err := h.candidateRepo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Candidate deleted"})
}

// POST /api/admin/candidates/:id/photo
func (h *CandidateHandler) UploadPhoto(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Photo file required"})
		return
	}

	photoURL, err := utils.SaveUploadedFile(file, h.cfg.Upload.Dir, "candidates")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.candidateRepo.UpdatePhoto(c.Request.Context(), id, photoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Photo uploaded", "data": gin.H{"photo_url": photoURL}})
}

// GET /api/admin/events/:id/candidates
func (h *CandidateHandler) ListByEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	candidates, err := h.eventCandRepo.ListByEvent(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": candidates})
}

// POST /api/admin/events/:id/candidates/assign
func (h *CandidateHandler) AssignToEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	var req dto.AssignCandidatesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	for _, item := range req.Candidates {
		ec := &model.EventCandidate{
			ID:              uuid.New(),
			EventID:         eventID,
			CandidateID:     item.CandidateID,
			CandidateNumber: item.CandidateNumber,
			SortOrder:       item.SortOrder,
		}
		if err := h.eventCandRepo.Assign(c.Request.Context(), ec); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Candidates assigned to event"})
}

// PUT /api/admin/events/:id/candidates/reorder
func (h *CandidateHandler) ReorderEventCandidates(c *gin.Context) {
	var req dto.ReorderCandidatesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	for _, order := range req.Orders {
		if err := h.eventCandRepo.UpdateOrder(c.Request.Context(), order.EventCandidateID, order.SortOrder); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Candidates reordered"})
}

// DELETE /api/admin/events/:id/candidates/:candidate_id
func (h *CandidateHandler) RemoveFromEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}
	candidateID, err := uuid.Parse(c.Param("candidate_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid candidate ID"})
		return
	}

	if err := h.eventCandRepo.Remove(c.Request.Context(), eventID, candidateID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Candidate removed from event"})
}

func buildCandidateFromRequest(req dto.CreateCandidateRequest) *model.Candidate {
	c := &model.Candidate{
		ID:                     uuid.New(),
		FullName:               req.FullName,
		CandidateNumber:        req.CandidateNumber,
		NIK:                    req.NIK,
		BirthPlace:             req.BirthPlace,
		BirthDate:              req.BirthDate,
		Address:                req.Address,
		Phone:                  req.Phone,
		Email:                  req.Email,
		Education:              req.Education,
		OrganizationExperience: req.OrganizationExperience,
		CurrentPosition:        req.CurrentPosition,
		Vision:                 req.Vision,
		Mission:                req.Mission,
		WorkProgram:            req.WorkProgram,
		Goals:                  req.Goals,
		Motto:                  req.Motto,
		Description:            req.Description,
		IsActive:               true,
	}
	if req.Gender != nil {
		g := model.GenderType(*req.Gender)
		c.Gender = &g
	}
	if req.IsActive != nil {
		c.IsActive = *req.IsActive
	}
	return c
}
