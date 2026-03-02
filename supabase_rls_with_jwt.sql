-- =====================================================
-- SCRIPT RLS CON auth.jwt() - SISTEMA MULTI-TENANT
-- Sistema de Gestión de Turnos Médicos - SaaS
-- =====================================================
-- Este script asume que las tablas ya están creadas
-- Solo configura RLS y políticas usando auth.jwt()
-- =====================================================

-- =====================================================
-- 1. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias_clinicas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES (SI EXISTEN)
-- =====================================================

-- Tabla: clinicas
DROP POLICY IF EXISTS "super_admin_all_clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "users_view_own_clinic" ON public.clinicas;

-- Tabla: usuarios
DROP POLICY IF EXISTS "super_admin_all_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "admin_manage_clinic_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "users_view_own_record" ON public.usuarios;
DROP POLICY IF EXISTS "users_update_own_record" ON public.usuarios;

-- Tabla: especialidades
DROP POLICY IF EXISTS "super_admin_all_especialidades" ON public.especialidades;
DROP POLICY IF EXISTS "admin_manage_especialidades" ON public.especialidades;
DROP POLICY IF EXISTS "users_view_clinic_especialidades" ON public.especialidades;

-- Tabla: medicos
DROP POLICY IF EXISTS "super_admin_all_medicos" ON public.medicos;
DROP POLICY IF EXISTS "admin_manage_medicos" ON public.medicos;
DROP POLICY IF EXISTS "medico_view_own_record" ON public.medicos;
DROP POLICY IF EXISTS "medico_update_own_record" ON public.medicos;
DROP POLICY IF EXISTS "paciente_view_medicos" ON public.medicos;

-- Tabla: pacientes
DROP POLICY IF EXISTS "super_admin_all_pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "admin_manage_pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "medico_manage_pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "paciente_view_own_record" ON public.pacientes;
DROP POLICY IF EXISTS "paciente_update_own_record" ON public.pacientes;

-- Tabla: turnos
DROP POLICY IF EXISTS "super_admin_all_turnos" ON public.turnos;
DROP POLICY IF EXISTS "admin_manage_turnos" ON public.turnos;
DROP POLICY IF EXISTS "medico_manage_own_turnos" ON public.turnos;
DROP POLICY IF EXISTS "paciente_manage_own_turnos" ON public.turnos;

-- Tabla: historias_clinicas
DROP POLICY IF EXISTS "super_admin_all_historias" ON public.historias_clinicas;
DROP POLICY IF EXISTS "admin_view_historias" ON public.historias_clinicas;
DROP POLICY IF EXISTS "medico_manage_historias" ON public.historias_clinicas;
DROP POLICY IF EXISTS "paciente_view_own_historias" ON public.historias_clinicas;

-- =====================================================
-- 3. FUNCIONES HELPER USANDO auth.jwt()
-- =====================================================

-- Función: Obtener rol del JWT
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT COALESCE(
        auth.jwt() ->> 'user_role',
        (SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Obtener clinic_id del JWT
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (auth.jwt() ->> 'clinic_id')::uuid,
        (SELECT clinic_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Obtener user_id del JWT
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (auth.jwt() ->> 'user_id')::uuid,
        (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Verificar si es SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT public.get_my_role() = 'SUPER_ADMIN';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- 4. POLÍTICAS RLS - TABLA: clinicas
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_clinicas" ON public.clinicas
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA, MEDICO, PACIENTE: solo su clínica
CREATE POLICY "users_view_own_clinic" ON public.clinicas
    FOR SELECT TO authenticated
    USING (id = public.get_my_clinic_id());

-- =====================================================
-- 5. POLÍTICAS RLS - TABLA: usuarios
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: gestiona usuarios de su clínica
CREATE POLICY "admin_manage_clinic_usuarios" ON public.usuarios
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- Usuarios: ver su propio registro
CREATE POLICY "users_view_own_record" ON public.usuarios
    FOR SELECT TO authenticated
    USING (id = public.get_my_user_id());

-- Usuarios: actualizar su propio registro
CREATE POLICY "users_update_own_record" ON public.usuarios
    FOR UPDATE TO authenticated
    USING (id = public.get_my_user_id())
    WITH CHECK (id = public.get_my_user_id());

-- =====================================================
-- 6. POLÍTICAS RLS - TABLA: especialidades
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_especialidades" ON public.especialidades
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: gestiona especialidades de su clínica
CREATE POLICY "admin_manage_especialidades" ON public.especialidades
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- MEDICO, PACIENTE: ver especialidades de su clínica
CREATE POLICY "users_view_clinic_especialidades" ON public.especialidades
    FOR SELECT TO authenticated
    USING (clinic_id = public.get_my_clinic_id());

-- =====================================================
-- 7. POLÍTICAS RLS - TABLA: medicos
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_medicos" ON public.medicos
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: gestiona médicos de su clínica
CREATE POLICY "admin_manage_medicos" ON public.medicos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: ver y actualizar su propio registro
CREATE POLICY "medico_view_own_record" ON public.medicos
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    );

CREATE POLICY "medico_update_own_record" ON public.medicos
    FOR UPDATE TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    );

-- PACIENTE: ver médicos de su clínica
CREATE POLICY "paciente_view_medicos" ON public.medicos
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'PACIENTE'
    );

-- =====================================================
-- 8. POLÍTICAS RLS - TABLA: pacientes
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_pacientes" ON public.pacientes
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: gestiona pacientes de su clínica
CREATE POLICY "admin_manage_pacientes" ON public.pacientes
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona pacientes de su clínica
CREATE POLICY "medico_manage_pacientes" ON public.pacientes
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
    );

-- PACIENTE: ver y actualizar su propio registro
CREATE POLICY "paciente_view_own_record" ON public.pacientes
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    );

CREATE POLICY "paciente_update_own_record" ON public.pacientes
    FOR UPDATE TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND usuario_id = public.get_my_user_id()
    );

-- =====================================================
-- 9. POLÍTICAS RLS - TABLA: turnos
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: gestiona turnos de su clínica
CREATE POLICY "admin_manage_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona sus propios turnos
CREATE POLICY "medico_manage_own_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_my_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_my_user_id()
        )
    );

-- PACIENTE: gestiona sus propios turnos
CREATE POLICY "paciente_manage_own_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_my_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_my_user_id()
        )
    );

-- =====================================================
-- 10. POLÍTICAS RLS - TABLA: historias_clinicas
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_historias" ON public.historias_clinicas
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA: ver historias de su clínica
CREATE POLICY "admin_view_historias" ON public.historias_clinicas
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona historias de sus pacientes
CREATE POLICY "medico_manage_historias" ON public.historias_clinicas
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_my_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_my_user_id()
        )
    );

-- PACIENTE: ver sus propias historias
CREATE POLICY "paciente_view_own_historias" ON public.historias_clinicas
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_my_clinic_id() 
        AND public.get_my_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_my_user_id()
        )
    );

-- =====================================================
-- 11. VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clinicas', 'usuarios', 'especialidades', 'medicos', 'pacientes', 'turnos', 'historias_clinicas')
ORDER BY tablename;

-- Contar políticas creadas
SELECT 
    schemaname,
    tablename,
    COUNT(*) as num_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
CONFIGURACIÓN DEL JWT:

Para que este script funcione correctamente, debes configurar 
los custom claims en el JWT de Supabase:

1. Ir a Authentication > Hooks en Supabase Dashboard
2. Crear un hook "Custom Access Token" con este código:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { user } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Obtener datos del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('id, rol, clinic_id')
    .eq('auth_user_id', user.id)
    .single()
  
  return new Response(
    JSON.stringify({
      user_id: userData?.id,
      user_role: userData?.rol,
      clinic_id: userData?.clinic_id
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

3. Las funciones helper tienen fallback a la tabla usuarios
   si los claims no están en el JWT.

ALTERNATIVA SIN JWT CUSTOM CLAIMS:

Si no quieres configurar custom claims, las funciones helper
ya tienen fallback que consultan directamente la tabla usuarios.
El script funcionará igual, pero será un poco menos eficiente.
*/
