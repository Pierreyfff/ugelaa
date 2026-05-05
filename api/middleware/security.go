package middleware

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/planillas/api/service"
)

type SecureContext struct {
	RateLimitAttempts map[string]*RateLimitEntry
	CSRFTokens        map[string]string
}

type RateLimitEntry struct {
	Count     int
	ResetTime time.Time
}

func NewSecureContext() *SecureContext {
	return &SecureContext{
		RateLimitAttempts: make(map[string]*RateLimitEntry),
		CSRFTokens:        make(map[string]string),
	}
}

func SecureLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		clientIP := c.ClientIP()
		userAgent := c.Request.UserAgent()

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logLevel := "INFO"
		if status >= 500 {
			logLevel = "ERROR"
		} else if status >= 400 {
			logLevel = "WARN"
		}

		fmt.Printf("[%s] %s | %d | %s | %s | %s\n",
			logLevel, status, latency.Milliseconds(), clientIP, path, userAgent)
	}
}

func SecureCORS(allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowed := false
		for _, o := range allowedOrigins {
			if origin == o ||
				(o == "https://*.vercel.app" && strings.HasPrefix(origin, "https://") && strings.HasSuffix(origin, ".vercel.app")) ||
				(o == "http://localhost:*" && strings.HasPrefix(origin, "http://localhost:")) {
				allowed = true
				break
			}
		}

		if allowed || origin == "" {
			if origin != "" {
				c.Header("Access-Control-Allow-Origin", origin)
			}
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Requested-With")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Max-Age", "86400")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func SecureSecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*; frame-src 'self';")
		c.Next()
	}
}

func SecureAuthMiddleware(svc *service.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get token from cookie first, then from Authorization header
		cookie, err := c.Cookie("access_token")
		var token string

		if err != nil {
			// Try Authorization header: "Bearer <token>"
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
				return
			}
		} else {
			token = cookie
		}

		userID, err := svc.ValidateAndExtractUserID(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido o expirado"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

func SecureCSRFProtection(secureCtx *SecureContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "DELETE" {
			// Skip CSRF para FormData (import, uploads, etc)
			if strings.Contains(c.ContentType(), "multipart/form-data") {
				c.Next()
				return
			}

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

			sessionID := c.GetHeader("X-Session-ID")
			if sessionID != "" {
				expectedToken := secureCtx.CSRFTokens[sessionID]
				if expectedToken == "" || token != expectedToken {
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token inválido"})
					return
				}
			}
		}
		c.Next()
	}
}

func SecureRateLimiter(secureCtx *SecureContext, maxAttempts int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		entry, exists := secureCtx.RateLimitAttempts[ip]
		if !exists || entry.ResetTime.Before(now) {
			secureCtx.RateLimitAttempts[ip] = &RateLimitEntry{
				Count:     1,
				ResetTime: now.Add(window),
			}
		} else {
			entry.Count++
			if entry.Count > maxAttempts {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"error":       "demasiadas solicitudes",
					"retry_after": entry.ResetTime.Sub(now).Seconds(),
				})
				return
			}
		}

		c.Next()
	}
}

func InputValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip validation para FormData (file uploads, imports, etc)
		if strings.Contains(c.ContentType(), "multipart/form-data") {
			c.Next()
			return
		}

		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Error leyendo request"})
				return
			}
			c.Request.Body = io.NopCloser(bytes.NewReader(bodyBytes))

			var raw map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &raw); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
				return
			}

			for key, value := range raw {
				if str, ok := value.(string); ok {
					sanitized := sanitizeInput(str)
					if sanitized != str {
						raw[key] = sanitized
					}
				}
			}
			c.Set("sanitizedBody", raw)
			c.Request.Body = io.NopCloser(bytes.NewReader(bodyBytes))
		}
		c.Next()
	}
}

func sanitizeInput(input string) string {
	input = html.EscapeString(input)

	input = strings.ReplaceAll(input, "<script>", "")
	input = strings.ReplaceAll(input, "</script>", "")
	input = strings.ReplaceAll(input, "<iframe>", "")
	input = strings.ReplaceAll(input, "javascript:", "")
	input = strings.ReplaceAll(input, "onerror=", "")
	input = strings.ReplaceAll(input, "onclick=", "")

	re := regexp.MustCompile(`[^\p{L}\p{N}\s\-_.@]`)
	return re.ReplaceAllString(input, "")
}

func GenerateSessionID(userID int) string {
	data := fmt.Sprintf("%d-%d", userID, time.Now().UnixNano())
	hash := sha256.Sum256([]byte(data))
	return base64.URLEncoding.EncodeToString(hash[:])
}

func ValidateInputLength(value string, min, max int) bool {
	return len(value) >= min && len(value) <= max
}

func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func ValidateDNI(dni string) bool {
	if len(dni) < 5 || len(dni) > 20 {
		return false
	}
	dniRegex := regexp.MustCompile(`^[A-Z0-9]+$`)
	return dniRegex.MatchString(strings.ToUpper(dni))
}
