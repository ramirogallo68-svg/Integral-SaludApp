import { createClient } from '@supabase/supabase-js'

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Las puedes encontrar en: Supabase Dashboard > Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.error('ERROR: VITE_SUPABASE_URL no está configurado en el archivo .env')
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('ERROR: VITE_SUPABASE_ANON_KEY no está configurado en el archivo .env')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
)

// Tipos para la base de datos
export interface Usuario {
    id: string
    auth_user_id: string
    clinic_id: string | null
    email: string
    nombre_completo: string
    rol: 'SUPER_ADMIN' | 'ADMIN_CLINICA' | 'MEDICO' | 'PACIENTE'
    activo: boolean
    created_at: string
    updated_at: string
}

export interface Clinica {
    id: string
    nombre: string
    direccion: string | null
    telefono: string | null
    email: string | null
    activa: boolean
    created_at: string
    updated_at: string
}

export interface Especialidad {
    id: string
    clinic_id: string
    nombre: string
    descripcion: string | null
    activa: boolean
    created_at: string
    updated_at: string
}

export interface Medico {
    id: string
    clinic_id: string
    usuario_id: string
    especialidad_id: string
    matricula: string
    horario_atencion: any
    duracion_turno_minutos: number
    activo: boolean
    created_at: string
    updated_at: string
    usuario?: Usuario
    especialidad?: Especialidad
}

export interface Paciente {
    id: string
    clinic_id: string
    usuario_id: string | null
    nombre_completo: string
    dni: string
    fecha_nacimiento: string | null
    telefono: string | null
    email: string | null
    direccion: string | null
    obra_social: string | null
    numero_afiliado: string | null
    created_at: string
    updated_at: string
    usuario?: Usuario
}

export interface Turno {
    id: string
    clinic_id: string
    medico_id: string
    paciente_id: string
    fecha_hora: string
    duracion_minutos: number
    estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO' | 'AUSENTE'
    motivo_consulta: string | null
    observaciones: string | null
    created_at: string
    updated_at: string
    medico?: Medico
    paciente?: Paciente
}

export interface HistoriaClinica {
    id: string
    clinic_id: string
    paciente_id: string
    turno_id: string | null
    medico_id: string
    fecha: string
    diagnostico: string | null
    tratamiento: string | null
    observaciones: string | null
    archivos_adjuntos: any | null
    created_at: string
    updated_at: string
    medico?: Medico
    paciente?: Paciente
}
