package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/service"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		if status >= 400 {
			println("[ERROR]", path, status, latency.String())
		} else {
			println("[INFO]", path, status, latency.String())
		}
	}
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowedOrigins := []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"https://planillas.vercel.app",
			"https://*.vercel.app",
		}

		allowed := false
		for _, o := range allowedOrigins {
			if origin == o || (strings.HasSuffix(o, ".vercel.app") && strings.HasPrefix(origin, "https://")) {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Next()
	}
}

func AuthMiddleware(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("access_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
			return
		}

		userID, err := svc.ValidateAndExtractUserID(cookie)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "DELETE" {
			token := c.GetHeader("X-CSRF-Token")
			if token == "" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token requerido"})
				return
			}

			cookie, err := c.Cookie("csrf_token")
			if err != nil || cookie != token {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token inválido"})
				return
			}
		}
		c.Next()
	}
}

func RateLimiter() gin.HandlerFunc {
	type request struct {
		count     int
		resetTime time.Time
	}

	requests := make(map[string]*request)
	cleaned := false

	return func(c *gin.Context) {
		if !cleaned {
			go func() {
				for {
					time.Sleep(time.Minute)
					now := time.Now()
					for ip, req := range requests {
						if req.resetTime.Before(now) {
							delete(requests, ip)
						}
					}
				}
			}()
			cleaned = true
		}

		ip := c.ClientIP()
		now := time.Now()

		if req, exists := requests[ip]; exists {
			if req.resetTime.Before(now) {
				req.count = 0
				req.resetTime = now.Add(time.Minute)
			}

			if req.count >= 5 && c.FullPath() == "/api/auth/login" {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "demasiadas solicitudes, intente más tarde"})
				return
			}

			req.count++
		} else {
			requests[ip] = &request{
				count:     1,
				resetTime: now.Add(time.Minute),
			}
		}

		c.Next()
	}
}