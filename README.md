# Sistema de Gestión de Planillas

Sistema web completo para la gestión de planillas de personal, permetidos, ingresos y descuentos.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Go + Gin + GORM
- **Base de datos**: PostgreSQL
- **Procesamiento Excel**: Python + Pandas + openpyxl
- **Contenedores**: Docker + Docker Compose

## Estructura del Proyecto

```
PLANILLASU/
├── frontend/          # Aplicación React
├── backend/          # API REST en Go
├── python-excel/     # Servicio de procesamiento Excel
├── docker/           # Scripts de base de datos
└── docker-compose.yml
```

## Requisitos Previos

- Docker y Docker Compose instalados
- Git

## Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd PLANILLASU
```

2. Iniciar los servicios con Docker Compose:
```bash
docker-compose up --build
```

3. Acceder a los servicios:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Python Excel: http://localhost:8081

## Configuración

### Variables de Entorno

**Backend** (docker-compose.yml):
- `DATABASE_URL`: URL de conexión PostgreSQL
- `PORT`: Puerto del servidor (default: 8080)

**Python Excel**:
- `BACKEND_URL`: URL del backend Go

### Base de Datos

Las tablas se crean automáticamente via GORM AutoMigrate:
- `usuarios`: Usuarios del sistema
- `personal`: Datos de empleados
- `planillas`: Planillas mensuales
- `ingresos`: Ingresos por empleado
- `descuentos`: Descuentos por empleado

## API Endpoints

### Autenticación
- `POST /api/usuarios/login` - Iniciar sesión
- `POST /api/usuarios/registro` - Registar usuario

### Personal
- `GET /api/personal` - Listar todo el personal
- `GET /api/personal/:id` - Obtener empleado
- `POST /api/personal` - Crear empleado
- `PUT /api/personal/:id` - Actualizar empleado
- `DELETE /api/personal/:id` - Eliminar empleado

### Planillas
- `GET /api/planillas` - Listar planillas
- `POST /api/planillas` - Crear planilla
- `GET /api/planillas/:id/ingresos` - Ver ingresos de planilla
- `GET /api/planillas/:id/descuentos` - Ver descuentos de planilla

### Importación
- `POST /api/importar/excel` - Importar desde Excel
- `POST /api/importar/json` - Importar desde JSON
- `POST /api/importar/haberes` - Importar haberes

### Dashboard
- `GET /api/dashboard/resumen` - Resumen de datos

## Desarrollo Local

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go mod download
go run main.go
```

### Python Excel
```bash
cd python-excel
pip install -r requirements.txt
python app.py
```

## Licencia

MIT

Entra a PLANILLASU/ugelaa y haz todo esto:hagamos un REWORK por completo al forntned garantizando ui & ux limpiando por completo lo que ya existia, usando mejor los espacios, modales, botones, iconos, diseño que se parezca a la de la imagen, vamso modulo por modulo. vamos recuerda usar la paleta rojo, blanco y gris (NINGUN OTRO COLOR) vamos con todo eso quiero que sea mas profesional quitando cosas inncesarioas (notificaciones,configuracion por ahora) vamos paso a paso  vamos un reowrk ocn todo lo que es forntend garantizadno ui&ux ademas de mejorar el uso de espacios, iconos, modales, ventanas emergentes, y todo lo demas el contenido optimo si ves necesario elimiar algunas cosas y usar reutilizable en compponentes, todo como un experto en frontend cambiando por completo [Image 1]  con esa paleta rojo, blanco, gris vamos hazlo modulo pro modulo