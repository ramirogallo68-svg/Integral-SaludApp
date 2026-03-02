import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Paciente } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function MedicoPacientesPage() {
    const { usuario } = useAuth()
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchPacientes()
        }
    }, [usuario, searchTerm])

    const fetchPacientes = async () => {
        setLoading(true)
        let query = supabase
            .from('pacientes')
            .select('*')
            .eq('clinic_id', usuario?.clinic_id)
            .order('nombre_completo')

        if (searchTerm) {
            query = query.or(`nombre_completo.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) console.error('Error fetching patients:', error)
        else setPacientes(data || [])
        setLoading(false)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center text-gray-900">
                    <div>
                        <h1 className="text-2xl font-bold">Pacientes</h1>
                        <p className="mt-1 text-sm text-gray-500">Padrón de pacientes de la clínica</p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Cargando pacientes...</div>
                    ) : pacientes.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No se encontraron pacientes.</div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {pacientes.map((paciente) => (
                                <li key={paciente.id} className="hover:bg-gray-50 transition-colors">
                                    <div className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                {paciente.nombre_completo.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{paciente.nombre_completo}</p>
                                                <div className="flex space-x-4 text-xs text-gray-500">
                                                    <span>DNI: {paciente.dni}</span>
                                                    {paciente.obra_social && <span>OS: {paciente.obra_social}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Link
                                                to={`/admin/historias-clinicas?pacienteId=${paciente.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                                            >
                                                Ver Historía Clínica
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
