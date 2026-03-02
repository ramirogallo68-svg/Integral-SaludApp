import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Paciente } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function PacientesPage() {
    const { usuario } = useAuth()
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null)
    const [formData, setFormData] = useState({
        nombre_completo: '',
        dni: '',
        fecha_nacimiento: '',
        telefono: '',
        email: '',
        direccion: '',
        obra_social: '',
        numero_afiliado: ''
    })

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchPacientes()
        }
    }, [usuario])

    const fetchPacientes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('clinic_id', usuario?.clinic_id)
            .order('nombre_completo')

        if (error) console.error('Error fetching pacientes:', error)
        else setPacientes(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.clinic_id) return
        setLoading(true)

        const payload = {
            ...formData,
            clinic_id: usuario.clinic_id
        }

        if (editingPaciente) {
            const { error } = await supabase
                .from('pacientes')
                .update(payload)
                .eq('id', editingPaciente.id)

            if (error) alert('Error actualizando paciente')
            else {
                fetchPacientes()
                closeModal()
            }
        } else {
            const { error } = await supabase
                .from('pacientes')
                .insert([payload])

            if (error) alert('Error creando paciente')
            else {
                fetchPacientes()
                closeModal()
            }
        }
        setLoading(false)
    }

    const openModal = (paciente: Paciente | null = null) => {
        if (paciente) {
            setEditingPaciente(paciente)
            setFormData({
                nombre_completo: paciente.nombre_completo,
                dni: paciente.dni,
                fecha_nacimiento: paciente.fecha_nacimiento || '',
                telefono: paciente.telefono || '',
                email: paciente.email || '',
                direccion: paciente.direccion || '',
                obra_social: paciente.obra_social || '',
                numero_afiliado: paciente.numero_afiliado || ''
            })
        } else {
            setEditingPaciente(null)
            setFormData({
                nombre_completo: '',
                dni: '',
                fecha_nacimiento: '',
                telefono: '',
                email: '',
                direccion: '',
                obra_social: '',
                numero_afiliado: ''
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingPaciente(null)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Administra el padrón de pacientes de tu clínica
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        Nuevo Paciente
                    </button>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra Social</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && pacientes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td>
                                </tr>
                            ) : pacientes.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre_completo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.dni}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{p.telefono}</div>
                                        <div className="text-xs text-gray-400">{p.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{p.obra_social || '-'}</div>
                                        <div className="text-xs text-gray-400">{p.numero_afiliado}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Link to={`/admin/historias-clinicas?pacienteId=${p.id}`} className="text-green-600 hover:text-green-900">Historia</Link>
                                        <button onClick={() => openModal(p)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
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
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
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
                                            <label className="block text-sm font-medium text-gray-700">DNI</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.dni}
                                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.fecha_nacimiento}
                                                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Obra Social</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.obra_social}
                                                onChange={(e) => setFormData({ ...formData, obra_social: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Número de Afiliado</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.numero_afiliado}
                                                onChange={(e) => setFormData({ ...formData, numero_afiliado: e.target.value })}
                                            />
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
                                            {loading ? 'Guardando...' : editingPaciente ? 'Guardar Cambios' : 'Crear Paciente'}
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
