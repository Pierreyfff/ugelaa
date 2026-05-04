package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/domain"
	"github.com/planillas/api/service"
)

type AuthHandler struct {
	svc *service.Service
}

func NewAuthHandler(svc *service.Service) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, domain.ErrorResponse{Error: "credenciales inválidas"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error interno"})
		return
	}

	c.SetCookie("access_token", resp.Token.AccessToken, 900, "/", "", true, true)
	c.SetCookie("refresh_token", resp.Token.RefreshToken, 604800, "/", "", true, true)

	csrfToken := generateCSRFToken()
	c.SetCookie("csrf_token", csrfToken, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"user": resp.User,
		"csrf_token": csrfToken,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req domain.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "refresh token requerido"})
		return
	}

	token, err := h.svc.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, domain.ErrorResponse{Error: "token inválido o expirado"})
		return
	}

	c.SetCookie("access_token", token.AccessToken, 900, "/", "", true, true)
	c.SetCookie("refresh_token", token.RefreshToken, 604800, "/", "", true, true)

	c.JSON(http.StatusOK, gin.H{"access_token": token.AccessToken})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, domain.ErrorResponse{Error: "no autenticado"})
		return
	}

	h.svc.Logout(c.Request.Context(), userID.(int))

	c.SetCookie("access_token", "", -1, "/", "", true, true)
	c.SetCookie("refresh_token", "", -1, "/", "", true, true)
	c.SetCookie("csrf_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, domain.SuccessResponse{Message: "sesión cerrada"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, domain.ErrorResponse{Error: "no autenticado"})
		return
	}

	user, err := h.svc.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) ListUsers(c *gin.Context) {
	users, err := h.svc.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al obtener usuarios"})
		return
	}
	c.JSON(http.StatusOK, users)
}

type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nombre   string `json:"nombre" binding:"required"`
}

func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	existing, _ := h.svc.GetUserByEmail(c.Request.Context(), req.Email)
	if existing != nil {
		c.JSON(http.StatusConflict, domain.ErrorResponse{Error: "el email ya está en uso"})
		return
	}

	user, err := h.svc.CreateUserWithHash(c.Request.Context(), req.Email, req.Password, req.Nombre)
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al crear usuario"})
		return
	}

	c.JSON(http.StatusCreated, user)
}