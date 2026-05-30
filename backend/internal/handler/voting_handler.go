package handler

import (
	"errors"
	"net/http"

	"go-vote/internal/dto"
	"go-vote/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VotingHandler struct {
	votingService *service.VotingService
}

func NewVotingHandler(votingService *service.VotingService) *VotingHandler {
	return &VotingHandler{votingService: votingService}
}

// POST /api/vote/validate-code
func (h *VotingHandler) ValidateCode(c *gin.Context) {
	var req dto.ValidateCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	resp, err := h.votingService.ValidateCode(c.Request.Context(), req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}

// GET /api/vote/session/:token
func (h *VotingHandler) GetSession(c *gin.Context) {
	token := c.Param("token")

	session, err := h.votingService.GetSession(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, service.ErrSessionNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Session not found or expired"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": session})
}

// GET /api/vote/events/:event_id/candidates
func (h *VotingHandler) GetEventCandidates(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("event_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	token := c.GetHeader("X-Voting-Token")
	if token == "" {
		token = c.Query("token")
	}
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Voting token required"})
		return
	}

	candidates, err := h.votingService.GetEventCandidates(c.Request.Context(), token, eventID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": candidates})
}

// POST /api/vote/events/:event_id/submit
func (h *VotingHandler) SubmitVote(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("event_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	token := c.GetHeader("X-Voting-Token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Voting token required"})
		return
	}

	var req dto.SubmitVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	ipAddr := c.ClientIP()
	userAgent := c.Request.UserAgent()

	err = h.votingService.SubmitVote(c.Request.Context(), token, eventID, req, ipAddr, userAgent)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrSessionNotFound):
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Session expired, please scan QR again"})
		case errors.Is(err, service.ErrVoterAlreadyVoted):
			c.JSON(http.StatusConflict, gin.H{"success": false, "message": "You have already voted in this event"})
		case errors.Is(err, service.ErrVoterBlocked):
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Your access has been blocked"})
		case errors.Is(err, service.ErrEventNotActive):
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "This event is not currently active"})
		case errors.Is(err, service.ErrEventExpired):
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "This event has ended"})
		case errors.Is(err, service.ErrVoterNotAssigned):
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "You are not assigned to this event"})
		case errors.Is(err, service.ErrCandidateNotInEvent):
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid candidate selection"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Vote submitted successfully"})
}

// GET /api/admin/events/:id/results
func (h *VotingHandler) GetResults(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid event ID"})
		return
	}

	results, err := h.votingService.GetResults(c.Request.Context(), eventID)
	if err != nil {
		if errors.Is(err, service.ErrEventNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Event not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": results})
}
