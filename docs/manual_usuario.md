# Manual de Usuario — Sistema de Gestión de Planillas

---

## 1. Introducción

El **Sistema de Gestión de Planillas** es una aplicación web que permite administrar, importar y exportar las planillas de pago del personal docente de una UGEL. Está diseñado para ser usado por asistentes administrativos y personal responsable de la gestión de haberes y descuentos.

### Propósito
Facilitar la consulta, importación y exportación de planillas mensuales del personal docente, reemplazando procesos manuales con una interfaz web moderna y eficiente.

---

## 2. Requisitos del Sistema

### Navegadores compatibles
- Google Chrome (versión 90+)
- Mozilla Firefox (versión 90+)
- Microsoft Edge (versión 90+)
- Safari (versión 14+)

### Dispositivos
- Computadora de escritorio o laptop (recomendado)
- Tablets (adaptable)
- No recomendado para smartphones

### Conexión
- Conexión a internet estable
- Puerto 5173 (desarrollo) o 80/443 (producción)

---

## 3. Acceso al Sistema

### 3.1 Pantalla de Inicio de Sesión

```
/* =====================================================================
   [Captura de pantalla: Pantalla de Login]
   Descripción: Formulario de inicio de sesión con campos de correo
   electrónico y contraseña, más el botón "Ingresar".
   ===================================================================== */
```

Al acceder a la aplicación, se muestra la pantalla de inicio de sesión con los siguientes campos:

- **Correo electrónico**: Ingrese su correo registrado en el sistema.
- **Contraseña**: Ingrese su contraseña.

### 3.2 Ingresar al Sistema

Paso a paso:

1. Abra su navegador web.
2. Ingrese la URL proporcionada por el administrador.
3. En la pantalla de login, escriba su **correo electrónico**.
4. Escriba su **contraseña**.
5. Haga clic en el botón **"Ingresar"**.
6. Espere unos segundos mientras el sistema valida sus credenciales.
7. Será redirigido automáticamente al **Dashboard** principal.

> **Nota:** Si olvida su contraseña, contacte al administrador del sistema.

### 3.3 Cierre de Sesión

Para cerrar la sesión de forma segura:

1. Haga clic en su **nombre de usuario** (esquina superior derecha).
2. En el menú desplegable, seleccione **"Cerrar Sesión"**.
3. Será redirigido a la pantalla de inicio de sesión.

> El sistema cerrará la sesión **automáticamente** después de **30 minutos de inactividad** por seguridad.

---

## 4. Dashboard (Inicio)

```
/* =====================================================================
   [Captura de pantalla: Dashboard / Pantalla principal]
   Descripción: Vista general con tarjetas de resumen (total personal,
   planillas del mes, importaciones recientes, exportaciones).
   ===================================================================== */
```

El **Dashboard** es la pantalla principal que se muestra al iniciar sesión. Aquí encontrará:

- **Resumen general**: Tarjetas con estadísticas clave (total de personal, planillas del mes, etc.).
- **Accesos directos**: Botones para ir rápidamente a las secciones más usadas.
- **Actividad reciente**: Listado de las últimas importaciones y exportaciones realizadas.

### Navegación principal (menú lateral izquierdo)

| Icono | Sección | Descripción |
|-------|---------|-------------|
| 📊 | Dashboard | Resumen general del sistema |
| 👥 | Planillas | Gestión del personal docente |
| 📤 | Importar | Importar datos desde Excel |
| 📥 | Exportar | Exportar planillas a Excel |
| ⚙️ | Configuración | Ajustes del sistema |

---

## 5. Gestión de Planillas (Personal Docente)

```
/* =====================================================================
   [Captura de pantalla: Listado de personal docente]
   Descripción: Tabla con el listado del personal, columnas de datos,
   barra de búsqueda y filtros.
   ===================================================================== */
```

Esta sección permite **consultar, buscar y visualizar** la información del personal docente registrado.

### 5.1 Buscar Personal

1. En el menú lateral, haga clic en **"Planillas"**.
2. Use la **barra de búsqueda** para filtrar por apellidos, nombres o DNI.
3. Los resultados se actualizan automáticamente mientras escribe.

### 5.2 Ver Detalle de un Docente

1. Localice al docente en la tabla.
2. Haga clic en el botón **"Ver Detalle"** (icono de ojo) en la fila correspondiente.
3. Se mostrará una ventana con información detallada del docente y sus planillas.

### 5.3 Información del Docente

La vista de detalle incluye:
- **Datos personales**: Apellidos, nombres, DNI.
- **Datos institucionales**: Institución, cargo, RD, unidad operativa.
- **Planillas registradas**: Listado mensual de haberes y descuentos por año.

---

## 6. Importar Datos

```
/* =====================================================================
   [Captura de pantalla: Página de importación]
   Descripción: Formulario para subir archivo Excel, selector de tipo
   de importación, y botón "Importar".
   ===================================================================== */
```

La sección **"Importar"** permite cargar datos desde archivos Excel al sistema.

### 6.1 Pasos para Importar

1. Haga clic en **"Importar"** en el menú lateral.
2. Seleccione el **tipo de importación**:
   - **Planillas**: Datos de haberes y descuentos.
   - **Personal**: Datos del personal docente.
3. Haga clic en **"Seleccionar Archivo"** y elija el archivo Excel (.xlsx).
4. Haga clic en **"Importar"**.
5. Espere mientras el sistema procesa el archivo.
6. Al finalizar, verá un mensaje de éxito con el resumen de la importación.

### 6.2 Formato del Archivo

El archivo Excel debe seguir la estructura establecida por la UGEL. Asegúrese de que las columnas coincidan con los campos esperados por el sistema.

---

## 7. Exportar Planillas

```
/* =====================================================================
   [Captura de pantalla: Página de exportación]
   Descripción: Selector de año, mes, tipo de exportación y botón
   "Exportar".
   ===================================================================== */
```

La sección **"Exportar"** permite generar archivos Excel con las planillas de pago consolidadas.

### 7.1 Pasos para Exportar

1. Haga clic en **"Exportar"** en el menú lateral.
2. Seleccione el **año** y **mes** (opcional) de las planillas a exportar.
3. Seleccione el **tipo de exportación**:
   - **Exportación Simple**: Planillas individuales por docente.
   - **Exportación Masiva**: Todas las planillas del período seleccionado.
4. Haga clic en **"Exportar"**.
5. El archivo Excel se descargará automáticamente.

### 7.2 Archivo Generado

El archivo Excel descargado incluye:
- Logo institucional en la cabecera.
- Datos del personal docente.
- Desglose mensual de haberes y descuentos.
- Totales por período.

---

## 8. Configuración

```
/* =====================================================================
   [Captura de pantalla: Página de configuración]
   Descripción: Opciones de configuración del sistema como tema oscuro.
   ===================================================================== */
```

### 8.1 Tema Oscuro/Claro

Puede alternar entre el tema claro y oscuro:

1. Vaya a **"Configuración"** en el menú lateral.
2. Active o desactive la opción **"Tema Oscuro"**.
3. El cambio se aplica inmediatamente y se guarda para futuras sesiones.

---

## 9. Solución de Problemas Comunes

### No puedo iniciar sesión
- Verifique que su correo y contraseña sean correctos.
- Revise que el bloqueo de mayúsculas esté desactivado.
- Si el problema persiste, contacte al administrador.

### El archivo no se importa
- Asegúrese de que el archivo esté en formato .xlsx.
- Verifique que las columnas del archivo coincidan con el formato esperado.
- Compruebe que el archivo no esté dañado.

### La exportación falla
- Verifique que existan planillas registradas para el período seleccionado.
- Intente con un rango de fechas más pequeño.
- Si el error persiste, contacte al administrador.

### La sesión se cierra sola
- Es normal después de **30 minutos de inactividad** como medida de seguridad.
- Simplemente vuelva a iniciar sesión.

---

## 10. Soporte Técnico

Para reportar errores o solicitar ayuda:

- **Correo de soporte**: [correo del administrador]
- **Horario de atención**: Lunes a viernes de 8:00 a 17:00 horas.

---

*Documento generado el — Sistema de Gestión de Planillas v1.0*
