-- =====================================================
-- SCRIPT SQL COMPLETO - SISTEMA MULTI-TENANT
-- Sistema de Gestión de Turnos Médicos - SaaS
-- =====================================================
-- Arquitectura: Multi-tenant con aislamiento por clinic_id
-- Roles: SUPER_ADMIN, ADMIN_CLINICA, MEDICO, PACIENTE
-- =====================================================

-- =====================================================
-- 1. EXTENSIONES Y CONFIGURACIÓN INICIAL
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABLA: clinicas
-- =====================================================
-- Tabla maestra de clínicas (sin clinic_id porque ES la clínica)

CREATE TABLE IF NOT EXISTS public.clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para clinicas
CREATE INDEX idx_clinicas_activa ON public.clinicas(activa);

-- =====================================================
-- 3. TABLA: usuarios
-- =====================================================
-- Usuarios del sistema vinculados a auth.users
-- clinic_id es NULLABLE para SUPER_ADMIN

CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinicas(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMIN_CLINICA', 'MEDICO', 'PACIENTE')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: SUPER_ADMIN no tiene clinic_id, otros roles SÍ
    CONSTRAINT check_clinic_id_by_role CHECK (
        (rol = 'SUPER_ADMIN' AND clinic_id IS NULL) OR
        (rol != 'SUPER_ADMIN' AND clinic_id IS NOT NULL)
    )
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_auth_user_id ON public.usuarios(auth_user_id);
CREATE INDEX idx_usuarios_clinic_id ON public.usuarios(clinic_id);
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX idx_usuarios_email ON public.usuarios(email);

-- =====================================================
-- 4. TABLA: especialidades
-- =====================================================
-- Catálogo de especialidades médicas por clínica

CREATE TABLE IF NOT EXISTS public.especialidades (
    id UUID DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PK compuesta para multi-tenant
    PRIMARY KEY (id, clinic_id),
    
    -- Unique por clínica
    UNIQUE (clinic_id, nombre)
);

-- Índices para especialidades
CREATE INDEX idx_especialidades_clinic_id ON public.especialidades(clinic_id);
CREATE INDEX idx_especialidades_activa ON public.especialidades(activa);

-- =====================================================
-- 5. TABLA: medicos
-- =====================================================
-- Información de médicos por clínica

CREATE TABLE IF NOT EXISTS public.medicos (
    id UUID DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    especialidad_id UUID NOT NULL,
    matricula TEXT NOT NULL,
    horario_atencion JSONB DEFAULT '{}',
    duracion_turno_minutos INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PK compuesta para multi-tenant
    PRIMARY KEY (id, clinic_id),
    
    -- Unique matricula por clínica
    UNIQUE (clinic_id, matricula),
    
    -- FK compuesta a especialidades
    FOREIGN KEY (especialidad_id, clinic_id) 
        REFERENCES public.especialidades(id, clinic_id) ON DELETE RESTRICT
);

-- Índices para medicos
CREATE INDEX idx_medicos_clinic_id ON public.medicos(clinic_id);
CREATE INDEX idx_medicos_usuario_id ON public.medicos(usuario_id);
CREATE INDEX idx_medicos_especialidad_id ON public.medicos(especialidad_id);
CREATE INDEX idx_medicos_activo ON public.medicos(activo);

-- =====================================================
-- 6. TABLA: pacientes
-- =====================================================
-- Información de pacientes por clínica

CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nombre_completo TEXT NOT NULL,
    dni TEXT NOT NULL,
    fecha_nacimiento DATE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    obra_social TEXT,
    numero_afiliado TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PK compuesta para multi-tenant
    PRIMARY KEY (id, clinic_id),
    
    -- Unique DNI por clínica
    UNIQUE (clinic_id, dni)
);

-- Índices para pacientes
CREATE INDEX idx_pacientes_clinic_id ON public.pacientes(clinic_id);
CREATE INDEX idx_pacientes_usuario_id ON public.pacientes(usuario_id);
CREATE INDEX idx_pacientes_dni ON public.pacientes(clinic_id, dni);
CREATE INDEX idx_pacientes_nombre ON public.pacientes(nombre_completo);

-- =====================================================
-- 7. TABLA: turnos
-- =====================================================
-- Turnos médicos por clínica

CREATE TABLE IF NOT EXISTS public.turnos (
    id UUID DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL,
    paciente_id UUID NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 30,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO', 'AUSENTE')),
    motivo_consulta TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PK compuesta para multi-tenant
    PRIMARY KEY (id, clinic_id),
    
    -- FK compuestas
    FOREIGN KEY (medico_id, clinic_id) 
        REFERENCES public.medicos(id, clinic_id) ON DELETE RESTRICT,
    FOREIGN KEY (paciente_id, clinic_id) 
        REFERENCES public.pacientes(id, clinic_id) ON DELETE RESTRICT
);

-- Índices para turnos
CREATE INDEX idx_turnos_clinic_id ON public.turnos(clinic_id);
CREATE INDEX idx_turnos_medico_fecha ON public.turnos(clinic_id, medico_id, fecha_hora);
CREATE INDEX idx_turnos_paciente_fecha ON public.turnos(clinic_id, paciente_id, fecha_hora);
CREATE INDEX idx_turnos_fecha_hora ON public.turnos(fecha_hora);
CREATE INDEX idx_turnos_estado ON public.turnos(estado);

-- =====================================================
-- 8. TABLA: historias_clinicas
-- =====================================================
-- Historias clínicas por clínica

CREATE TABLE IF NOT EXISTS public.historias_clinicas (
    id UUID DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL,
    turno_id UUID,
    medico_id UUID NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    archivos_adjuntos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PK compuesta para multi-tenant
    PRIMARY KEY (id, clinic_id),
    
    -- FK compuestas
    FOREIGN KEY (paciente_id, clinic_id) 
        REFERENCES public.pacientes(id, clinic_id) ON DELETE RESTRICT,
    FOREIGN KEY (medico_id, clinic_id) 
        REFERENCES public.medicos(id, clinic_id) ON DELETE RESTRICT,
    FOREIGN KEY (turno_id, clinic_id) 
        REFERENCES public.turnos(id, clinic_id) ON DELETE SET NULL
);

-- Índices para historias_clinicas
CREATE INDEX idx_historias_clinic_id ON public.historias_clinicas(clinic_id);
CREATE INDEX idx_historias_paciente_fecha ON public.historias_clinicas(clinic_id, paciente_id, fecha DESC);
CREATE INDEX idx_historias_medico_fecha ON public.historias_clinicas(clinic_id, medico_id, fecha DESC);
CREATE INDEX idx_historias_turno_id ON public.historias_clinicas(turno_id, clinic_id);

-- =====================================================
-- 9. FUNCIONES HELPER PARA RLS
-- =====================================================

-- Función: Obtener clinic_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
    SELECT clinic_id FROM public.usuarios 
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT rol FROM public.usuarios 
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Verificar si es SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.usuarios 
        WHERE auth_user_id = auth.uid() 
        AND rol = 'SUPER_ADMIN'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Verificar si es ADMIN de una clínica específica
CREATE OR REPLACE FUNCTION public.is_clinic_admin(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.usuarios 
        WHERE auth_user_id = auth.uid() 
        AND clinic_id = p_clinic_id 
        AND rol = 'ADMIN_CLINICA'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: Obtener ID del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
    SELECT id FROM public.usuarios 
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- 10. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_clinicas_updated_at BEFORE UPDATE ON public.clinicas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_especialidades_updated_at BEFORE UPDATE ON public.especialidades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON public.medicos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON public.turnos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_historias_clinicas_updated_at BEFORE UPDATE ON public.historias_clinicas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias_clinicas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. POLÍTICAS RLS - TABLA: clinicas
-- =====================================================

-- SUPER_ADMIN: acceso total
CREATE POLICY "super_admin_all_clinicas" ON public.clinicas
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ADMIN_CLINICA, MEDICO, PACIENTE: solo su clínica
CREATE POLICY "users_view_own_clinic" ON public.clinicas
    FOR SELECT TO authenticated
    USING (
        id = public.get_user_clinic_id()
    );

-- =====================================================
-- 13. POLÍTICAS RLS - TABLA: usuarios
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- Usuarios: ver su propio registro
CREATE POLICY "users_view_own_record" ON public.usuarios
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid());

-- Usuarios: actualizar su propio registro (datos básicos)
CREATE POLICY "users_update_own_record" ON public.usuarios
    FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- =====================================================
-- 14. POLÍTICAS RLS - TABLA: especialidades
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- MEDICO, PACIENTE: ver especialidades de su clínica
CREATE POLICY "users_view_clinic_especialidades" ON public.especialidades
    FOR SELECT TO authenticated
    USING (clinic_id = public.get_user_clinic_id());

-- =====================================================
-- 15. POLÍTICAS RLS - TABLA: medicos
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: ver y actualizar su propio registro
CREATE POLICY "medico_view_own_record" ON public.medicos
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    );

CREATE POLICY "medico_update_own_record" ON public.medicos
    FOR UPDATE TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    );

-- PACIENTE: ver médicos de su clínica
CREATE POLICY "paciente_view_medicos" ON public.medicos
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'PACIENTE'
    );

-- =====================================================
-- 16. POLÍTICAS RLS - TABLA: pacientes
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona pacientes de su clínica
CREATE POLICY "medico_manage_pacientes" ON public.pacientes
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
    );

-- PACIENTE: ver y actualizar su propio registro
CREATE POLICY "paciente_view_own_record" ON public.pacientes
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    );

CREATE POLICY "paciente_update_own_record" ON public.pacientes
    FOR UPDATE TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND usuario_id = public.get_user_id()
    );

-- =====================================================
-- 17. POLÍTICAS RLS - TABLA: turnos
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona sus propios turnos
CREATE POLICY "medico_manage_own_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_user_id()
        )
    );

-- PACIENTE: gestiona sus propios turnos
CREATE POLICY "paciente_manage_own_turnos" ON public.turnos
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_user_id()
        )
    );

-- =====================================================
-- 18. POLÍTICAS RLS - TABLA: historias_clinicas
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
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'ADMIN_CLINICA'
    );

-- MEDICO: gestiona historias de sus pacientes
CREATE POLICY "medico_manage_historias" ON public.historias_clinicas
    FOR ALL TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_user_id()
        )
    )
    WITH CHECK (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'MEDICO'
        AND medico_id IN (
            SELECT id FROM public.medicos 
            WHERE usuario_id = public.get_user_id()
        )
    );

-- PACIENTE: ver sus propias historias
CREATE POLICY "paciente_view_own_historias" ON public.historias_clinicas
    FOR SELECT TO authenticated
    USING (
        clinic_id = public.get_user_clinic_id() 
        AND public.get_user_role() = 'PACIENTE'
        AND paciente_id IN (
            SELECT id FROM public.pacientes 
            WHERE usuario_id = public.get_user_id()
        )
    );

-- =====================================================
-- 19. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

/*
-- Insertar clínica de ejemplo
INSERT INTO public.clinicas (nombre, direccion, telefono, email)
VALUES ('Clínica Ejemplo', 'Av. Principal 123', '+54 11 1234-5678', 'info@clinicaejemplo.com');

-- Insertar especialidad de ejemplo
INSERT INTO public.especialidades (clinic_id, nombre, descripcion)
VALUES (
    (SELECT id FROM public.clinicas WHERE nombre = 'Clínica Ejemplo'),
    'Medicina General',
    'Atención médica general y preventiva'
);
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar que todo se creó correctamente
SELECT 
    'Tablas creadas:' as info,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clinicas', 'usuarios', 'especialidades', 'medicos', 'pacientes', 'turnos', 'historias_clinicas');

SELECT 
    'Políticas RLS creadas:' as info,
    COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    'Funciones helper creadas:' as info,
    COUNT(*) as total
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proname LIKE 'get_user%' OR p.proname LIKE 'is_%');
