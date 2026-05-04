package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/domain"
	"github.com/planillas/api/service"
)

type PersonalHandler struct {
	svc *service.Service
}

func NewPersonalHandler(svc *service.Service) *PersonalHandler {
	return &PersonalHandler{svc: svc}
}

func (h *PersonalHandler) Search(c *gin.Context) {
	query := c.Query("q")
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	if query == "" {
		personal, total, err := h.svc.SearchPersonal(c.Request.Context(), "", page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al buscar"})
			return
		}

		totalPages := (total + limit - 1) / limit
		c.JSON(http.StatusOK, domain.PaginatedResponse{
			Data:       personal,
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		})
		return
	}

	if len(query) < 2 {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "mínimo 2 caracteres para buscar"})
		return
	}

	personal, total, err := h.svc.SearchPersonal(c.Request.Context(), query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al buscar"})
		return
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, domain.PaginatedResponse{
		Data:       personal,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func (h *PersonalHandler) Create(c *gin.Context) {
	var req domain.CreatePersonalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	if req.DNI == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "el DNI es requerido"})
		return
	}
	if req.Nombres == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "el nombre es requerido"})
		return
	}
	if req.Apellidos == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "los apellidos son requeridos"})
		return
	}

	personal, err := h.svc.CreatePersonal(c.Request.Context(), &req)
	if err != nil {
		if err == service.ErrDNIExists {
			c.JSON(http.StatusConflict, domain.ErrorResponse{Error: "el DNI ya existe"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al crear personal"})
		return
	}

	c.JSON(http.StatusCreated, personal)
}

func (h *PersonalHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	personal, err := h.svc.GetPersonal(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "personal no encontrado"})
		return
	}

	c.JSON(http.StatusOK, personal)
}

func (h *PersonalHandler) GetByDNI(c *gin.Context) {
	dni := c.Param("dni")
	if dni == "" {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "DNI es requerido"})
		return
	}

	personal, err := h.svc.GetPersonalByDNI(c.Request.Context(), dni)
	if err != nil {
		c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "personal no encontrado"})
		return
	}

	c.JSON(http.StatusOK, personal)
}

func (h *PersonalHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	var req domain.UpdatePersonalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "datos inválidos", Details: err.Error()})
		return
	}

	personal, err := h.svc.UpdatePersonal(c.Request.Context(), id, &req)
	if err != nil {
		if err == service.ErrPersonalNotFound {
			c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "personal no encontrado"})
			return
		}
		if err == service.ErrDNIExists {
			c.JSON(http.StatusConflict, domain.ErrorResponse{Error: "el DNI ya existe"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al actualizar"})
		return
	}

	c.JSON(http.StatusOK, personal)
}

func (h *PersonalHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, domain.ErrorResponse{Error: "ID inválido"})
		return
	}

	err = h.svc.DeletePersonal(c.Request.Context(), id)
	if err != nil {
		if err == service.ErrPersonalNotFound {
			c.JSON(http.StatusNotFound, domain.ErrorResponse{Error: "personal no encontrado"})
			return
		}
		c.JSON(http.StatusInternalServerError, domain.ErrorResponse{Error: "error al eliminar"})
		return
	}

	c.JSON(http.StatusOK, domain.SuccessResponse{Message: "personal eliminado"})
}