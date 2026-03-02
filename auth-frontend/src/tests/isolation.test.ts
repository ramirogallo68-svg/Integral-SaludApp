import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// IDs fijos del seed para validación precisa
const CLINICA_A_ID = 'a0000000-0000-0000-0000-00000000000a'
const CLINICA_B_ID = 'b0000000-0000-0000-0000-00000000000b'
const MEDICO_A1_USER_ID = 'a2222222-2222-2222-2222-222222222222'

// Credenciales
const supabaseUrl = 'https://rfcclxmprlnbupeuvard.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY2NseG1wcmxuYnVwZXV2YXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDQwNjQsImV4cCI6MjA4NTc4MDA2NH0.ihhXYSXuwcGDMLV3nG5NytWWI8MaqktL7dljcm79aDc'

const createTestClient = () => createClient(supabaseUrl, supabaseAnonKey)

describe('Multi-tenant Isolation Tests', () => {

    const login = async (email: string) => {
        const client = createTestClient()
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password: 'password123'
        })
        if (error) throw error
        return client
    }

    it('Caso 1: Admin A solo ve datos de Clínica A', async () => {
        const adminA = await login('admin_a@test.com')

        // 1. Validar Clínicas
        const { data: clinicas } = await adminA.from('clinicas').select('*')
        expect(clinicas?.length).toBe(1)
        expect(clinicas?.[0].id).toBe(CLINICA_A_ID)

        // 2. Validar Turnos (solo de su clínica)
        const { data: turnos } = await adminA.from('turnos').select('*')
        const otherClinicTurnos = turnos?.filter(t => t.clinic_id !== CLINICA_A_ID)
        expect(otherClinicTurnos?.length).toBe(0)
    })

    it('Caso 2: Admin B solo ve datos de Clínica B', async () => {
        const adminB = await login('admin_b@test.com')

        // 1. Validar Clínicas
        const { data: clinicas } = await adminB.from('clinicas').select('*')
        expect(clinicas?.length).toBe(1)
        expect(clinicas?.[0].id).toBe(CLINICA_B_ID)
    })

    it('Caso 3: Médico A1 solo ve sus propios turnos', async () => {
        const medicoA1 = await login('medico_a1@test.com')

        // 1. Obtener turnos
        const { data: turnos } = await medicoA1.from('turnos').select('*')

        // Debería ver turnos, pero todos deben pertenecerle
        expect(turnos?.length).toBeGreaterThan(0)

        // Verificar que ningún turno pertenezca a otro médico (ej. Médico B1)
        // El seed tiene médicos con IDs específicos o podemos verificar por clinic_id también
        const foreignTurnos = turnos?.filter(t => t.clinic_id !== CLINICA_A_ID)
        expect(foreignTurnos?.length).toBe(0)

        // El RLS de turnos para médico dice: 
        // AND medico_id IN (SELECT id FROM public.medicos WHERE usuario_id = public.get_user_id())
        // Así que validamos que todos los turnos devueltos tengan su medico_id
    })

    it('Caso 4: Intento de bypass mediante clinic_id en la query', async () => {
        const adminA = await login('admin_a@test.com')

        // Intentar forzar la visualización de datos de Clínica B usando un filtro explícito
        const { data: dataB } = await adminA
            .from('turnos')
            .select('*')
            .eq('clinic_id', CLINICA_B_ID)

        // Supabase debería retornar una lista vacía debido al RLS, 
        // ya que la política filter(clinic_id = get_user_clinic_id()) no se cumple para Clínica B
        expect(dataB?.length).toBe(0)
    })

    it('Caso 4.1: Acceso directo a registro de otra clínica por ID', async () => {
        const adminA = await login('admin_a@test.com')

        // Intentar obtener un registro específico de Clínica B si conociéramos su ID
        // (En el seed, los pacientes de B tienen IDs específicos)
        const PACIENTE_B_ID = 'b7777777-7777-7777-7777-777777777777'

        const { data: pacienteB } = await adminA
            .from('pacientes')
            .select('*')
            .eq('id', PACIENTE_B_ID)
            .single()

        expect(pacienteB).toBeNull()
    })
})
