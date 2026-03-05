import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    // 0. Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log(`Petición recibida: ${req.method} ${req.url}`)

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Petición sin header de Autorización')
            return new Response(JSON.stringify({ success: false, error: 'No autorizado: Falta token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Debug': 'missing-auth' },
                status: 200
            })
        }

        // Cliente para validar el token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            console.error('Error al validar usuario:', userError?.message)
            return new Response(JSON.stringify({ success: false, error: 'No autorizado: Token inválido' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Debug': 'invalid-token' },
                status: 200
            })
        }

        // Cliente Admin para acciones privilegiadas
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Verificar rol
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('usuarios')
            .select('rol')
            .eq('auth_user_id', user.id)
            .single()

        if (profileError || profile?.rol !== 'SUPER_ADMIN') {
            const currentRol = profile?.rol || 'No encontrado'
            console.error('Acceso denegado. Rol:', currentRol)
            return new Response(JSON.stringify({
                success: false,
                error: `Acceso denegado: Necesitas ser SUPER_ADMIN. Tu rol actual es: ${currentRol}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Debug': 'forbidden' },
                status: 200,
            })
        }

        // 2. Extraer body con robustez
        let body: any = {}
        try {
            const bodyText = await req.text()
            if (bodyText) {
                body = JSON.parse(bodyText)
            }
        } catch (e) {
            console.warn('No se pudo parsear el JSON del body:', e.message)
        }

        const { action, email, nombre_completo, rol, clinic_id, origin: bodyOrigin } = body
        console.log(`Acción detectada: ${action} para ${email}`)

        // Detección de origen ultra robusta
        const headerOrigin = req.headers.get('origin')
        const headerReferer = req.headers.get('referer') ? new URL(req.headers.get('referer')!).origin : null
        const headerForwardedHost = req.headers.get('x-forwarded-host') ? `https://${req.headers.get('x-forwarded-host')}` : null

        const currentOrigin = bodyOrigin || headerOrigin || headerReferer || headerForwardedHost || 'http://localhost:3000'

        console.log('Orígenes detectados:', {
            body: bodyOrigin,
            header: headerOrigin,
            referer: headerReferer,
            forwarded: headerForwardedHost,
            final: currentOrigin
        })

        const redirectUrl = `${currentOrigin}/reset-password`

        if (action === 'invite-user') {
            console.log(`Procesando invitación: ${email}, Redirect: ${redirectUrl}`)
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: redirectUrl,
                data: {
                    nombre_completo: nombre_completo || 'Usuario Nuevo',
                    rol: rol || 'PACIENTE',
                    clinic_id: clinic_id || null
                }
            })

            if (inviteError) {
                console.error('Error en inviteUserByEmail:', inviteError.message)
                let msg = inviteError.message
                if (msg.includes('already been registered')) {
                    msg = 'El usuario ya existe y está confirmado. Intenta "Resetear Contraseña" si necesita ayuda para ingresar.'
                }
                return new Response(JSON.stringify({ success: false, error: msg }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        if (action === 'reset-password-admin') {
            console.log(`Procesando reset password: ${email}, Redirect: ${redirectUrl}`)
            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            })

            if (resetError) {
                console.error('Error en resetPasswordForEmail:', resetError.message)
                return new Response(JSON.stringify({ success: false, error: resetError.message }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response(JSON.stringify({ success: false, error: `Acción no contemplada: ${action}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (criticalError: any) {
        console.error('ERROR CRÍTICO INESPERADO:', criticalError)
        return new Response(JSON.stringify({
            success: false,
            error: `Error interno de la función: ${criticalError.message}`,
            stack: criticalError.stack
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Error': 'true' },
            status: 200,
        })
    }
})

