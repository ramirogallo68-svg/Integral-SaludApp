-- =====================================================
-- SEED PRINCIPAL - DATASET MULTI-TENANT
-- =====================================================
-- Importa los datos de prueba multi-tenant

-- Clínicas
INSERT INTO public.clinicas (id, nombre, direccion, telefono, email)
VALUES 
    ('a0000000-0000-0000-0000-00000000000a', 'Clínica Integral A', 'Av. A 123', '111-AAA', 'contacto@clinica-a.com'),
    ('b0000000-0000-0000-0000-00000000000b', 'Clínica Salud B', 'Calle B 456', '222-BBB', 'contacto@clinica-b.com')
ON CONFLICT (id) DO NOTHING;

-- Usuarios Auth
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change_confirm_status)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'admin_a@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '', '', '', 0),
    ('a2222222-2222-2222-2222-222222222222', 'medico_a1@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '', '', '', 0),
    ('b1111111-1111-1111-1111-111111111111', 'admin_b@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '', '', '', 0),
    ('b2222222-2222-2222-2222-222222222222', 'medico_b1@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '', '', '', 0)
ON CONFLICT (id) DO NOTHING;

-- Perfiles de Usuarios
INSERT INTO public.usuarios (id, auth_user_id, clinic_id, email, nombre_completo, rol)
VALUES 
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'admin_a@test.com', 'Admin Clínica A', 'ADMIN_CLINICA'),
    (gen_random_uuid(), 'a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-00000000000a', 'medico_a1@test.com', 'Dr. Médico A1', 'MEDICO'),
    (gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'admin_b@test.com', 'Admin Clínica B', 'ADMIN_CLINICA'),
    (gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-00000000000b', 'medico_b1@test.com', 'Dra. Médica B1', 'MEDICO')
ON CONFLICT (auth_user_id) DO NOTHING;

-- Especialidades
INSERT INTO public.especialidades (id, clinic_id, nombre, descripcion)
VALUES 
    ('a5555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-00000000000a', 'Medicina General', 'Atención primaria A'),
    ('b5555555-5555-5555-5555-555555555555', 'b0000000-0000-0000-0000-00000000000b', 'Pediatría', 'Atención infantil B')
ON CONFLICT DO NOTHING;

-- Medicos
INSERT INTO public.medicos (id, clinic_id, usuario_id, especialidad_id, matricula, horario_atencion)
VALUES 
    ('a6666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-00000000000a', (SELECT id FROM public.usuarios WHERE email = 'medico_a1@test.com'), 'a5555555-5555-5555-5555-555555555555', 'MAT-A1', '{"lunes": "08:00-12:00"}'),
    ('b6666666-6666-6666-6666-666666666666', 'b0000000-0000-0000-0000-00000000000b', (SELECT id FROM public.usuarios WHERE email = 'medico_b1@test.com'), 'b5555555-5555-5555-5555-555555555555', 'MAT-B1', '{"martes": "14:00-18:00"}')
ON CONFLICT DO NOTHING;

-- Pacientes
INSERT INTO public.pacientes (id, clinic_id, nombre_completo, dni, email)
VALUES 
    ('a7777777-7777-7777-7777-777777777777', 'a0000000-0000-0000-0000-00000000000a', 'Paciente Clínica A', '11111111', 'paciente_a@test.com'),
    ('b7777777-7777-7777-7777-777777777777', 'b0000000-0000-0000-0000-00000000000b', 'Paciente Clínica B', '22222222', 'paciente_b@test.com')
ON CONFLICT DO NOTHING;

-- Turnos
INSERT INTO public.turnos (clinic_id, medico_id, paciente_id, fecha_hora, motivo_consulta)
VALUES 
    ('a0000000-0000-0000-0000-00000000000a', 'a6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', now() + interval '1 day', 'Consulta general 1'),
    ('a0000000-0000-0000-0000-00000000000a', 'a6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', now() + interval '2 days', 'Consulta general 2'),
    ('a0000000-0000-0000-0000-00000000000a', 'a6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', now() + interval '3 days', 'Consulta general 3'),
    ('b0000000-0000-0000-0000-00000000000b', 'b6666666-6666-6666-6666-666666666666', 'b7777777-7777-7777-7777-777777777777', now() + interval '1 day', 'Pediatría 1'),
    ('b0000000-0000-0000-0000-00000000000b', 'b6666666-6666-6666-6666-666666666666', 'b7777777-7777-7777-7777-777777777777', now() + interval '2 days', 'Pediatría 2'),
    ('b0000000-0000-0000-0000-00000000000b', 'b6666666-6666-6666-6666-666666666666', 'b7777777-7777-7777-7777-777777777777', now() + interval '3 days', 'Pediatría 3')
ON CONFLICT DO NOTHING;
