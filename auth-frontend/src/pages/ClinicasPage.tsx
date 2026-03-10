import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { supabase, Clinica } from '../lib/supabase'

export function ClinicasPage() {
    const [clinicas, setClinicas] = useState<Clinica[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingClinica, setEditingClinica] = useState<Clinica | null>(null)
    const [searchClinicName, setSearchClinicName] = useState('')
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        activa: true
    })

    useEffect(() => {
        fetchClinicas()
    }, [])

    const fetchClinicas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clinicas')
            .select('*')
            .order('nombre')

        if (error) console.error('Error fetching clinicas:', error)
        else setClinicas(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (editingClinica) {
            const { error } = await supabase
                .from('clinicas')
                .update(formData)
                .eq('id', editingClinica.id)

            if (error) alert('Error al actualizar clínica')
            else {
                setIsModalOpen(false)
                fetchClinicas()
            }
        } else {
            const { error } = await supabase
                .from('clinicas')
                .insert([formData])

            if (error) alert('Error al crear clínica')
            else {
                setIsModalOpen(false)
                fetchClinicas()
            }
        }
    }

    const handleEdit = (clinica: Clinica) => {
        setEditingClinica(clinica)
        setFormData({
            nombre: clinica.nombre,
            direccion: clinica.direccion || '',
            telefono: clinica.telefono || '',
            email: clinica.email || '',
            activa: clinica.activa
        })
        setIsModalOpen(true)
    }

    const toggleStatus = async (clinica: Clinica) => {
        const { error } = await supabase
            .from('clinicas')
            .update({ activa: !clinica.activa })
            .eq('id', clinica.id)

        if (error) alert('Error al cambiar estado')
        else fetchClinicas()
    }

    return (
        <DashboardLayout>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Clínicas</h1>
                        <p className="mt-1 text-sm text-gray-500">Administra todas las clínicas registradas en el SaaS.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:min-w-[300px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchClinicName}
                                onChange={(e) => setSearchClinicName(e.target.value)}
                                placeholder="Buscar clínica por nombre..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingClinica(null)
                                setFormData({ nombre: '', direccion: '', telefono: '', email: '', activa: true })
                                setIsModalOpen(true)
                            }}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                        >
                            Nueva Clínica
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    {loading && clinicas.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500">Cargando clínicas...</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                {clinicas
                                    .filter(clinica => 
                                        clinica.nombre.toLowerCase().includes(searchClinicName.toLowerCase())
                                    )
                                    .map((clinica) => (
                                    <li key={clinica.id}>
                                        <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center">
                                                    <p className="text-sm font-bold text-indigo-600 truncate">{clinica.nombre}</p>
                                                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${clinica.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {clinica.activa ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {clinica.email || 'No email'}
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {clinica.telefono || 'No teléfono'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(clinica)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(clinica)}
                                                    className={`p-2 transition-colors ${clinica.activa ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                                                    title={clinica.activa ? 'Desactivar' : 'Activar'}
                                                >
                                                    {clinica.activa ? (
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
                                {clinicas.length > 0 && 
                                    clinicas.filter(clinica => 
                                        clinica.nombre.toLowerCase().includes(searchClinicName.toLowerCase())
                                    ).length === 0 && (
                                    <li className="px-4 py-8 text-center text-gray-500">No se encontraron clínicas que coincidan con la búsqueda.</li>
                                )}
                                {clinicas.length === 0 && !loading && (
                                    <li className="px-4 py-8 text-center text-gray-500">No hay clínicas registradas.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Crear/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {editingClinica ? 'Editar Clínica' : 'Nueva Clínica'}
                                </h3>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                        <input
                                            type="text"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                        <input
                                            type="text"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
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
                                    disabled={loading}
                                    className="flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                >
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
