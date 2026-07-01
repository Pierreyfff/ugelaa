# Manual de Desarrollador — Sistema de Gestión de Planillas

---

## 1. Introducción

Este manual está dirigido a **desarrolladores y personal técnico** que necesita comprender, modificar o desplegar el Sistema de Gestión de Planillas. Describe la arquitectura, tecnologías, configuración del entorno de desarrollo y procedimientos de despliegue.

---

## 2. Arquitectura del Sistema

```
/* =====================================================================
   [Diagrama de Arquitectura]
   Descripción: Diagrama de cajas mostrando:
   Cliente (Browser) → Frontend (React+Vite/Nginx :80)
   Frontend → Backend (Go/Gin :8080)
   Frontend → Python (Flask :8081)
   Backend → PostgreSQL (:5432)
   Python → Backend (HTTP)
   ===================================================================== */
```

### Vista General

```
                  ┌──────────────┐
                  │   Browser    │
                  │  (Usuario)   │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │     Frontend        │
              │  React + Vite/Nginx │
              │      Puerto 80      │
              └──┬──────────────┬───┘
                 │              │
          ┌──────┴──────┐  ┌───┴──────────┐
          │   Backend   │  │    Python    │
          │  Go / Gin   │  │   Flask      │
          │  Puerto 8080 │  │  Puerto 8081 │
          └──────┬──────┘  └──────────────┘
                 │
          ┌──────┴──────┐
          │  PostgreSQL │
          │  Puerto 5432│
          └─────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| Frontend | React + TypeScript | 18 / 5.3 | Interfaz de usuario |
| Build tool | Vite | 5.0 | Empaquetado y dev server |
| Estilos | Tailwind CSS | 3.3 | Estilos utilitarios |
| Iconos | Lucide React | 0.294 | Iconos SVG |
| HTTP | Axios | 1.6 | Cliente HTTP |
| Backend | Go + Gin | 1.25 / 1.9 | API REST |
| ORM | GORM + pgx | 1.25 / 5.4 | ORM para PostgreSQL |
| Excel | excelize | 2.10 | Lectura de Excel en Go |
| Python | Flask + openpyxl | 3.11 / 3.1 | Procesamiento Excel |
| Base de datos | PostgreSQL | 18 | Base de datos relacional |
| Contenedores | Docker Compose | — | Orquestación local |

---

## 3. Estructura del Proyecto

```
ugelaa/
├── frontend/                    # Aplicación React + TypeScript
│   ├── src/
│   │   ├── App.tsx              # Componente raíz, rutas, contextos
│   │   ├── components/          # Componentes reutilizables
│   │   │   └── Layout.tsx       # Layout principal (sidebar + header)
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── Auth.tsx         # Login
│   │   │   ├── Dashboard.tsx    # Resumen general
│   │   │   ├── Planillas.tsx    # Gestión de personal
│   │   │   ├── Importar.tsx     # Importación de datos
│   │   │   ├── Exportar.tsx     # Exportación de planillas
│   │   │   └── Configuracion.tsx # Ajustes del sistema
│   │   └── services/
│   │       └── api.ts           # Cliente Axios con interceptors
│   ├── Dockerfile               # Multi-stage build (Node → Nginx)
│   ├── nginx.conf               # Proxy inverso a backend/python
│   └── package.json
│
├── backend/                     # API REST en Go
│   ├── main.go                  # Punto de entrada, rutas, CORS
│   ├── handlers/
│   │   └── handlers.go          # Handlers de todas las rutas
│   ├── models/
│   │   └── models.go            # Modelos GORM (Usuario, Personal, Planilla, etc.)
│   ├── Dockerfile               # Multi-stage build (Go Alpine)
│   └── go.mod / go.sum
│
├── python-excel/                # Servicio de procesamiento Excel
│   ├── app.py                   # API Flask (process, validate, export)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/
│   └── init.sql                 # Schema SQL inicial
│
├── docker-compose.yml           # Orquestación local
└── render.yaml                  # Configuración de despliegue Render
```

---

## 4. Configuración del Entorno de Desarrollo

### 4.1 Prerrequisitos

- **Docker Desktop** (Windows) o **Docker Engine** + **docker-compose** (Linux/Mac)
- **Git**
- (Opcional) **Go 1.25+**, **Node 20+**, **Python 3.11+** para desarrollo sin Docker

### 4.2 Inicio Rápido con Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/Pierreyfff/ugelaa.git
cd ugelaa

# 2. Iniciar todos los servicios
docker-compose up --build

# 3. La aplicación estará disponible en:
#    Frontend: http://localhost:5173
#    Backend:  http://localhost:8080
#    Python:   http://localhost:8081
```

### 4.3 Credenciales por Defecto

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@planillas.su | Admin2026* |
| Asistente | asistente@planillas.su | Asistente2026* |

### 4.4 Desarrollo sin Docker (Backend)

```bash
cd backend

# Variables de entorno
export DATABASE_URL="postgres://planillas:planillas2024@localhost:5432/planillas?sslmode=disable"

# Ejecutar
go run .
```

### 4.5 Desarrollo sin Docker (Frontend)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Disponible en http://localhost:5173
```

### 4.6 Desarrollo sin Docker (Python)

```bash
cd python-excel
pip install -r requirements.txt
export FLASK_APP=app.py
export BACKEND_URL=http://localhost:8080
flask run --port 8081
```

### 4.7 Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reconstruir y reiniciar un servicio
docker-compose up --build -d backend

# Ejecutar comandos dentro de un contenedor
docker-compose exec backend sh

# Acceder a la base de datos
docker-compose exec postgres psql -U planillas -d planillas
```

---

## 5. API REST — Endpoints

### 5.1 Rutas Públicas (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check del backend |
| POST | `/api/usuarios/login` | Inicio de sesión |
| POST | `/api/importar/haberes` | Importación de haberes (usado por Python) |
| GET | `/api/personal/:id/exportar` | Exportar planillas de un personal (usado por Python) |

### 5.2 Rutas Protegidas (requieren `Authorization: Bearer <token>`)

**Personal:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/personal` | Listar todo el personal |
| GET | `/api/personal/buscar` | Buscar personal (query params) |
| GET | `/api/personal/instituciones` | Listar instituciones únicas |
| GET | `/api/personal/distritos` | Listar distritos únicos |
| GET | `/api/personal/:id` | Obtener detalle de un personal |
| POST | `/api/personal` | Crear nuevo personal |
| PUT | `/api/personal/:id` | Actualizar personal |
| DELETE | `/api/personal/:id` | Eliminar personal |
| GET | `/api/personal/:id/periodos` | Obtener periodos de un personal |

**Planillas:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/planillas` | Listar planillas |
| GET | `/api/planillas/:id` | Obtener detalle de planilla |
| POST | `/api/planillas` | Crear planilla |
| PUT | `/api/planillas/:id` | Actualizar planilla |
| DELETE | `/api/planillas/:id` | Eliminar planilla |
| GET | `/api/planillas/:id/ingresos` | Listar ingresos de una planilla |
| GET | `/api/planillas/:id/descuentos` | Listar descuentos de una planilla |
| PUT | `/api/planillas/:id/editar` | Editar planilla completa |

**Ingresos / Descuentos:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ingresos` | Crear ingreso |
| PUT | `/api/ingresos/:id` | Actualizar ingreso |
| DELETE | `/api/ingresos/:id` | Eliminar ingreso |
| POST | `/api/descuentos` | Crear descuento |
| PUT | `/api/descuentos/:id` | Actualizar descuento |
| DELETE | `/api/descuentos/:id` | Eliminar descuento |

**Importación:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/importar/excel` | Importar archivo Excel |
| POST | `/api/importar/json` | Importar datos en JSON |
| DELETE | `/api/importar/limpiar` | Limpiar última importación |
| DELETE | `/api/importar/limpiar-todo` | Limpiar todo el personal |
| GET | `/api/importar/periodos` | Listar periodos importados |

**Dashboard:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/resumen` | Obtener resumen del dashboard |

**Usuarios:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| PUT | `/api/usuarios/cambiar-password` | Cambiar contraseña |

### 5.3 Python Flask Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/process-excel` | Procesar Excel y enviar al backend |
| POST | `/validate-excel` | Validar estructura del Excel |
| POST | `/export-excel` | Generar Excel de exportación |

### 5.4 Formato de Respuesta

```json
// Éxito
{ "message": "Operación exitosa", "data": { ... } }

// Error
{ "error": "Descripción del error" }
```

---

## 6. Base de Datos

### 6.1 Esquema

```
/* =====================================================================
   [Diagrama DER]
   Descripción:
   usuarios (id, nombre, email, password_hash, rol, token, created_at)
   personal (id, dni, nombres, apellidos, puesto, rd, uu, institucion, distrito, created_at)
   planilla (id, personal_id FK→personal, mes, anio, total_haberes, total_descuentos, creado_por, creado_en)
   ingresos  (id, planilla_id FK→planilla, tipo, monto, comentario)
   descuentos (id, planilla_id FK→planilla, tipo, monto, comentario)
   ===================================================================== */
```

### 6.2 Modelos (GORM)

**Tabla `usuarios`:**
```go
type Usuario struct {
    ID              uint      // Primary key
    Nombre          string    // Nombre completo
    Email           string    // Email único (login)
    PasswordHash    string    // Hash bcrypt
    Rol             string    // "admin" | "asistente"
    PasswordChanged bool      // ¿Cambió contraseña temporal?
    Token           string    // Token de sesión (64 hex chars)
    CreatedAt       time.Time
}
```

**Tabla `personal`:**
```go
type Personal struct {
    ID          uint
    DNI         string
    Nombres     string
    Apellidos   string
    Puesto      string
    RD          string  // Resolución Directoral
    UU          string  // Unidad Operativa
    Institucion string
    Distrito    string
    CreatedAt   time.Time
}
// TableName: "personal"
```

**Tabla `planilla`:**
```go
type Planilla struct {
    ID              uint
    PersonalID      uint      // FK → Personal
    Personal        Personal  // Relación GORM
    Mes             int16     // 1-12
    Anio            int16
    TotalHaberes    float64
    TotalDescuentos float64
    TotalLiquido    float64   // Campo calculado: haberes - descuentos
    CreadoPor       *uint
    CreadoEn        time.Time
    Ingresos        []Ingreso    // Relación has-many
    Descuentos      []Descuento  // Relación has-many
}
// TableName: "planilla"
```

**Triggers automáticos (en `init.sql`):**
- `trg_ingresos_aiud`: Al insertar/actualizar/eliminar ingresos, recalcula `total_haberes` en planilla.
- `trg_descuentos_aiud`: Al insertar/actualizar/eliminar descuentos, recalcula `total_descuentos` en planilla.

---

## 7. Autenticación y Seguridad

### 7.1 Flujo de Autenticación

```
Cliente                    Backend
   │                         │
   │  POST /api/usuarios/login
   │  {email, password}      │
   │────────────────────────>│
   │                         ├─ Verificar credenciales (bcrypt)
   │                         ├─ Generar token (crypto/rand, 64 hex)
   │                         ├─ Guardar token en DB
   │  {token, user}          │
   │<────────────────────────│
   │                         │
   │  GET /api/personal      │
   │  Authorization: Bearer <token>
   │────────────────────────>│
   │                         ├─ AuthMiddleware: buscar token en DB
   │  {data: [...]}          │
   │<────────────────────────│
```

### 7.2 Rate Limiting

**Propósito:** Prevenir ataques de fuerza bruta en el login.

- **Límite:** 5 intentos fallidos por dirección IP.
- **Respuesta:** HTTP 429 `"Demasiados intentos"`.
- **Reseteo:** Al iniciar sesión exitosamente.

### 7.3 CORS

```go
cors.New(cors.Config{
    AllowOrigins:     strings.Split(corsOrigins, ","),
    AllowCredentials: true,
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    MaxAge:           12 * time.Hour,
})
```

Variable de entorno: `CORS_ORIGINS` (comma-separated, default: `localhost`).

### 7.4 Inactividad (Frontend)

- **Timeout:** 30 minutos sin actividad.
- **Eventos monitoreados:** `mousemove`, `keydown`, `click`, `scroll`, `touchstart`.
- **Acción:** Limpia localStorage y redirige a `/auth`.

### 7.5 Headers de Seguridad

Implementados en `SecurityHeaders()` middleware:

| Header | Valor |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |

---

## 8. Despliegue

### 8.1 Despliegue Local (Docker Compose)

```bash
# Construir e iniciar todos los servicios
docker-compose up --build -d

# Verificar estado
docker-compose ps

# Detener
docker-compose down
```

### 8.2 Despliegue en Render

```
/* =====================================================================
   [Diagrama de Despliegue Render]
   Descripción: Render aloja backend (Go) y python-excel (Flask) como
   servicios web Docker. Frontend desplegado en Vercel como SPA estática.
   PostgreSQL externo (Render, Aiven u otro proveedor).
   ===================================================================== */
```

**Archivo `render.yaml`:**
```yaml
services:
  - type: web
    name: planillas-backend
    env: docker
    repo: https://github.com/Pierreyfff/ugelaa
    branch: final-v1
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false       # Configurar manualmente en Render Dashboard
      - key: CORS_ORIGINS
        value: https://ugelaa.vercel.app,http://localhost:5173
    healthCheckPath: /health

  - type: web
    name: planillas-python
    env: docker
    repo: https://github.com/Pierreyfff/ugelaa
    branch: final-v1
    dockerfilePath: ./python-excel/Dockerfile
    envVars:
      - key: BACKEND_URL
        value: https://planillas-backend.onrender.com
    healthCheckPath: /health
```

**Frontend en Vercel:**
```bash
# Variables de entorno en Vercel Dashboard
VITE_API_URL=https://planillas-backend.onrender.com
VITE_PYTHON_URL=https://planillas-python.onrender.com
```

### 8.3 Variables de Entorno

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| `DATABASE_URL` | Backend | Conexión PostgreSQL |
| `CORS_ORIGINS` | Backend | Orígenes CORS permitidos |
| `PORT` | Backend / Python | Puerto del servidor |
| `BACKEND_URL` | Python | URL del backend Go |
| `VITE_API_URL` | Frontend | URL de la API |
| `VITE_PYTHON_URL` | Frontend | URL del servicio Python |

---

## 9. Flujo de Importación de Excel

```
/* =====================================================================
   [Diagrama de Flujo de Importación]
   Paso 1: Usuario sube Excel → Frontend
   Paso 2: Frontend envía Excel a Python (/process-excel)
   Paso 3: Python parsea (openpyxl), extrae empleados, haberes, descuentos
   Paso 4: Python envía JSON estructurado al Backend (/api/importar/haberes)
   Paso 5: Backend procesa y guarda en PostgreSQL
   Paso 6: Backend responde éxito → Python → Frontend
   ===================================================================== */
```

```
Usuario    Frontend        Python (Flask)      Backend (Go)      PostgreSQL
   │           │                │                  │                 │
   │ Sube Excel│                │                  │                 │
   │──────────>│                │                  │                 │
   │           │ POST /process-excel               │                 │
   │           │───────────────>│                  │                 │
   │           │                │  Parsear Excel   │                 │
   │           │                │  (openpyxl)      │                 │
   │           │                │                  │                 │
   │           │                │ POST /api/importar/haberes          │
   │           │                │─────────────────>│                 │
   │           │                │                  │  Guardar datos  │
   │           │                │                  │────────────────>│
   │           │                │                  │<────────────────│
   │           │                │<─────────────────│                 │
   │           │                │                  │                 │
   │           │<───────────────│                  │                 │
   │  Resultado│                │                  │                 │
   │<──────────│                │                  │                 │
```

---

## 10. Flujo de Exportación de Excel

```
Usuario    Frontend        Backend (Go)         Python (Flask)
   │           │                │                    │
   │ Exportar  │                │                    │
   │──────────>│                │                    │
   │           │ GET /personal/{id}/exportar         │
   │           │───────────────>│                    │
   │           │                │ Consultar BD       │
   │           │    JSON con datos del empleado      │
   │           │<───────────────│                    │
   │           │                │                    │
   │           │ POST /export-excel (reenvía datos)  │
   │           │───────────────────────────────────>│
   │           │                    │  Generar Excel │
   │           │                    │  (openpyxl +   │
   │           │                    │   plantilla)   │
   │           │    Excel .xlsx    │                │
   │           │<───────────────────────────────────│
   │  Descarga │                    │                │
   │<──────────│                    │                │
```

---

## 11. Solución de Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| `docker-compose up` falla | Puerto en uso | `netstat -ano` matar proceso o cambiar puerto |
| Backend no conecta a DB | `DATABASE_URL` incorrecta | Verificar credenciales y host en .env |
| CORS error en frontend | Origen no permitido | Agregar origen a `CORS_ORIGINS` |
| Importación falla | Formato Excel incorrecto | Verificar columnas en `process-excel` |
| Exportación da `#VALUE!` | openpyxl eliminó rich data | Se inserta logo como drawing estándar |
| Login no funciona | Token mal formado | Verificar `Authorization: Bearer <token>` |
| Error 502 en proxy | Servicio destino caído | `docker-compose restart <servicio>` |

---

## 12. Buenas Prácticas

1. **Commits atómicos**: Un cambio por commit con mensaje descriptivo.
2. **Branch `final-v1`**: Rama principal de desarrollo.
3. **TypeScript estricto**: Mantener tipado fuerte en frontend.
4. **Logs**: Usar `fmt.Printf` (Go) o `print(..., flush=True)` (Python) para depuración.
5. **Pruebas**: Verificar con `docker-compose up --build` antes de pushear.
6. **Seguridad**: No hardcodear credenciales. Usar variables de entorno.
7. **Formato**: `go fmt` para Go, `npm run build` para TypeScript.

---

*Documento generado el — Sistema de Gestión de Planillas v1.0*
