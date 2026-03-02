import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Petición sin header de Autorización')
            throw new Error('No autorizado: Falta token')
        }

        // Cliente para validar el token del usuario logueado
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // 1. Obtener el usuario
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            console.error('Error al validar usuario:', userError?.message)
            throw new Error('No autorizado: Token inválido')
        }

        // 2. Verificar rol en la base de datos
        const { data: profile, error: profileError } = await supabaseClient
            .from('usuarios')
            .select('rol')
            .eq('auth_user_id', user.id)
            .single()

        if (profileError || profile?.rol !== 'SUPER_ADMIN') {
            console.error('Acceso denegado. Rol:', profile?.rol, 'Error DB:', profileError?.message)
            return new Response(JSON.stringify({ error: 'Prohibido: Solo Super Admin' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        const body = await req.json()
        const { action, email, nombre_completo, rol, clinic_id } = body
        console.log(`Ejecutando acción: ${action} para ${email}`)

        // Cliente Admin para acciones privilegiadas
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (action === 'invite-user') {
            const origin = req.headers.get('origin') || 'http://localhost:3000'
            const redirectUrl = `${origin}/reset-password`
            console.log(`Invitando usuario: ${email}, Rol: ${rol}, Clínica: ${clinic_id}, Redirect: ${redirectUrl}`)

            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: redirectUrl,
                data: {
                    nombre_completo: nombre_completo || 'Usuario Nuevo',
                    rol: rol || 'PACIENTE',
                    clinic_id: clinic_id || null
                }
            })

            if (inviteError) {
                console.error('ERROR EN INVITE_USER:', JSON.stringify(inviteError))
                let errorMessage = inviteError.message
                if (errorMessage.includes('already been registered')) {
                    errorMessage = 'El usuario ya está registrado y confirmado. Usa el botón de "Resetear Contraseña" (icono de llave) para que pueda establecer una nueva.'
                }
                return new Response(JSON.stringify({ success: false, error: errorMessage, details: inviteError }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (action === 'reset-password-admin') {
            const origin = req.headers.get('origin') || 'http://localhost:3000'
            const redirectUrl = `${origin}/reset-password`
            console.log(`Enviando mail de recuperación para: ${email}, Redirect: ${redirectUrl}`)

            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            })

            if (resetError) {
                console.error('ERROR EN RESET_PASSWORD:', JSON.stringify(resetError))
                return new Response(JSON.stringify({ success: false, error: resetError.message, details: resetError }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200, // Devolver 200 para que el cliente pueda leer el error
                })
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error(`Acción no válida: ${action}`)

    } catch (error: any) {
        console.error('ERROR CRÍTICO EN FUNCIÓN:', error.message)
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
