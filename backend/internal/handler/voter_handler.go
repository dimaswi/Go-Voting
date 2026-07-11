package handler

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"go-vote/internal/dto"
	"go-vote/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VoterHandler struct {
	voterService *service.VoterService
}

func NewVoterHandler(voterService *service.VoterService) *VoterHandler {
	return &VoterHandler{voterService: voterService}
}

// GET /api/admin/voters
func (h *VoterHandler) List(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	voters, total, err := h.voterService.List(c.Request.Context(), search, status, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    voters,
		Meta: dto.PaginateMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

// POST /api/admin/voters
func (h *VoterHandler) Create(c *gin.Context) {
	var req dto.CreateVoterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	voter, err := h.voterService.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Voter created", "data": voter})
}

// GET /api/admin/voters/:id
func (h *VoterHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	voter, err := h.voterService.FindByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrVoterNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Voter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": voter})
}

// PUT /api/admin/voters/:id
func (h *VoterHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	var req dto.UpdateVoterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	voter, err := h.voterService.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, service.ErrVoterNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Voter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Voter updated", "data": voter})
}

// DELETE /api/admin/voters/:id
func (h *VoterHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	if err := h.voterService.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, service.ErrVoterNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Voter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Voter deleted"})
}

// POST /api/admin/voters/:id/generate-qr
func (h *VoterHandler) GenerateQR(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID"})
		return
	}

	voter, err := h.voterService.RegenerateQR(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "QR Code generated", "data": gin.H{
		"qr_code_url": voter.QRCodeURL,
		"unique_code": voter.UniqueCode,
	}})
}

// POST /api/admin/voters/print-bulk
func (h *VoterHandler) PrintBulk(c *gin.Context) {
	var req dto.PrintBulkVotersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	pdfBuf, err := h.voterService.GenerateBulkQRPDF(c.Request.Context(), req.VoterIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `attachment; filename="bulk_voters_qr.pdf"`)
	c.Data(http.StatusOK, "application/pdf", pdfBuf.Bytes())
}

// GET /api/admin/events/:id/voters
func (h *VoterHandler) ListByEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	search := c.Query("search")
	votedFilter := c.Query("voted")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	voters, total, err := h.voterService.ListByEvent(c.Request.Context(), eventID, search, votedFilter, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    voters,
		Meta: dto.PaginateMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

// POST /api/admin/events/:id/voters/assign
func (h *VoterHandler) AssignToEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	var req dto.AssignVotersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.voterService.AssignToEvent(c.Request.Context(), eventID, req.VoterIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Voters assigned to event"})
}

// DELETE /api/admin/events/:id/voters/:voter_id
func (h *VoterHandler) RemoveFromEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}
	voterID, err := uuid.Parse(c.Param("voter_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid voter ID"})
		return
	}

	if err := h.voterService.RemoveFromEvent(c.Request.Context(), eventID, voterID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Voter removed from event"})
}
