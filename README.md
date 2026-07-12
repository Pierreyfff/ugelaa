# Sistema de Gestión de Planillas - SU

<p align="center">
  <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-✓-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

Sistema web completo para la gestión de planillas de personal, permisos, ingresos y descuentos.
- admin@planillas.su / Admin2026* (rol: admin)
- asistente@planillas.su / Asistente2026* (rol: ayudante)
---

## Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Patrones de Diseño](#patrones-de-diseño)
- [Tech Stack Completo](#tech-stack-completo)
- [Infraestructura y Docker](#infraestructura-y-docker)
- [Puertos y Endpoints](#puertos-y-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [API Endpoints](#api-endpoints)
- [Desarrollo Local](#desarrollo-local)
- [Comandos Docker](#comandos-docker)
- [Credenciales](#credenciales)

---

## Arquitectura del Sistema

### Tipo de Arquitectura: Servicios Distribuidos (Arquitectura de Microservicios Ligera)

Este proyecto **NO es un monolito**, sino una **arquitectura de servicios distribuidos** donde cada componente es independiente y se comunica a través de APIs REST.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARQUITECTURA DEL SISTEMA                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐       │
│    │   FRONTEND   │         │    BACKEND   │         │   PYTHON     │       │
│    │   (React)    │◄──────►│   (Go/Gin)   │◄──────►│  (Flask)       │       │
│    │    :5173     │  HTTP   │    :8080     │  HTTP   │    :8081     │       │
│    └──────────────┘         └──────────────┘         └──────────────┘       │
│           │                        │                        │               │
│           │                   ┌─────┴─────┐                 │               │
│           │                   │           │                 │               │
│           ▼                   ▼           ▼                 ▼               │
│    ┌──────────────┐    ┌──────────────┐ ┌──────────────┐                    │
│    │   NGINX      │    │ PostgreSQL   │ │   UPLOADS    │                    │
│    │  (Proxy)     │    │    :5432     │ │  (Archivos)  │                    │
│    └──────────────┘    └──────────────┘ └──────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes de la Arquitectura

| Componente | Tipo | Descripción |
|------------|------|-------------|
| **Frontend** | Cliente | Aplicación React servida por Nginx |
| **Backend API** | Servicio | API REST en Go con lógica de negocio |
| **Python Excel** | Servicio | Procesador de archivos Excel (Flask) |
| **PostgreSQL** | Datos | Base de datos relacional |
| **Nginx** | Infra | Proxy reverso y servidor estático |

### Flujo de Datos

1. **Usuario** → Frontend (React)
2. **Frontend** → Nginx (Puerto 80 interno, exposto 5173)
3. **Nginx** → Backend Go (Puerto 8080) para API
4. **Nginx** → Python Flask (Puerto 8081) para procesamiento Excel
5. **Python** → Backend Go (para guardar datos)
6. **Backend** → PostgreSQL (Puerto 5432)

### ¿Por qué no es un Monolito?

| Característica | Monolito | Este Proyecto |
|----------------|----------|---------------|
| Despliegue | Un solo deploy | 4 servicios independientes |
| Escalabilidad | Vertical | Horizontal por servicio |
| Tecnología | Un solo stack | Múltiples stacks |
| Fallos | Todo cae | Aislamiento de errores |
| Desarrollo | Acoplado | Equipos independientes |

---

## Patrones de Diseño

### Backend (Go + Gin)

#### 1. MVC (Model-View-Controller)
```
├── Models (models/models.go)     → Entidades y estructura de datos
├── Controllers (handlers/)      → Lógica de negocio y HTTP
└── Views (respuestas JSON)      → Respuestas de la API
```

**Implementación:**
- **Models**: `Usuario`, `Personal`, `Planilla`, `Ingreso`, `Descuento`
- **Controllers**: Funciones en `handlers.go` que manejan requests/responses
- **Views**: Respuestas JSON estándar

#### 2. Repository Pattern (vía GORM)
El ORM GORM abstrae el acceso a datos:
```go
db.Create(&personal)        // Crear
db.First(&personal, id)     // Leer
db.Model(&personal).Updates(input) // Actualizar
db.Delete(&personal, id)    // Eliminar
```

#### 3. Middleware Pattern
```go
// Middleware de CORS
r.Use(cors.New(cors.Config{...}))

// Middleware de Inyección de BD
r.Use(func(c *gin.Context) {
    c.Set("db", db)
    c.Next()
})
```

#### 4. Dependency Injection
```go
// Inyección de DB por contexto
func getDB(c *gin.Context) *gorm.DB {
    return c.MustGet("db").(*gorm.DB)
}
```

#### 5. Layered Architecture
```
┌─────────────────────────────────────┐
│   Capa de Presentación (Handlers)   │  ← HTTP handlers, validación
├─────────────────────────────────────┤
│   Capa de Lógica de Negocio         │  ← Rules, calculations
├─────────────────────────────────────┤
│   Capa de Acceso a Datos (GORM)     │  ← Queries, ORM
├─────────────────────────────────────┤
│   Capa de Base de Datos             │  ← PostgreSQL
└─────────────────────────────────────┘
```

---

### Frontend (React + TypeScript)

#### 1. Context API Pattern (Global State)
```typescript
// AuthContext para estado global de autenticación
const AuthContext = createContext<{ isAuthenticated: boolean; login: () => void; logout: () => void }>(...)
export const useAuth = () => useContext(AuthContext)
```

#### 2. Protected Routes (Route Guards)
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  return <>{children}</>
}
```

#### 3. Service Layer / API Client Pattern
```typescript
// services/api.ts - Abstracción de HTTP
export const personalApi = {
  list: (search?: string, page = 1, ...) => api.get('/api/personal', { params: {...} }),
  create: (data: any) => api.post('/api/personal', data),
  // ...
}
```

#### 4. Composition Pattern
```
App
└── AuthContext (Provider)
    └── Routes
        ├── ProtectedRoute
        │   └── Layout
        │       ├── Sidebar
        │       └── Outlet
        │           ├── Dashboard
        │           ├── Personal
        │           ├── Planillas
        │           └── ...
        └── Auth (Login)
```

#### 5. Separation of Concerns
- **Pages**: Componentes de vista (Dashboard.tsx, Personal.tsx, etc.)
- **Components**: Componentes reutilizables (Layout.tsx)
- **Services**: Lógica de API (api.ts)

---

### Python Excel (Flask)

#### 1. Service-Oriented Architecture
```
Flask App
├── /health          → Health check
├── /process-excel   → Procesar Excel → Enviar a backend
└── /validate-excel  → Validar estructura antes de importar
```

#### 2. Adapter Pattern
Convierte formato Excel → JSON para el backend:
```python
empleados = extraer_empleados(filepath)
payload = { "mes": mes, "anio": anio, "empleados": empleados }
requests.post(f"{BACKEND_URL}/api/importar/haberes", json=payload)
```

---

## Tech Stack Completo

### Frontend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Vite** | 5.x | Build tool y dev server |
| **TailwindCSS** | 3.x | Framework de estilos |
| **React Router** | 6.x | Enrutamiento |
| **Axios** | 1.x | Cliente HTTP |
| **Nginx** | Alpine | Servidor de producción |

**Dependencias principales:**
- `react`, `react-dom` - Core de React
- `react-router-dom` - Enrutamiento
- `axios` - HTTP client
- `tailwindcss` - Estilos
- `lucide-react` - Iconos

---

### Backend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Go** | 1.25+ | Lenguaje de programación |
| **Gin** | Latest | Framework web HTTP |
| **GORM** | Latest | ORM para PostgreSQL |
| **PostgreSQL** | 18 | Base de datos |
| **bcrypt** | Latest | Encriptación de passwords |

**Librerías Go utilizadas:**
- `github.com/gin-gonic/gin` - Router HTTP
- `gorm.io/gorm` - ORM
- `gorm.io/driver/postgres` - Driver PostgreSQL
- `golang.org/x/crypto/bcrypt` - Hashing de passwords

---

### Python Excel

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Python** | 3.11 | Lenguaje de programación |
| **Flask** | 3.x | Framework web |
| **Pandas** | 2.x | Manipulación de datos |
| **openpyxl** | 3.x | Lectura de Excel (.xlsx) |
| **xlrd** | 2.x | Lectura de Excel (.xls) |
| **Gunicorn** | 21.x | Servidor WSGI |

---

### Infraestructura

| Tecnología | Descripción |
|------------|-------------|
| **Docker** | Contenedores |
| **Docker Compose** | Orquestación |
| **PostgreSQL 18 Alpine** | Base de datos ligera |
| **Nginx Alpine** | Proxy reverso |

---

## Infraestructura y Docker

### Servicios Docker

```yaml
# docker-compose.yml

services:
  postgres:        # Base de datos
    image: postgres:18-alpine
    ports: 5432
    volumes: postgres_data + init.sql

  backend:        # API Go
    build: ./backend
    ports: 8080
    depends_on: postgres (service_healthy)

  python-excel:   # Procesador Excel
    build: ./python-excel
    ports: 8081
    volumes: ./uploads
    depends_on: backend

  frontend:       # UI React
    build: ./frontend
    ports: 5173 → 80 (nginx)
    depends_on: backend, python-excel

volumes:
  postgres_data   # Persistencia de BD
```

### Dockerfiles

#### Backend (Go)
- **Build**: `golang:1.25-alpine` → compila a binario
- **Runtime**: `alpine:3.19` → imagen mínima con binario
- **Tamaño**: ~15MB

#### Frontend (React)
- **Build**: `node:20-alpine` → npm run build
- **Runtime**: `nginx:alpine` → sirve archivos estáticos
- **Multi-stage**: Optimizado para producción

#### Python Excel
- **Runtime**: Python 3.11 con todas las dependencias
- **Volúmenes**: Monta `./uploads` para archivos temporales

---

## Puertos y Endpoints

### Puertos Expuestos

| Servicio | Puerto | Contenedor | Protocolo |
|----------|--------|------------|-----------|
| **Frontend** | 5173 | nginx:80 | HTTP |
| **Backend API** | 8080 | Go server | HTTP |
| **Python Excel** | 8081 | Flask | HTTP |
| **PostgreSQL** | 5432 | postgres:5432 | TCP/Postgres |

### Mapeo de Puertos

```
localhost:5173  → planillas-frontend:80    (Nginx)
localhost:8080  → planillas-backend:8080   (Go)
localhost:8081  → planillas-python:8081    (Flask)
localhost:5432  → planillas-postgres:5432  (PostgreSQL)
```

### Endpoints por Servicio

#### Backend (Puerto 8080)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **Sistema** |||
| GET | `/health` | Health check |
| GET | `/uploads/*filepath` | Archivos subidos |
| **Autenticación** |||
| POST | `/api/usuarios/login` | Login |
| POST | `/api/usuarios/registro` | Registro |
| **Personal** |||
| GET | `/api/personal` | Listar (paginado, filtros) |
| GET | `/api/personal/:id` | Obtener uno |
| GET | `/api/personal/buscar` | Búsqueda rápida |
| POST | `/api/personal` | Crear |
| PUT | `/api/personal/:id` | Actualizar |
| DELETE | `/api/personal/:id` | Eliminar |
| GET | `/api/personal/:id/periodos` | Períodos del empleado |
| GET | `/api/personal/:id/exportar` | Exportar planillas |
| **Planillas** |||
| GET | `/api/planillas` | Listar (paginado, filtros) |
| GET | `/api/planillas/:id` | Obtener con detalles |
| POST | `/api/planillas` | Crear |
| PUT | `/api/planillas/:id` | Actualizar |
| PUT | `/api/planillas/:id/editar` | Editar completa |
| DELETE | `/api/planillas/:id` | Eliminar |
| **Ingresos** |||
| GET | `/api/planillas/:id/ingresos` | Listar ingresos |
| POST | `/api/ingresos` | Crear |
| PUT | `/api/ingresos/:id` | Actualizar |
| DELETE | `/api/ingresos/:id` | Eliminar |
| **Descuentos** |||
| GET | `/api/planillas/:id/descuentos` | Listar descuentos |
| POST | `/api/descuentos` | Crear |
| PUT | `/api/descuentos/:id` | Actualizar |
| DELETE | `/api/descuentos/:id` | Eliminar |
| **Importación** |||
| POST | `/api/importar/excel` | Importar Excel |
| POST | `/api/importar/json` | Importar JSON |
| POST | `/api/importar/haberes` | Importar haberes (formato Python) |
| **Dashboard** |||
| GET | `/api/dashboard/resumen` | Resumen general |

#### Python Excel (Puerto 8081)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/process-excel` | Procesar archivo Excel |
| POST | `/validate-excel` | Validar estructura |

#### Frontend (Puerto 5173)

El servidor Nginx está configurado como proxy reverso:

```nginx
#nginx.conf
location /api/ {
    proxy_pass http://backend:8080;
}

location /python/ {
    proxy_pass http://python-excel:8081;
}
```

---

## Estructura del Proyecto

```
planillas-sistema/
├── frontend/                    # Aplicación React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx       # Layout principal con sidebar
│   │   ├── pages/
│   │   │   ├── Auth.tsx         # Login/Registro
│   │   │   ├── Dashboard.tsx   # Panel principal
│   │   │   ├── Personal.tsx     # Gestión de empleados
│   │   │   ├── Planillas.tsx    # Gestión de planillas
│   │   │   ├── Importar.tsx    # Importación Excel
│   │   │   ├── Exportar.tsx     # Exportación datos
│   │   │   └── Configuracion.tsx
│   │   ├── services/
│   │   │   └── api.ts           # Cliente API (Axios)
│   │   ├── App.tsx              # Componente principal + Router
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Estilos globales
│   ├── nginx.conf               # Configuración Nginx
│   ├── Dockerfile               # Multi-stage build
│   ├── package.json             # Dependencias npm
│   ├── vite.config.ts           # Config Vite
│   ├── tailwind.config.js      # Config Tailwind
│   └── tsconfig.json            # Config TypeScript
│
├── backend/                     # API REST en Go
│   ├── handlers/
│   │   ├── handlers.go         # Controladores HTTP
│   │   └── excel.go            # Procesamiento Excel
│   ├── models/
│   │   └── models.go           # Entidades GORM
│   ├── main.go                 # Entry point + rutas
│   ├── Dockerfile              # Multi-stage build
│   ├── go.mod                  # Dependencias Go
│   └── go.sum                  # Lock de dependencias
│
├── python-excel/                # Servicio Flask
│   ├── app.py                  # Aplicación Flask
│   ├── requirements.txt        # Dependencias Python
│   └── Dockerfile              # Imagen Python
│
├── docker/
│   ├── init.sql                # SQL inicial (tablas, datos)
│   └── fix_triggers.sql        # Triggers de BD
│
├── uploads/                     # Archivos subidos (volumen)
│
├── docker-compose.yml           # Orquestación completa
├── README.md                    # Este archivo
└── .gitignore                   # Git ignore
```

---

## Instalación

### Requisitos Previos

| Requisito | Versión Mínima | Descripción |
|-----------|----------------|-------------|
| **Docker Desktop** | Latest | Windows/Mac |
| **Docker Engine** | Latest | Linux |
| **Docker Compose** | Latest | Incluido en Desktop |
| **RAM** | 4GB | Recomendado 8GB |

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd planillas-sistema

# 2. Iniciar servicios
docker compose up -d

# 3. Verificar estado
docker compose ps

# 4. Ver logs (opcional)
docker compose logs -f
```

### Tiempo de Inicio

- **PostgreSQL**: ~10-15 segundos (healthcheck)
- **Backend**: ~5 segundos
- **Python**: ~3 segundos
- **Frontend**: ~5 segundos
- **Total**: ~30-45 segundos

---

## Configuración

### Variables de Entorno

#### PostgreSQL
```yaml
POSTGRES_USER: planillas
POSTGRES_PASSWORD: planillas2024
POSTGRES_DB: planillas
```

#### Backend
```yaml
DATABASE_URL: postgres://planillas:planillas2024@postgres:5432/planillas?sslmode=disable
PORT: 8080  # (opcional, default 8080)
```

#### Python Excel
```yaml
BACKEND_URL: http://backend:8080
PORT: 8081  # (opcional, default 8081)
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
```

### Configuración de Producción

El frontend usa Nginx con:
- **Gzip** habilitado
- **Cache** para archivos estáticos
- **Proxy** para `/api` y `/python`
- **SPA fallback** para rutas de React

---

### Base de Datos

| Campo | Valor |
|-------|-------|
| **Host** | localhost:5432 |
| **Usuario** | planillas |
| **Password** | planillas2024 |
| **Base de datos** | planillas |

---

## Desarrollo Local

### Frontend

```bash
cd frontend
npm install
npm run dev
# Acceder: http://localhost:5173
```

### Backend

```bash
cd backend
go mod download
go run main.go
# API: http://localhost:8080
# Health: http://localhost:8080/health
```

### Python Excel

```bash
cd python-excel
pip install -r requirements.txt
python app.py
# Servicio: http://localhost:8081
```

### PostgreSQL (local, sin Docker)

```bash
# Instalar PostgreSQL 18
# Crear usuario y base de datos
createdb -U postgres planillas
psql -U postgres -d planillas
```

---

## Comandos Docker

```bash
# Iniciar todos los servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f python-excel
docker compose logs -f postgres

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (reset completo)
docker compose down -v

# Rebuild y ejecutar
docker compose up -d --build

# Ver estado de servicios
docker compose ps

# Acceder a un contenedor
docker exec -it planillas-backend sh
docker exec -it planillas-postgres psql -U planillas -d planillas
docker exec -it planillas-python sh
docker exec -it planillas-frontend sh

# Ver uso de recursos
docker stats

# Ver redes
docker network ls

# Ver volúmenes
docker volume ls

# Ver logs de un servicio específico con tail
docker compose logs --tail=100 backend
```

---

## License

MIT License
