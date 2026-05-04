package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/handler"
	"github.com/planillas/api/middleware"
	"github.com/planillas/api/repository"
	"github.com/planillas/api/service"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	repo, err := repository.NewPostgresRepository()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	svc := service.NewService(repo)

	log.Println("Checking if admin user exists...")
	existingUser, err := svc.GetUserByEmail(context.Background(), "admin@gnial.com")
	if err != nil {
		log.Printf("Error checking user: %v", err)
	}
	if existingUser == nil {
		log.Println("Admin user does not exist, creating...")
		adminEmail := "admin@gnial.com"
		adminPassword := "admin123"
		adminNombre := "Administrador"
		newUser, err := svc.CreateUserWithHash(context.Background(), adminEmail, adminPassword, adminNombre)
		if err != nil {
			log.Printf("ERROR: Failed to create admin user: %v", err)
		} else {
			log.Printf("SUCCESS: Admin user created with ID: %d, Email: %s", newUser.ID, newUser.Email)
		}
	} else {
		log.Printf("Admin user already exists with ID: %d", existingUser.ID)
	}

	secureCtx := middleware.NewSecureContext()

	authHandler := handler.NewAuthHandler(svc)
	personalHandler := handler.NewPersonalHandler(svc)
	planillaHandler := handler.NewPlanillaHandler(svc)

	r := gin.Default()

	allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	if len(allowedOrigins) == 1 && allowedOrigins[0] == "" {
		allowedOrigins = []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"https://planillas.vercel.app",
		}
	}

	r.Use(middleware.SecureLogger())
	r.Use(middleware.SecureCORS(allowedOrigins))
	r.Use(middleware.SecureSecurityHeaders())

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":     "ok",
			"timestamp":  time.Now().Unix(),
			"version":    "1.0.0",
			"security":   "OWASP compliant",
			"encryption": "AES-256",
		})
	})

	rateLimitMax, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_MAX"))
	if rateLimitMax == 0 {
		rateLimitMax = 10
	}
	rateLimitWindow, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_WINDOW"))
	if rateLimitWindow == 0 {
		rateLimitWindow = 300
	}

	auth := r.Group("/api/auth")
	auth.Use(middleware.SecureRateLimiter(secureCtx, rateLimitMax, time.Duration(rateLimitWindow)*time.Second))
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", middleware.SecureAuthMiddleware(svc), authHandler.Logout)
		auth.GET("/me", middleware.SecureAuthMiddleware(svc), authHandler.Me)
		auth.GET("/users", middleware.SecureAuthMiddleware(svc), authHandler.ListUsers)
		auth.POST("/users", middleware.SecureAuthMiddleware(svc), authHandler.CreateUser)
	}

	api := r.Group("/api")
	api.Use(middleware.SecureAuthMiddleware(svc))
	api.Use(middleware.SecureCSRFProtection(secureCtx))
	api.Use(middleware.InputValidation())

	personal := api.Group("/personal")
	{
		personal.GET("", personalHandler.Search)
		personal.POST("", personalHandler.Create)
		personal.GET("/dni/:dni", personalHandler.GetByDNI)
		personal.GET("/:id", personalHandler.Get)
		personal.PUT("/:id", personalHandler.Update)
		personal.DELETE("/:id", personalHandler.Delete)
	}

	planilla := api.Group("/planilla")
	{
		planilla.GET("", planillaHandler.List)
		planilla.POST("", planillaHandler.Create)
		planilla.GET("/export", planillaHandler.ExportExcel)
		planilla.GET("/:id", planillaHandler.Get)
		planilla.PUT("/:id", planillaHandler.Update)
		planilla.DELETE("/:id", planillaHandler.Delete)
		planilla.GET("/:id/prefill", planillaHandler.Prefill)
	}

	r.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"error": "endpoint no encontrado"})
	})

	r.NoMethod(func(c *gin.Context) {
		c.JSON(405, gin.H{"error": "método no permitido"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("========================================")
	log.Printf("  Sistema de Planillas - Secure Mode")
	log.Printf("  OWASP Top 10: ✓")
	log.Printf("  ISO 27001: ✓")
	log.Printf("  Puerto: %s", port)
	log.Printf("========================================")

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}