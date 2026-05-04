# Seguridad - OWASP Top 10 & ISO 27001

## Cumplimiento OWASP Top 10 (2021)

### A01:2021 - Broken Access Control ✓
- Middleware de autenticación en todas las rutas `/api/*`
- Validación de JWT en cada request
- Verificación de ownership en operaciones PUT/DELETE

### A02:2021 - Cryptographic Failures ✓
- Contraseñas: bcrypt cost factor 12
- JWT: HS256 con claves de 256 bits mínimo
- Cookies: HttpOnly + Secure + SameSite=Strict
- Base de datos: TLS/SSL requerido

### A03:2021 - Injection ✓
- pgx: uso de prepared statements por defecto
- Sanitización de inputs en middleware
- Validación de tipos y длины

### A04:2021 - Insecure Design ✓
- Validación de schemas con struct tags
- Rate limiting configurable
- CSRF protection

### A05:2021 - Security Misconfiguration ✓
- Headers de seguridad configurados
- CORS con whitelist de orígenes
- Modo release en producción
- Logs sin exposición de datos sensibles

### A06:2021 - Vulnerable Components ✓
- Dependencias actualizadas
- go.mod con versiones fijas
- Scanning de vulnerabilidades recomendado

### A07:2021 - Authentication Failures ✓
- JWT con tokens cortos (15 min)
- Rate limiting en /auth/login (5/min)
- Lockout después de intentos fallidos
- Refresh token con rotación automática

### A08:2021 - Software and Data Integrity Failures ✓
- Go modules verificados
- Builds reproducibles

### A09:2021 - Security Logging and Monitoring ✓
- Logging de todos los requests
- Logging de errores de autenticación
- Logging de cambios en datos sensibles

### A10:2021 - Server-Side Request Forgery ✓
- No hay llamadas a URLs externas
- Solo acceso a base de datos local

---

## Cumplimiento ISO 27001

### A.5 - Information Security Policies
- Política de contraseñas documentada
- Política de tokens JWT

### A.6 - Organization of Information Security
- Roles y responsabilidades definidos
- Segregación de tareas (auth vs business logic)

### A.9 - Access Control
- Autenticación JWT robusta
- Autorización por usuario
- Cookies seguras

### A.10 - Cryptography
- Cifrado de contraseñas con bcrypt 12
- Cifrado de tokens con HS256
- TLS para base de datos

### A.12 - Operations Security
- Rate limiting
- Logging de seguridad
- Input validation
- Sanitización de datos

### A.13 - Communications Security
- CORS configurado
- HTTPS enforced
- Headers de seguridad

### A.14 - System Acquisition, Development and Maintenance
- Validación de inputs
- Sanitización de outputs
- Prepared statements

---

## Políticas de Seguridad Implementadas

### Contraseñas
- Mínimo 8 caracteres
- Requiere: mayúscula, minúscula, número
- Recomendado: carácter especial
- Hash: bcrypt cost 12
- Rotación: 90 días

### Sesión
- Access token: 15 minutos
- Refresh token: 7 días
- Rotation automática en cada uso

### Rate Limiting
- Login: 5 intentos/minuto/IP
- Bloqueo: 1 hora después de límite

### Logging
- Timestamp
- IP del cliente
- Endpoint accedido
- Status code
- Latencia

---

## Headers de Seguridad

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'
```

---

## Auditoría

Para auditoría de seguridad, revisar:
- `api/middleware/security.go` - Middleware de seguridad
- `api/service/security.go` - Validaciones y sanitización
- `api/main.go` - Configuración de seguridad
- Logs en stdout (formato: [LEVEL] status | latency | ip | path)