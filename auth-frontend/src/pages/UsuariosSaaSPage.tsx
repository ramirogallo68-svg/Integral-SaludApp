import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { supabase, Usuario, Clinica } from '../lib/supabase'

export function UsuariosSaaSPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [clinicas, setClinicas] = useState<Clinica[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        nombre_completo: '',
        rol: 'ADMIN_CLINICA',
        clinic_id: '',
        activo: true
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [usersRes, clinicsRes] = await Promise.all([
            supabase.from('usuarios').select('*, clinica:clinicas(nombre)').order('created_at', { ascending: false }),
            supabase.from('clinicas').select('*').eq('activa', true).order('nombre')
        ])

        if (usersRes.error) console.error('Error fetching users:', usersRes.error)
        else setUsuarios(usersRes.data || [])

        if (clinicsRes.error) console.error('Error fetching clinics:', clinicsRes.error)
        else setClinicas(clinicsRes.data || [])

        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Llamada a la Edge Function para creación segura (Auth + DB)
            const { data, error } = await supabase.functions.invoke('admin-auth', {
                body: {
                    action: 'invite-user',
                    email: formData.email,
                    nombre_completo: formData.nombre_completo,
                    rol: formData.rol,
                    clinic_id: formData.rol === 'SUPER_ADMIN' ? null : formData.clinic_id,
                    origin: window.location.origin
                }
            })

            if (error) throw error
            if (data.error) throw new Error(data.error)

            alert(`¡Usuario invitado exitosamente! Se ha enviado un correo a ${formData.email}`)
            setIsModalOpen(false)
            fetchData()
        } catch (err: any) {
            console.error('Error al crear usuario:', err)
            alert(`Error al crear usuario: ${err.message || 'Error inesperado'}`)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (user: Usuario) => {
        const { error } = await supabase
            .from('usuarios')
            .update({ activo: !user.activo })
            .eq('id', user.id)

        if (error) alert('Error al cambiar estado')
        else fetchData()
    }

    const handleResendInvite = async (email: string) => {
        try {
            // Buscamos los datos del usuario localmente para reenviarlos
            const user = usuarios.find(u => u.email === email)

            const { data, error } = await supabase.functions.invoke('admin-auth', {
                body: {
                    action: 'invite-user',
                    email,
                    nombre_completo: user?.nombre_completo,
                    rol: user?.rol,
                    clinic_id: user?.clinic_id,
                    origin: window.location.origin
                }
            })

            if (error) throw error
            if (data.error) throw new Error(data.error)

            alert('Invitación reenviada con éxito')
        } catch (err: any) {
            console.error('Error al reenviar invitación:', err.message)
            alert(`Error al reenviar invitación: ${err.message}`)
        }
    }

    const handleResetPassword = async (email: string) => {
        try {
            console.log('Iniciando reset de contraseña para:', email);
            const { data, error } = await supabase.functions.invoke('admin-auth', {
                body: {
                    action: 'reset-password-admin',
                    email,
                    origin: window.location.origin
                }
            })

            if (error) {
                console.error('Error de invocación (HTTP/Network):', error);
                throw new Error(`Error de red o servidor Supabase: ${error.message || 'Sin mensaje'}. Status: ${(error as any).status || 'N/A'}`);
            }

            if (data && data.success === false) {
                console.error('La función devolvió un error lógico:', data.error);
                throw new Error(data.error || 'Error desconocido en el servidor');
            }

            alert(`Correo de recuperación enviado exitosamente.\n\nEl enlace debería redirigir a:\n${window.location.origin}`);
        } catch (err: any) {
            console.error('Error al resetear contraseña:', err);
            alert(`No se pudo resetear la contraseña.\n\nError: ${err.message || 'Error inesperado'}`);
        }
    }

    return (
        <DashboardLayout>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios SaaS</h1>
                        <p className="mt-1 text-sm text-gray-500">Administra todos los usuarios y sus roles globalmente.</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData({ email: '', nombre_completo: '', rol: 'ADMIN_CLINICA', clinic_id: clinicas[0]?.id || '', activo: true })
                            setIsModalOpen(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Nuevo Usuario
                    </button>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    {loading && usuarios.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Cargando usuarios...</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                {usuarios.map((user) => (
                                    <li key={user.id}>
                                        <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center">
                                                    <p className="text-sm font-bold text-indigo-600 truncate">{user.nombre_completo}</p>
                                                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.rol === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                        user.rol === 'ADMIN_CLINICA' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user.rol.replace('_', ' ')}
                                                    </span>
                                                    {!user.activo && (
                                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {user.email}
                                                    </div>
                                                    {user.clinic_id && (
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            {(user as any).clinica?.nombre || 'Cargando clínica...'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Botón Reenviar Invitación - Visible si no está confirmado (Simulado con una propiedad inexistente o lógica de negocio) */}
                                                {/* En una app real, 'email_confirmado' vendría de la DB o Auth metadata */}
                                                {!(user as any).email_confirmado && (
                                                    <button
                                                        onClick={() => handleResendInvite(user.email)}
                                                        className="p-2 text-amber-500 hover:text-amber-700 transition-colors"
                                                        title="Reenviar invitación"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l5 5m0 0l5-5m-5 5v12" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Botón Resetear Contraseña - Visible para usuarios activos */}
                                                {user.activo && (
                                                    <button
                                                        onClick={() => handleResetPassword(user.email)}
                                                        className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                                        title="Resetear contraseña"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => toggleStatus(user)}
                                                    className={`p-2 transition-colors ${user.activo ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                                                    title={user.activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    {user.activo ? (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Nuevo Usuario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Registrar Nuevo Usuario</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Nota: El usuario debe registrarse en la plataforma con este mismo email para completar el acceso.
                                </p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre_completo}
                                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Rol</label>
                                        <select
                                            value={formData.rol}
                                            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="ADMIN_CLINICA">Administrador de Clínica</option>
                                            <option value="SUPER_ADMIN">Super Administrador</option>
                                        </select>
                                    </div>
                                    {formData.rol !== 'SUPER_ADMIN' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Clínica Asignada</label>
                                            <select
                                                required
                                                value={formData.clinic_id}
                                                onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option value="">Selecciona una clínica</option>
                                                {clinicas.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || (formData.rol !== 'SUPER_ADMIN' && !formData.clinic_id)}
                                    className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                >
                                    {loading ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
