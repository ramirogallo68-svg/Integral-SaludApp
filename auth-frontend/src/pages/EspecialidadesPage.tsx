import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Especialidad } from '../lib/supabase'

export function EspecialidadesPage() {
    const { usuario } = useAuth()
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEspecialidad, setEditingEspecialidad] = useState<Especialidad | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        activa: true
    })

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchEspecialidades()
        }
    }, [usuario])

    const fetchEspecialidades = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('especialidades')
            .select('*')
            .eq('clinic_id', usuario?.clinic_id)
            .order('nombre')

        if (error) console.error('Error fetching especialidades:', error)
        else setEspecialidades(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.clinic_id) return

        const payload = {
            ...formData,
            clinic_id: usuario.clinic_id
        }

        if (editingEspecialidad) {
            const { error } = await supabase
                .from('especialidades')
                .update(payload)
                .eq('id', editingEspecialidad.id)

            if (error) alert('Error actualizando especialidad')
            else {
                fetchEspecialidades()
                closeModal()
            }
        } else {
            const { error } = await supabase
                .from('especialidades')
                .insert([payload])

            if (error) alert('Error creando especialidad')
            else {
                fetchEspecialidades()
                closeModal()
            }
        }
    }

    const toggleEstado = async (especialidad: Especialidad) => {
        const { error } = await supabase
            .from('especialidades')
            .update({ activa: !especialidad.activa })
            .eq('id', especialidad.id)

        if (error) alert('Error cambiando estado')
        else fetchEspecialidades()
    }

    const openModal = (especialidad: Especialidad | null = null) => {
        if (especialidad) {
            setEditingEspecialidad(especialidad)
            setFormData({
                nombre: especialidad.nombre,
                descripcion: especialidad.descripcion || '',
                activa: especialidad.activa
            })
        } else {
            setEditingEspecialidad(null)
            setFormData({
                nombre: '',
                descripcion: '',
                activa: true
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingEspecialidad(null)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestiona las especialidades médicas de tu clínica
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        Nueva Especialidad
                    </button>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td>
                                </tr>
                            ) : especialidades.map((esp) => (
                                <tr key={esp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{esp.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{esp.descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${esp.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {esp.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => openModal(esp)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                        <button onClick={() => toggleEstado(esp)} className={`${esp.activa ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}>
                                            {esp.activa ? 'Desactivar' : 'Activar'}
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
                                        {editingEspecialidad ? 'Editar Especialidad' : 'Nueva Especialidad'}
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                        <textarea
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        />
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
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none"
                                        >
                                            {editingEspecialidad ? 'Guardar Cambios' : 'Crear'}
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
