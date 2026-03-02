import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Turno, Medico } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function MisTurnosPage() {
    const { usuario } = useAuth()
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [loading, setLoading] = useState(true)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

    const getRangeText = () => {
        const start = new Date(filterDate)
        const end = new Date(filterDate)
        end.setDate(start.getDate() + 7)
        return `Mostrando turnos del ${start.toLocaleDateString()} al ${end.toLocaleDateString()}`
    }

    useEffect(() => {
        if (usuario?.id) {
            fetchMedicoAndTurnos()
        }
    }, [usuario, filterDate])

    const fetchMedicoAndTurnos = async () => {
        setLoading(true)
        try {
            // 1. Obtener perfil de médico
            const { data: medico, error: medicoError } = await supabase
                .from('medicos')
                .select('*')
                .eq('usuario_id', usuario?.id)
                .single()

            if (medicoError || !medico) throw medicoError || new Error('Perfil de médico no encontrado')

            // 2. Obtener turnos (Rango Semanal)
            const startDate = new Date(filterDate)
            const endDate = new Date(filterDate)
            endDate.setDate(startDate.getDate() + 7)

            const startDateStr = startDate.toISOString().split('T')[0]
            const endDateStr = endDate.toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('turnos')
                .select('*, paciente:pacientes(*)')
                .eq('medico_id', medico.id)
                .gte('fecha_hora', `${startDateStr}T00:00:00`)
                .lte('fecha_hora', `${endDateStr}T23:59:59`)
                .order('fecha_hora', { ascending: true })

            if (error) throw error
            setTurnos(data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateEstado = async (turnoId: string, nuevoEstado: Turno['estado']) => {
        const { error } = await supabase
            .from('turnos')
            .update({ estado: nuevoEstado })
            .eq('id', turnoId)

        if (error) alert('Error actualizando el estado')
        else fetchMedicoAndTurnos()
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Mi Agenda
                            {usuario?.clinica?.nombre && (
                                <span className="text-teal-600 ml-2 font-semibold"> - {usuario.clinica.nombre}</span>
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Tus turnos de los próximos 7 días</p>
                    </div>
                    <div>
                        <input
                            type="date"
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-gray-400 text-right">Inicio de la semana</p>
                    </div>
                </div>

                {/* Banner Informativo */}
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-indigo-700 font-medium">
                                {getRangeText()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Cargando agenda...</td>
                                </tr>
                            ) : turnos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-500 font-medium text-lg">No tienes turnos programados para esta semana.</p>
                                            <p className="text-gray-400 text-sm mt-1">Prueba seleccionando otra fecha de inicio.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : turnos.map((turno) => (
                                <tr key={turno.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(turno.fecha_hora).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {new Date(turno.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{turno.paciente?.nombre_completo}</div>
                                        <div className="text-xs text-gray-500">DNI: {turno.paciente?.dni}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {turno.motivo_consulta || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-0 cursor-pointer ${turno.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                                                turno.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                    turno.estado === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}
                                            value={turno.estado}
                                            onChange={(e) => updateEstado(turno.id, e.target.value as Turno['estado'])}
                                        >
                                            <option value="PENDIENTE">PENDIENTE</option>
                                            <option value="CONFIRMADO">CONFIRMADO</option>
                                            <option value="COMPLETADO">COMPLETADO</option>
                                            <option value="CANCELADO">CANCELADO</option>
                                            <option value="AUSENTE">AUSENTE</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <Link
                                            to={`/admin/historias-clinicas?pacienteId=${turno.paciente_id}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Historía Clínica
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    )
}
