# Gestión de Acciones Administrativas (Supabase Edge Functions)

Este proyecto utiliza una arquitectura de **Edge Functions** para ejecutar acciones de administración de forma segura (Invitaciones y Reset de contraseñas) utilizando la clave `service_role`.

## Arquitectura
`React Frontend` → `Supabase Edge Function (JWT Auth)` → `Supabase Admin Namespace (Service Role)`

---

## 1. Desarrollo Local
Para probar las funciones localmente sin desplegarlas:

### Pre-requisitos
- Tener instalado [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### Pasos
1. **Instalar Supabase CLI**:
   ```bash
   npm install supabase --save-dev
   ```

2. **Iniciar Entorno Local**:
   ```bash
   npx supabase start
   ```

3. **Servir la Función**:
   ```bash
   npx supabase functions serve admin-auth --no-verify-jwt
   ```
   *La función estará disponible en: `http://localhost:54321/functions/v1/admin-auth`*

---

## 2. Despliegue a Producción

### Pasos
1. **Login en Supabase**:
   ```bash
   npx supabase login
   ```

2. **Vincular Proyecto**:
   Obtén tu `Project Ref` desde el Dashboard (Settings > General).
   ```bash
   npx supabase link --project-ref <tu-project-id>
   ```

3. **Configurar Secretos (Crítico)**:
   La función requiere acceso a la clave de servicio para realizar acciones de administración.
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

4. **Desplegar**:
   ```bash
   npx supabase functions deploy admin-auth
   ```

---

## 3. Configuración del Frontend

El frontend utiliza el SDK de Supabase para invocar la función. No necesitas configurar URLs manualmente si usas `supabase.functions.invoke()`.

### Invocación desde código:
```typescript
import { supabase } from '../lib/supabase'

const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { action: 'invite-user', email: 'usuario@ejemplo.com' }
})
```

### URLs de referencia:
- **Local**: `http://localhost:54321/functions/v1/admin-auth`
- **Producción**: `https://<tu-project-id>.supabase.co/functions/v1/admin-auth`

---

## 4. Troubleshooting
- **Error: "Failed to send a request"**: Asegúrate de que la función esté servida (local) o desplegada (prod).
- **Error: "No autorizado"**: El usuario logueado en el frontend debe tener el rol `SUPER_ADMIN` en la tabla `usuarios`.
- **CORS Errors**: Verifica que los `corsHeaders` en `index.ts` incluyan los métodos y headers necesarios.
