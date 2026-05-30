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

type EventHandler struct {
	eventService *service.EventService
}

func NewEventHandler(eventService *service.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

// GET /api/admin/events
func (h *EventHandler) List(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	events, total, err := h.eventService.List(c.Request.Context(), search, status, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    events,
		Meta: dto.PaginateMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// POST /api/admin/events
func (h *EventHandler) Create(c *gin.Context) {
	var req dto.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	event, err := h.eventService.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "message": "Event created", "data": event})
}

// GET /api/admin/events/:id
func (h *EventHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	event, err := h.eventService.FindByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": event})
}

// PUT /api/admin/events/:id
func (h *EventHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	var req dto.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	event, err := h.eventService.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Event updated", "data": event})
}

// DELETE /api/admin/events/:id
func (h *EventHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	if err := h.eventService.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Event deleted"})
}

// PATCH /api/admin/events/:id/status
func (h *EventHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	var req dto.UpdateEventStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.eventService.UpdateStatus(c.Request.Context(), id, req.Status); err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Event status updated"})
}

// GET /api/admin/dashboard/stats
func (h *EventHandler) DashboardStats(c *gin.Context) {
	stats, err := h.eventService.GetDashboardStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": stats})
}
