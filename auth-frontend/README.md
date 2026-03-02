# Authentication Frontend - Sistema de Gestión de Clínicas

Frontend de autenticación profesional para el sistema SaaS multi-tenant de gestión de clínicas médicas.

## 🚀 Características

- ✅ Autenticación con Supabase Auth
- ✅ Login con email y contraseña
- ✅ Recuperación de contraseña
- ✅ Manejo automático de sesión con JWT
- ✅ Redirección basada en roles:
  - `SUPER_ADMIN` → `/super-admin/dashboard`
  - `ADMIN_CLINICA` → `/admin/dashboard`
  - `MEDICO` → `/medico/dashboard`
- ✅ Rutas protegidas con control de acceso por rol
- ✅ UI moderna y profesional con Tailwind CSS
- ✅ TypeScript para type safety

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Proyecto Supabase configurado
- Credenciales de Supabase (URL y Anon Key)

## 🛠️ Instalación

1. **Navegar al directorio del proyecto:**
   ```bash
   cd auth-frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```bash
   cp .env.example .env.local
   ```

   Edita `.env.local` y agrega tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

   **Dónde encontrar las credenciales:**
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Settings → API
   - Copia `Project URL` y `anon public` key

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build para Producción

```bash
npm run build
```

### Preview del Build

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
auth-frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx    # Componente para rutas protegidas
│   ├── contexts/
│   │   └── AuthContext.tsx       # Context de autenticación
│   ├── lib/
│   │   └── supabase.ts           # Cliente de Supabase
│   ├── pages/
│   │   ├── LoginPage.tsx         # Página de login
│   │   ├── ForgotPasswordPage.tsx # Recuperación de contraseña
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── MedicoDashboard.tsx
│   ├── App.tsx                   # Componente principal con routing
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Estilos globales
├── .env.example                  # Template de variables de entorno
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔐 Flujo de Autenticación

1. **Login:**
   - Usuario ingresa email y contraseña
   - Supabase Auth valida credenciales
   - Se obtiene el JWT y datos del usuario
   - Se consulta la tabla `usuarios` para obtener el rol
   - Redirección automática según el rol

2. **Sesión:**
   - JWT se almacena automáticamente en localStorage
   - Auto-refresh del token
   - Persistencia de sesión entre recargas

3. **Recuperación de Contraseña:**
   - Usuario ingresa su email
   - Supabase envía email con link de recuperación
   - Usuario sigue el link y establece nueva contraseña

## 🎨 Personalización

### Cambiar Colores

Edita `tailwind.config.js` para personalizar la paleta de colores:

```js
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

### Agregar Nuevos Roles

1. Agrega el rol en `src/lib/supabase.ts`:
   ```typescript
   export interface Usuario {
     rol: 'SUPER_ADMIN' | 'ADMIN_CLINICA' | 'MEDICO' | 'PACIENTE' | 'TU_NUEVO_ROL'
   }
   ```

2. Crea el dashboard correspondiente en `src/pages/`

3. Agrega la ruta en `src/App.tsx`:
   ```typescript
   case 'TU_NUEVO_ROL':
     return <Navigate to="/tu-ruta/dashboard" replace />
   ```

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el archivo se llame `.env.local` (no `.env`)
- Reinicia el servidor de desarrollo

### Error: "Usuario no encontrado"
- Verifica que el usuario exista en la tabla `usuarios` de Supabase
- Asegúrate de que el `auth_user_id` coincida con el ID de Supabase Auth

### Redirección no funciona
- Verifica que el rol del usuario esté correctamente configurado en la BD
- Revisa la consola del navegador para errores

## 📝 Próximos Pasos

- [ ] Implementar contenido de los dashboards
- [ ] Agregar gestión de clínicas (SUPER_ADMIN)
- [ ] Agregar gestión de usuarios (ADMIN_CLINICA)
- [ ] Agregar gestión de turnos (MEDICO)
- [ ] Implementar notificaciones en tiempo real
- [ ] Agregar tests unitarios

## 📄 Licencia

Este proyecto es parte del Sistema de Gestión de Clínicas Médicas.
