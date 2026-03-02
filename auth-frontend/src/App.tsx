import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { SuperAdminDashboard } from './pages/SuperAdminDashboard'
import { ClinicasPage } from './pages/ClinicasPage'
import { UsuariosSaaSPage } from './pages/UsuariosSaaSPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { EspecialidadesPage } from './pages/EspecialidadesPage'
import { MedicosPage } from './pages/MedicosPage'
import { PacientesPage } from './pages/PacientesPage'
import { TurnosPage } from './pages/TurnosPage'
import { HistoriaClinicaPage } from './pages/HistoriaClinicaPage'
import { MedicoDashboard } from './pages/MedicoDashboard'
import { MisTurnosPage } from './pages/MisTurnosPage'
import { MedicoPacientesPage } from './pages/MedicoPacientesPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

// Componente para redirección automática basada en rol
function RoleBasedRedirect() {
    const { usuario, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!usuario) {
        return <Navigate to="/login" replace />
    }

    // Redirección basada en rol
    switch (usuario.rol) {
        case 'SUPER_ADMIN':
            return <Navigate to="/super-admin/dashboard" replace />
        case 'ADMIN_CLINICA':
            return <Navigate to="/admin/dashboard" replace />
        case 'MEDICO':
            return <Navigate to="/medico/dashboard" replace />
        case 'PACIENTE':
            return <Navigate to="/paciente/dashboard" replace />
        default:
            return <Navigate to="/login" replace />
    }
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Ruta raíz - redirección automática */}
                    <Route path="/" element={<RoleBasedRedirect />} />

                    {/* Rutas protegidas - SUPER_ADMIN */}
                    <Route
                        path="/super-admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <SuperAdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/super-admin/clinicas"
                        element={
                            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <ClinicasPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/super-admin/usuarios"
                        element={
                            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                                <UsuariosSaaSPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Rutas protegidas - ADMIN_CLINICA */}
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/especialidades"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
                                <EspecialidadesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/medicos"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
                                <MedicosPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/pacientes"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
                                <PacientesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/turnos"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA']}>
                                <TurnosPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/historias-clinicas"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_CLINICA', 'MEDICO']}>
                                <HistoriaClinicaPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Rutas protegidas - MEDICO */}
                    <Route
                        path="/medico/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={['MEDICO']}>
                                <MedicoDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/medico/turnos"
                        element={
                            <ProtectedRoute allowedRoles={['MEDICO']}>
                                <MisTurnosPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/medico/pacientes"
                        element={
                            <ProtectedRoute allowedRoles={['MEDICO']}>
                                <MedicoPacientesPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Ruta 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
