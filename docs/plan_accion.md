# Plan de Acción — Sistema de Gestión de Planillas UGEL

---

## 1. Resumen Ejecutivo

**Proyecto:** Sistema web para la gestión, importación y exportación de planillas de pago del personal docente de una UGEL.

**Objetivo General:** Automatizar el proceso de administración de planillas mensuales, eliminando el trabajo manual con archivos Excel y reduciendo errores de datos.

**Alcance:** Módulos de gestión de personal, importación de haberes/descuentos desde Excel, exportación de planillas consolidadas, y dashboard de resumen.

**Duración Total Estimada:** 12 semanas (3 meses).

---

## 2. Objetivos Específicos

| # | Objetivo | Indicador de Éxito |
|---|----------|-------------------|
| OE1 | Implementar autenticación segura con roles (admin/asistente) | Login funcional, 2 roles operativos, sesión con timeout de 30 min |
| OE2 | Desarrollar módulo de importación de planillas desde Excel | Importación exitosa de archivos .xlsx con validación de estructura |
| OE3 | Desarrollar módulo de exportación de planillas a Excel | Exportación con formato institucional (logo, datos, totales) |
| OE4 | Implementar dashboard con resumen de datos | Estadísticas en tiempo real: total personal, planillas del mes |
| OE5 | Desplegar en producción (Render + Vercel) | Sistema accesible 24/7 con DNS propio |

---

## 3. Cronograma de Actividades

```
/* =====================================================================
   [Diagrama de Gantt — 12 semanas]
   Semana 1-2:   Análisis y diseño (requisitos, DER, mockups)
   Semana 3-4:   Backend API REST (Go/Gin + PostgreSQL)
   Semana 5-6:   Frontend (React + Tailwind + rutas)
   Semana 7-8:   Módulo de importación Excel (Python + Flask)
   Semana 9-10:  Módulo de exportación Excel (openpyxl + plantilla)
   Semana 11:    Despliegue (Docker, Render, Vercel)
   Semana 12:    Pruebas finales y documentación
   ===================================================================== */
```

| Fase | Actividad | Semanas | Responsable | Entregable |
|------|-----------|---------|-------------|------------|
| **1. Análisis** | Relevamiento de requisitos con usuario | 1–2 | Desarrollador | Documento de requisitos |
| | Diseño de base de datos (DER) | 2 | Desarrollador | Modelo entidad-relación |
| | Prototipado de interfaces | 2 | Desarrollador | Mockups Figma |
| **2. Backend** | Configurar proyecto Go + Gin + GORM | 3 | Desarrollador | API base funcional |
| | CRUD personal, planillas, ingresos, descuentos | 3–4 | Desarrollador | Endpoints REST |
| | Autenticación con tokens + rate limiting | 4 | Desarrollador | Login/Logout funcional |
| **3. Frontend** | Configurar React + Vite + Tailwind | 5 | Desarrollador | Proyecto base |
| | Componentes: Layout, Sidebar, Header | 5 | Desarrollador | Navegación funcional |
| | Páginas: Dashboard, Planillas | 5–6 | Desarrollador | Visualización de datos |
| | Páginas: Importar, Exportar, Configuración | 6 | Desarrollador | Formularios operativos |
| | Protección de rutas + interceptor Axios | 6 | Desarrollador | Auth completa |
| **4. Importación** | Servicio Python Flask + openpyxl | 7 | Desarrollador | API de proceso Excel |
| | Parseo de Excel a JSON estructurado | 7–8 | Desarrollador | Importación funcional |
| | Validación de estructura Excel | 8 | Desarrollador | Validación pre-import |
| **5. Exportación** | Plantilla Excel con logo institucional | 9 | Desarrollador | plantilla_nueva.xlsx |
| | Generación de Excel con datos + logo | 9–10 | Desarrollador | Exportación funcional |
| **6. Despliegue** | Docker Compose (postgres, backend, python, frontend) | 11 | Desarrollador | docker-compose.yml |
| | Despliegue en Render (backend + python) | 11 | Desarrollador | Servicios activos |
| | Despliegue en Vercel (frontend) | 11 | Desarrollador | Web accesible |
| **7. Cierre** | Pruebas de integración y correcciones | 12 | Desarrollador | Sistema estable |
| | Documentación (manuales de usuario, admin, dev) | 12 | Desarrollador | 3 manuales + plan de acción |

---

## 4. Recursos

### 4.1 Humanos

| Rol | Cantidad | Responsabilidades |
|-----|----------|-------------------|
| Desarrollador Full Stack | 1 | Backend (Go), Frontend (React), Python, DevOps |
| Usuario final / Stakeholder | 1 | Pruebas, validación de requisitos, retroalimentación |

### 4.2 Tecnológicos

| Recurso | Especificación | Costo Estimado |
|---------|---------------|----------------|
| Servidor Backend | Render (Docker, 512 MB RAM, 1 vCPU) | Gratuito / $7 mes |
| Servidor Python | Render (Docker, 512 MB RAM) | Gratuito / $7 mes |
| Base de datos | PostgreSQL (Render o Neon.tech) | Gratuito (hasta 500 MB) |
| Frontend | Vercel (SPA estática, plan Hobby) | Gratuito |
| Dominio | .com / .pe (opcional) | ~$10 año |
| Desarrollo | Laptop personal, Docker, VSCode | Existente |
| Total estimado/mes | — | **~$14/mes** |

### 4.3 Software y Herramientas

- **Control de versiones:** Git + GitHub
- **IDE:** Visual Studio Code
- **Contenedores:** Docker Desktop
- **Diseño:** Figma (mockups)
- **Documentación:** Markdown / Word / Google Docs

---

## 5. Riesgos y Mitigación

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| R1 | Cambio en formato de Excel institucional | Alta | Alto | Validación flexible, mensajes de error claros |
| R2 | Caída del servicio de hosting | Baja | Alto | Docker local funcional, respaldo PostgreSQL |
| R3 | Dependencia de bibliotecas externas obsoletas | Media | Medio | Usar versiones LTS, revisar compatibilidad |
| R4 | Datos inconsistentes en migración | Media | Alto | Triggers de validación en BD, pruebas exhaustivas |
| R5 | Usuarios sin experiencia técnica | Alta | Bajo | Manual de usuario detallado, interfaz intuitiva |
| R6 | Tiempo limitado del desarrollador | Media | Medio | Priorizar funcionalidades core, MVP primero |

---

## 6. Métricas de Éxito

| Métrica | Objetivo | Cómo se Mide |
|---------|----------|--------------|
| Tiempo de importación | < 30 segundos para 500 registros | Log del servicio Python |
| Tiempo de exportación | < 10 segundos por planilla | Log del servicio Python |
| Disponibilidad del sistema | 99% uptime en horario laboral | Health checks de Render |
| Precisión de datos importados | 100% (sin errores de parseo) | Validación post-importación |
| Satisfacción del usuario | > 80% | Encuesta cualitativa |
| Tiempo de respuesta API | < 500 ms (p95) | Logs del backend Go |

---

## 7. Entregables Finales

| # | Entregable | Formato |
|---|-----------|---------|
| E1 | Código fuente completo | Repositorio GitHub (branch `final-v1`) |
| E2 | Base de datos funcional | PostgreSQL con schema e init.sql |
| E3 | Sistema desplegado | URLs de Render + Vercel |
| E4 | Manual de Usuario | `docs/manual_usuario.md` |
| E5 | Manual de Administrador | `docs/manual_administrador.md` |
| E6 | Manual de Desarrollador | `docs/manual_desarrollador.md` |
| E7 | Plan de Acción | `docs/plan_accion.md` (este documento) |

---

*Documento generado el — Sistema de Gestión de Planillas v1.0 — PPP*
