# Estrategias de Importación de Excel

## Problema
Al importar planillas desde Excel, necesitamos identificar si un empleado ya existe en el sistema para:
- Evitar duplicados
- Mantener un historial consistente
- Actualizar datos existentes

## Opciones de Identificación

### Opción 1: Solo por DNI (Recomendado si todos tienen DNI)
```
- REQUIERE: Todos los empleados en el Excel tienen DNI
- LÓGICA: Si el DNI ya existe → actualizar, si no → crear
- VENTAJAS: Identificación precisa, sin ambiguedades
- DESVENTAJAS: Fallback si alguien no tiene DNI
```

### Opción 2: Por DNI o Nombre (Combo)
```
- PRIORIDAD 1: Coincidencia exacta de DNI
- PRIORIDAD 2: Coincidencia exacta de nombres + apellidos
- LÓGICA:
  1. Buscar por DNI exacto
  2. Si no encuentra → buscar por nombres+apellidos (case insensitive)
  3. Si encuentra uno solo → usar ese registro
  4. Si encuentra múltiples → marcar conflicto para revisión manual
  5. Si no encuentra ninguno → crear nuevo
```

### Opción 3: Por Nombre completo (Sin DNI)
```
- USAR CUANDO: El Excel no tiene columna DNI
- LÓGICA: Buscar por "Apellidos Nombres" exacto
- CONSIDERACIONES: Nombres con tildes, espacios, mayúsculas pueden variar
```

## Recomendación para este proyecto

**Usar Opción 2** con el siguiente flujo:

```
Excel → Backend → ImportarHaberes

Para cada empleado en Excel:
  1. Si tiene DNI:
     - Buscar en BD por DNI exacto
     - SI existe → usar ese ID (actualizar datos si cambian)
     - SI NO existe → ir a paso 2
  2. Si no tiene DNI o no se encontró:
     - Buscar por nombres + apellidos (ignorar mayúsculas/tildes)
     - SI hay 1 resultado → usar ese ID
     - SI hay múltiples → crear nuevo (marcar "pendiente revisión")
     - SI no hay → crear nuevo registro

  3. Crear/Actualizar planilla del período (mes + año)
```

## Manejo de Conflictos

### Escenarios posibles:

| Excel | BD Existente | Acción |
|-------|--------------|--------|
| DNI: 12345678 | DNI: 12345678 | Actualizar registro, reuse ID |
| DNI: 12345678 | No existe | Crear nuevo registro |
| Sin DNI, Nombre: "Juan Perez" | "Juan Pérez" (1 resultado) | Usar ese ID (normalizar tildes) |
| Sin DNI, Nombre: "Juan Perez" | "Juan Perez", "Juan Perez Jr" (múltiples) | Crear nuevo, marcar conflicto |

## Columnas del Excel a considerar

```
Obligatorias:
- nombres (o nombre_completo)
- mes
- anio

Opcionales (usadas para matching):
- dni
- apellidos (opcional si viene en nombre_completo)

Datos de haberes/descuentos:
- ingresos: [{concepto, monto}]
- descuentos: [{concepto, monto}]
```

## Ejemplo de payload esperado

```json
{
  "mes": 5,
  "anio": 2026,
  "empleados": [
    {
      "nombre": "Juan Perez",
      "dni": "12345678",
      "cargo": "Técnico",
      "haberes": [
        {"concepto": "Sueldo Base", "monto": 2500.00},
        {"concepto": "Bonificación", "monto": 300.00}
      ],
      "descuentos": [
        {"concepto": "AFP", "monto": 250.00},
        {"concepto": "Essalud", "monto": 75.00}
      ]
    }
  ]
}
```

## Scripts de Python sugeridos

Para extraer del Excel y enviar al backend:

```python
# Option A: Por DNI
def identificar_empleado(row):
    if row.get('dni'):
        return {"buscar_por": "dni", "valor": row['dni']}
    return {"buscar_por": "nombre", "valor": row['nombres']}

# Option B: Combo con prioridad
def identificar_empleado(row):
    if row.get('dni'):
        return {"prioridad": "dni", "dni": row['dni'], "nombre": row.get('nombres', '')}
    return {"prioridad": "nombre", "nombre": row['nombres']}
```

## Estado actual del sistema

- Backend tiene `ImportarHaberes` en handlers.go:574
- Solo busca por nombre, no maneja el caso de múltiples resultados
- No tiene lógica de "crear solo si no existe"

## Próximos pasos sugeridos

1. [ ] Modificar `ImportarHaberes` para buscar primero por DNI
2. [ ] Si no tiene DNI, buscar por nombres+apellidos
3. [ ] Manejar caso de múltiples resultados (devolver warning)
4. [ ] Agregar endpoint para resolver conflictos manualmente
5. [ ] Agregar logging de qué empleados se crearon vs actualizaron

---

## Recomendaciones de Mejora para Búsqueda y Paginación

### Problemas Actuales Identificados

1. **Búsqueda sin debounce**: Cada pulsación de tecla hace un request al backend
2. **Paginación rígida**: Siempre muestra las primeras 5 páginas
3. **Sin caché**: Las búsquedas frecuentes golpean la BD constantemente
4. **Sin índices optimizados**: Las queries de búsqueda pueden ser lentas con muchos registros

### Mejoras Recomendadas

#### 1. Búsqueda con Debounce (Frontend)
```
IMPLEMENTADO: ✓ Con debounce de 400ms en Personal.tsx y Planillas.tsx
```
- Agregar useEffect con setTimeout para delayed search
- Mostrar spinner mientras "se typing"
- Cancelar requests pendientes si hay nuevo input

#### 2. Paginación Inteligente (Frontend)
```
IMPLEMENTADO: ✓ Navegación a primera/última página
```
- Botones para ir a primera/última página
- Rango dinámico centrado en página actual
- Información de "Mostrando X - Y de Z registros"

#### 3. Índices de Base de Datos (Backend)
```sql
-- Crear índices para búsquedas frecuentes
CREATE INDEX idx_personal_dni ON personal(dni);
CREATE INDEX idx_personal_nombres ON personal(nombres);
CREATE INDEX idx_personal_apellidos ON personal(apellidos);
CREATE INDEX idx_planillas_mes_anio ON planillas(mes, anio);
CREATE INDEX idx_planillas_personal ON planillas(personal_id);
CREATE INDEX idx_ingresos_planilla ON ingresos(planilla_id);
CREATE INDEX idx_descuentos_planilla ON descuentos(planilla_id);

-- Búsqueda FULL TEXT (PostgreSQL)
CREATE INDEX idx_personal_fulltext ON personal USING gin(to_tsvector('spanish', nombres || ' ' || apellidos));
```

#### 4. Búsqueda Fuzzy (Backend)
```go
// Usar ILIKE para búsqueda case-insensitive
// Para coincidencias parciales:
// SELECT * FROM personal WHERE apellidos ILIKE '%' || $1 || '%' OR nombres ILIKE '%' || $1 || '%'

// Para búsqueda fonética (mejores resultados):
// Usar extensión unaccent de PostgreSQL
CREATE EXTENSION IF NOT EXISTS unaccent;

// Función de normalización
CREATE OR REPLACE FUNCTION normalize_text(text) RETURNS text AS $$
BEGIN
  RETURN unaccent(lower(trim($1)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

// Búsqueda normalizada
SELECT * FROM personal WHERE normalize_text(apellidos || ' ' || nombres) LIKE normalize_text('%' || $1 || '%');
```

#### 5. Implementar Cursor-Based Pagination (Alternativa)
```go
// Para mejor rendimiento con datasets grandes
type PaginatedResponse struct {
    Data       []interface{} `json:"data"`
    NextCursor *string       `json:"next_cursor,omitempty"`
    HasMore    bool          `json:"has_more"`
    Total      int64         `json:"total"`
}

// Query con cursor
func ListPersonal(cursor string, limit int) (*PaginatedResponse, error) {
    query := db.Where("id > ?", cursor).Limit(limit + 1)
    // ...
}
```

#### 6. Frontend - Infinite Scroll (Alternativa a paginación)
```tsx
// Usar Intersection Observer API
const Observer = () => {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    }, { threshold: 0.1 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className="loading-trigger" />
}
```

#### 7. API - Rate Limiting y Throttling
```go
// Implementar rate limiting por IP
func RateLimitMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Usar librería como tollbooth o golang.org/x/time/rate
    }
}
```

#### 8. Mejoras en Endpoint de Búsqueda
```go
// Endpoint actual: GET /api/personal/buscar?q=...
// Mejoras sugeridas:

// 1. Búsqueda ponderada (DNI > apellidos > nombres)
func SearchPersonal(q string) []Personal {
    // Priorizar coincidencia exacta de DNI
    // Luego apellidos
    // Finalmente nombres
}

// 2. Cache de búsquedas frecuentes
func SearchPersonalCached(q string) ([]Personal, error) {
    cacheKey := fmt.Sprintf("search:%s", q)
    if cached := cache.Get(cacheKey); cached != nil {
        return cached, nil
    }
    results := searchDB(q)
    cache.Set(cacheKey, results, 5*time.Minute)
    return results, nil
}

// 3. Query optimizada
SELECT p.*,
       ts_rank(to_tsvector('spanish', p.apellidos || ' ' || p.nombres), plainto_tsquery('spanish', $1)) as rank
FROM personal p
WHERE p.activo = true
  AND (
    p.dni ILIKE $1 OR
    p.apellidos ILIKE $1 OR
    p.nombres ILIKE $1
  )
ORDER BY rank DESC
LIMIT 10;
```

---

## Checklist de Implementación

### Fase 1: UI/UX Inmediato (YA COMPLETADO)
- [x] Debounce en búsqueda frontend (400ms)
- [x] Spinner durante búsqueda
- [x] Mejores controles de paginación
- [x] Conteo de resultados

### Fase 2: Backend Optimización
- [ ] Crear índices de BD
- [ ] Optimizar queries de búsqueda
- [ ] Implementar caché con Redis (opcional)
- [ ] Agregar rate limiting

### Fase 3: Experiencia Premium
- [ ] Infinite scroll para listas grandes
- [ ] Búsqueda por voz (Web Speech API)
- [ ] Historial de búsquedas recientes
- [ ] Búsqueda avanzada con filtros múltiples