-- =====================================================
-- SCRIPT: CREAR USUARIO SUPER_ADMIN
-- =====================================================
-- Este script crea el usuario super administrador del sistema
-- vinculado al usuario de Supabase Auth existente
-- =====================================================

-- Insertar usuario SUPER_ADMIN
INSERT INTO public.usuarios (
    auth_user_id,
    clinic_id,
    email,
    nombre_completo,
    rol,
    activo
) VALUES (
    'b0eb7f71-14a8-46d1-abed-ecb363c33e46'::uuid,  -- User ID de Supabase Auth
    NULL,                                            -- SUPER_ADMIN no tiene clinic_id
    'Ramiro_gallo88@hotmail.es',                    -- Email
    'Ramiro Gallo',                                  -- Nombre completo (puedes cambiarlo)
    'SUPER_ADMIN',                                   -- Rol
    true                                             -- Activo
)
ON CONFLICT (auth_user_id) DO UPDATE SET
    rol = 'SUPER_ADMIN',
    clinic_id = NULL,
    email = EXCLUDED.email,
    nombre_completo = EXCLUDED.nombre_completo,
    activo = true,
    updated_at = now();

-- Verificar que se creó correctamente
SELECT 
    id,
    auth_user_id,
    email,
    nombre_completo,
    rol,
    clinic_id,
    activo,
    created_at
FROM public.usuarios
WHERE auth_user_id = 'b0eb7f71-14a8-46d1-abed-ecb363c33e46'::uuid;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
Deberías ver un registro con:
- id: UUID generado automáticamente
- auth_user_id: b0eb7f71-14a8-46d1-abed-ecb363c33e46
- email: Ramiro_gallo88@hotmail.es
- nombre_completo: Ramiro Gallo
- rol: SUPER_ADMIN
- clinic_id: NULL (porque es SUPER_ADMIN)
- activo: true
- created_at: timestamp actual

Con este usuario podrás:
✅ Crear nuevas clínicas
✅ Crear usuarios de cualquier rol
✅ Asignar administradores a clínicas
✅ Acceder a todos los datos del sistema
✅ Gestionar todas las tablas sin restricciones de RLS
*/
