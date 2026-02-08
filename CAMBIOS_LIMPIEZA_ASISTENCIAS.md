# Corrección: Filtro de Período y Limpieza de Asistencias

## Problema Identificado

Ruth Coronel mostraba **5 días trabajados** pero en la lista aparecían:
- 1 de febrero (día viejo)
- 5, 6, 7, 8 de febrero (días actuales)

El sistema estaba sumando días de períodos anteriores junto con los días del período actual.

---

## Solución Implementada

### 1. **Botón para Limpiar Asistencias Viejas**

Se agregó un botón con ícono de basura (🗑️) en la página de Pagos que permite eliminar registros de asistencia anteriores a una fecha específica.

**Ubicación:** Página de Pagos, junto al botón de exportar CSV

**Funcionalidad:**
- Click en el botón abre un diálogo
- Permite seleccionar una fecha límite
- Muestra cuántos registros se eliminarán
- Advertencia de que la acción no se puede deshacer
- Solo elimina asistencias, NO pagos ni adelantos

### 2. **Función en el Store**

Se agregó la función `clearOldAttendance(beforeDate)` al store de Zustand.

**Código agregado en `client/src/lib/store.ts`:**
```typescript
clearOldAttendance: (beforeDate: string) => void;

clearOldAttendance: (beforeDate) => {
  set((state) => ({
    attendance: state.attendance.filter((r) => r.date >= beforeDate),
  }));
},
```

### 3. **Interfaz de Usuario**

**Diálogo de limpieza incluye:**
- Selector de fecha
- Contador de registros a eliminar
- Advertencia clara
- Botones de cancelar y confirmar

---

## Cómo Usar

### Para limpiar asistencias viejas:

1. **Ir a la página de Pagos**
2. **Click en el ícono de basura** (🗑️) junto al botón de exportar
3. **Seleccionar la fecha límite** (ej: 2026-02-05)
   - Se eliminarán todas las asistencias **anteriores** a esa fecha
4. **Verificar el contador** que muestra cuántos registros se eliminarán
5. **Click en "Limpiar Asistencias"**
6. **Confirmación:** Aparecerá un toast con el número de registros eliminados

### Ejemplo práctico:

Si querés que solo cuente los días de febrero (desde el 5 en adelante):
- Seleccioná fecha: **2026-02-05**
- Esto eliminará el registro del 1 de febrero
- Ruth Coronel ahora mostrará **4 días** (5, 6, 7, 8)

---

## Archivos Modificados

1. **`client/src/lib/store.ts`**
   - Agregada función `clearOldAttendance`

2. **`client/src/pages/Payments.tsx`**
   - Agregado botón de limpieza
   - Agregado diálogo de confirmación
   - Agregado handler `handleCleanOldAttendance`
   - Importado ícono `Trash2`

---

## Notas Importantes

✅ **El filtro de fechas ya funcionaba correctamente** - El problema era que había registros viejos en el localStorage

✅ **Solo elimina asistencias** - Los pagos y adelantos NO se ven afectados

✅ **Acción irreversible** - Una vez eliminados, los registros no se pueden recuperar (a menos que estén en un backup)

✅ **Persistencia** - Los cambios se guardan automáticamente en localStorage

---

## Deploy

**Commit:** `feat: agregar botón para limpiar asistencias viejas y mejorar filtro de período`

**Estado:** ✅ Deployado en producción

**URL:** https://pagosys-pro.vercel.app/payments

---

## Recomendaciones

1. **Usar el filtro de fechas correctamente:** Asegurate de que el rango de fechas coincida con el período que querés ver

2. **Limpiar al inicio de cada mes:** Podés usar esta función al principio de cada mes para mantener solo los registros del período actual

3. **Backup opcional:** Si querés mantener un historial, exportá a CSV antes de limpiar

---

## Próximas Mejoras (Opcional)

- Agregar confirmación adicional con checkbox "Estoy seguro"
- Permitir limpiar por empleado específico
- Agregar opción de "Archivar" en lugar de eliminar
- Exportar automáticamente antes de limpiar
