import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rfcclxmprlnbupeuvard.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY2NseG1wcmxuYnVwZXV2YXJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIwNDA2NCwiZXhwIjoyMDg1NzgwMDY0fQ.pUOUtNg512N_Yf2hnRngL9yyQ0sK7OVxgvkKdxMYQBM'

const CLINICA_A_ID = 'a0000000-0000-0000-0000-00000000000a'
const CLINICA_B_ID = 'b0000000-0000-0000-0000-00000000000b'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const testUsers = [
    { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin_a@test.com', rol: 'ADMIN_CLINICA', clinic_id: CLINICA_A_ID },
    { id: 'a2222222-2222-2222-2222-222222222222', email: 'medico_a1@test.com', rol: 'MEDICO', clinic_id: CLINICA_A_ID },
    { id: 'b1111111-1111-1111-1111-111111111111', email: 'admin_b@test.com', rol: 'ADMIN_CLINICA', clinic_id: CLINICA_B_ID },
    { id: 'b2222222-2222-2222-2222-222222222222', email: 'medico_b1@test.com', rol: 'MEDICO', clinic_id: CLINICA_B_ID }
]

async function setup() {
    console.log('--- Configurando Usuarios de Test ---')

    // Primero asegurarnos que las clínicas existen
    console.log('Verificando clínicas...')
    await supabase.from('clinicas').upsert([
        { id: CLINICA_A_ID, nombre: 'Clínica Integral A' },
        { id: CLINICA_B_ID, nombre: 'Clínica Salud B' }
    ])

    for (const user of testUsers) {
        console.log(`Configurando ${user.email}...`)

        // El trigger intentará insertar en public.usuarios. 
        // Para que no falle, enviamos la meta_data necesaria.
        const { data, error } = await supabase.auth.admin.createUser({
            id: user.id,
            email: user.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: {
                rol: user.rol,
                clinic_id: user.clinic_id,
                nombre_completo: `Test ${user.rol}`
            }
        })

        if (error) {
            console.error(`Error en ${user.email}:`, error.message)
        } else {
            console.log(`✅ Usuario ${user.email} (ID: ${data.user.id}) creado/verificado correctamente.`)
        }
    }

    console.log('--- Proceso Finalizado ---')
}

setup()
