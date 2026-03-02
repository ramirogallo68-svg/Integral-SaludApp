import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Medico, Especialidad } from '../lib/supabase'

export function MedicosPage() {
    const { usuario } = useAuth()
    const [medicos, setMedicos] = useState<Medico[]>([])
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMedico, setEditingMedico] = useState<Medico | null>(null)
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        matricula: '',
        especialidad_id: '',
        activo: true
    })

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchData()
        }
    }, [usuario])

    const fetchData = async () => {
        setLoading(true)
        const [medicosRes, especialidadesRes] = await Promise.all([
            supabase.from('medicos')
                .select('*, usuario:usuarios(*), especialidad:especialidades(*)')
                .eq('clinic_id', usuario?.clinic_id),
            supabase.from('especialidades')
                .select('*')
                .eq('clinic_id', usuario?.clinic_id)
                .eq('activa', true)
        ])

        if (medicosRes.error) console.error('Error fetching medicos:', medicosRes.error)
        else setMedicos(medicosRes.data || [])

        if (especialidadesRes.error) console.error('Error fetching especialidades:', especialidadesRes.error)
        else setEspecialidades(especialidadesRes.data || [])

        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.clinic_id) return
        setLoading(true)

        try {
            if (editingMedico) {
                // Actualizar usuario
                const { error: userError } = await supabase
                    .from('usuarios')
                    .update({
                        nombre_completo: formData.nombre_completo,
                        email: formData.email,
                        activo: formData.activo
                    })
                    .eq('id', editingMedico.usuario_id)

                if (userError) throw userError

                // Actualizar médico
                const { error: medicoError } = await supabase
                    .from('medicos')
                    .update({
                        especialidad_id: formData.especialidad_id,
                        matricula: formData.matricula,
                        activo: formData.activo
                    })
                    .eq('id', editingMedico.id)

                if (medicoError) throw medicoError

            } else {
                // Crear nuevo médico (Usuario + Perfil Médico)
                // Nota: El flujo de invitación requiere que el usuario exista en Auth.
                // En un sistema SaaS, esto se maneja con una Edge Function.
                // Por ahora, creamos el registro y notificamos para invitar vía Panel Supabase.

                // 1. Crear el usuario
                const { data: newUser, error: userError } = await supabase
                    .from('usuarios')
                    .insert([{
                        email: formData.email,
                        nombre_completo: formData.nombre_completo,
                        rol: 'MEDICO',
                        clinic_id: usuario.clinic_id,
                        activo: true
                    }])
                    .select()
                    .single()

                if (userError) throw userError

                // 2. Crear el perfil de médico
                const { error: medicoError } = await supabase
                    .from('medicos')
                    .insert([{
                        clinic_id: usuario.clinic_id,
                        usuario_id: newUser.id,
                        especialidad_id: formData.especialidad_id,
                        matricula: formData.matricula,
                        activo: true
                    }])

                if (medicoError) throw medicoError

                alert(`¡Profesional registrado! Recuerda enviar la invitación desde el panel de Supabase Auth para: ${formData.email}`)
            }

            fetchData()
            closeModal()
        } catch (error) {
            console.error('Error saving medico:', error)
            alert('Error al guardar profesional. Verifica si el email ya existe.')
        } finally {
            setLoading(false)
        }
    }

    const toggleEstado = async (medico: Medico) => {
        const nuevoEstado = !medico.activo
        const { error } = await supabase
            .from('medicos')
            .update({ activo: nuevoEstado })
            .eq('id', medico.id)

        if (error) alert('Error cambiando estado')
        else {
            // También desactivar el usuario
            await supabase
                .from('usuarios')
                .update({ activo: nuevoEstado })
                .eq('id', medico.usuario_id)

            fetchData()
        }
    }

    const openModal = (medico: Medico | null = null) => {
        if (medico) {
            setEditingMedico(medico)
            setFormData({
                nombre_completo: medico.usuario?.nombre_completo || '',
                email: medico.usuario?.email || '',
                matricula: medico.matricula,
                especialidad_id: medico.especialidad_id,
                activo: medico.activo
            })
        } else {
            setEditingMedico(null)
            setFormData({
                nombre_completo: '',
                email: '',
                matricula: '',
                especialidad_id: especialidades[0]?.id || '',
                activo: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingMedico(null)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Médicos/Profesionales</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Administra el staff médico/profesional de tu clínica
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        Nuevo Profesional
                    </button>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico/Profesional</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matrícula</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && medicos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td>
                                </tr>
                            ) : medicos.map((medico) => (
                                <tr key={medico.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-indigo-700">
                                                        {medico.usuario?.nombre_completo.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{medico.usuario?.nombre_completo}</div>
                                                <div className="text-sm text-gray-500">{medico.usuario?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {medico.especialidad?.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {medico.matricula}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${medico.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {medico.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => openModal(medico)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                        <button onClick={() => toggleEstado(medico)} className={`${medico.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}>
                                            {medico.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingMedico ? 'Editar Profesional' : 'Nuevo Profesional'}
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.nombre_completo}
                                                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Matrícula</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.matricula}
                                                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Especialidad</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.especialidad_id}
                                                onChange={(e) => setFormData({ ...formData, especialidad_id: e.target.value })}
                                            >
                                                <option value="">Selecciona una especialidad</option>
                                                {especialidades.map(esp => (
                                                    <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-5">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none"
                                        >
                                            {loading ? 'Guardando...' : editingMedico ? 'Guardar Cambios' : 'Crear Profesional'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
