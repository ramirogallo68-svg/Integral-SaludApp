/**
 * Utilidades para el manejo de fechas y rangos de tiempo
 * considerando la zona horaria local del usuario.
 */

/**
 * Obtiene el rango de inicio y fin de un día específico en formato ISO con offset.
 * Útil para filtrar turnos que ocurren "hoy" o en un día específico.
 */
export function getLocalDayRange(date: Date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    return {
        start: start.toISOString(),
        end: end.toISOString()
    }
}

/**
 * Obtiene el lunes de la semana a la que pertenece la fecha dada.
 */
export function getMondayOf(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    // El lunes es el día 1. Si es domingo (0), restamos 6.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
}

/**
 * Obtiene un rango de 7 días (una semana) empezando por el día dado.
 */
export function getWeeklyRange(startDay: Date) {
    const start = new Date(startDay)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return {
        start: start.toISOString(),
        end: end.toISOString()
    }
}

/**
 * Formatea una fecha para mostrarla en el input type="date" (YYYY-MM-DD)
 * respetando la fecha local.
 */
export function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
