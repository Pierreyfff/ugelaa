# Manual de Administrador — Sistema de Gestión de Planillas

---

## 1. Introducción

Este manual está dirigido al **administrador del sistema**, responsable de la configuración, mantenimiento y gestión de usuarios de la aplicación de Gestión de Planillas.

### Rol del Administrador
- Gestionar usuarios y sus permisos.
- Supervisar las importaciones y exportaciones.
- Configurar parámetros del sistema.
- Monitorear la seguridad y sesiones activas.

---

## 2. Arquitectura del Sistema

```
/* =====================================================================
   [Diagrama de Arquitectura]
   Descripción: Diagrama mostrando Frontend (React+Vite) → Backend (Go/Gin)
   → PostgreSQL, y el servicio Python (Flask) para procesamiento Excel.
   ===================================================================== */
```

El sistema está compuesto por **tres servicios** que se ejecutan en contenedores Docker:

| Servicio | Tecnología | Puerto | Función |
|----------|-----------|--------|---------|
| Frontend | React + TypeScript + Vite | 5173 | Interfaz de usuario |
| Backend | Go + Gin Framework | 8080 | API REST, lógica de negocio |
| Python | Flask + openpyxl | 8081 | Procesamiento de archivos Excel |

### Flujo de Datos

```
Usuario → Frontend (React) → Backend (Go) → PostgreSQL
                                         ↘ Python (Flask) → Excel (.xlsx)
```

---

## 3. Gestión de Usuarios

Los administradores pueden crear, editar y desactivar usuarios del sistema.

### 3.1 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso completo al sistema. Puede gestionar usuarios, importar, exportar y ver todas las planillas. |
| **asistente** | Puede importar, exportar y consultar planillas. No puede gestionar usuarios ni acceder a configuración avanzada. |

### 3.2 Crear un Nuevo Usuario

Paso a paso:

1. Inicie sesión con una cuenta **admin**.
2. Vaya a **"Configuración"** en el menú lateral.
3. Busque la sección **"Gestión de Usuarios"**.
4. Haga clic en **"Nuevo Usuario"**.
5. Complete los campos:
   - **Nombres**: Nombre completo del usuario.
   - **Correo electrónico**: Correo para inicio de sesión (debe ser único).
   - **Contraseña**: Contraseña temporal (el usuario podrá cambiarla después).
   - **Rol**: Seleccione "admin" o "asistente".
6. Haga clic en **"Guardar"**.
7. El sistema mostrará un mensaje de confirmación.

### 3.3 Editar un Usuario Existente

1. Vaya a **"Configuración" → "Gestión de Usuarios"**.
2. Localice al usuario en la tabla.
3. Haga clic en el icono de **editar** (lápiz).
4. Modifique los campos necesarios.
5. Haga clic en **"Guardar Cambios"**.

### 3.4 Desactivar / Eliminar un Usuario

1. En la tabla de usuarios, haga clic en el icono de **eliminar** (basurero).
2. Confirme la operación en el diálogo de confirmación.
3. El usuario quedará desactivado y no podrá iniciar sesión.

---

## 4. Seguridad y Sesiones

### 4.1 Política de Sesiones

- **Tiempo de expiración por inactividad**: 30 minutos.
- **Alcance**: Frontend detecta inactividad (mouse, teclado) y cierra sesión automáticamente.
- **Tokens**: Cada inicio de sesión genera un token único de 64 caracteres hexadecimales almacenado en la base de datos.

### 4.2 Autenticación

```
/* =====================================================================
   [Captura de pantalla: Login]
   Descripción: Pantalla de inicio de sesión con campos email y password.
   ===================================================================== */
```

El sistema utiliza **autenticación por token bearer**:

1. El usuario ingresa correo y contraseña.
2. El backend verifica contra la base de datos usando **bcrypt**.
3. Se genera un token aleatorio y se devuelve al frontend.
4. El frontend almacena el token en `localStorage` y lo envía en cada petición.
5. El backend valida el token en cada request (excepto login y health).

### 4.3 Protección contra Fuerza Bruta

- **Límite**: 5 intentos fallidos de login por IP.
- **Bloqueo temporal**: Al superar el límite, la IP queda bloqueada por tiempo indefinido (hasta que el administrador reinicie el servicio).
- **Reseteo**: El contador se reinicia al iniciar sesión exitosamente.

### 4.4 Headers de Seguridad

El backend incluye los siguientes headers HTTP en todas las respuestas:

| Header | Valor |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |

---

## 5. Base de Datos

### 5.1 Esquema Principal

```
/* =====================================================================
   [Diagrama DER - Entidad Relación]
   Descripción: Diagrama mostrando las tablas usuarios, personal,
   planillas, haberes, descuentos y sus relaciones.
   ===================================================================== */
```

El sistema utiliza **PostgreSQL** con las siguientes tablas principales:

- **usuarios**: Almacena las cuentas de usuario (id, nombre, email, password_hash, token, rol).
- **personal**: Datos del personal docente (id, apellidos, nombres, dni, institución, cargo, rd, uu).
- **planillas**: Registros de planillas mensuales (id, personal_id, año, mes, total_haberes, total_descuentos, total_liquido).
- **haberes**: Conceptos de haberes por planilla.
- **descuentos**: Conceptos de descuentos por planilla.

### 5.2 Conexión

La conexión a la base de datos se configura mediante la variable de entorno `DATABASE_URL` con formato:

```
postgres://usuario:contraseña@host:5432/nombre_bd
```

---

## 6. Mantenimiento y Operaciones

### 6.1 Respaldos

Se recomienda realizar respaldos periódicos de la base de datos:

```bash
pg_dump "postgres://usuario:contraseña@localhost:5432/planillas_db" > respaldo_$(date +%Y%m%d).sql
```

### 6.2 Logs

Los logs del sistema se pueden visualizar mediante:

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f python-excel
```

### 6.3 Reinicio de Servicios

```bash
# Reiniciar un servicio específico
docker-compose restart backend

# Reiniciar todos los servicios
docker-compose restart
```

---

## 7. Solución de Problemas

| Problema | Causa Posible | Solución |
|----------|--------------|----------|
| Usuario no puede iniciar sesión | Token inválido o usuario bloqueado | Verificar en BD que el usuario exista y tenga token |
| Importación falla | Formato de Excel incorrecto | Verificar que el archivo cumpla el formato esperado |
| Error 502 en exportación | Servicio Python caído | `docker-compose restart python-excel` |
| Error 500 en general | Error interno del backend | Revisar logs: `docker-compose logs backend` |
| CORS bloqueado | Origen no configurado | Verificar variable `CORS_ORIGINS` |

---

## 8. Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgres://postgres:postgres@db:5432/planillas_db` |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:5173` |
| `PORT` | Puerto del backend | `8080` |
| `BACKEND_URL` | URL del backend (para Python) | `http://backend:8080` |
| `VITE_API_URL` | URL de la API (frontend) | `http://localhost:8080/api` |
| `VITE_PYTHON_URL` | URL del servicio Python | `http://localhost:8081` |

---

## 9. Recomendaciones

1. **Cambiar contraseñas periódicamente** cada 90 días.
2. **Monitorear los logs** semanalmente para detectar accesos no autorizados.
3. **Mantener actualizados** los servicios y dependencias.
4. **No compartir credenciales** de administrador.
5. **Respaldar la base de datos** al menos una vez por semana.

---

*Documento generado el — Sistema de Gestión de Planillas v1.0*
