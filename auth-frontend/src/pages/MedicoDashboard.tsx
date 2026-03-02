import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Turno, Medico } from '../lib/supabase'
import { Link } from 'react-router-dom'

interface MedicoStats {
    turnosHoy: number
    completados: number
    pendientes: number
    misPacientes: number
    loading: boolean
}

export function MedicoDashboard() {
    const { usuario } = useAuth()
    const [medicoInfo, setMedicoInfo] = useState<Medico | null>(null)
    const [stats, setStats] = useState<MedicoStats>({
        turnosHoy: 0,
        completados: 0,
        pendientes: 0,
        misPacientes: 0,
        loading: true
    })
    const [turnosSemana, setTurnosSemana] = useState<Turno[]>([])

    useEffect(() => {
        if (usuario?.id) {
            fetchMedicoData()
        }
    }, [usuario])

    const fetchMedicoData = async () => {
        // 1. Obtener ID de médico
        const { data: medico, error: medicoError } = await supabase
            .from('medicos')
            .select('*, especialidad:especialidades(nombre)')
            .eq('usuario_id', usuario?.id)
            .single()

        if (medicoError || !medico) {
            console.error('Error fetching medico profile:', medicoError)
            setStats(s => ({ ...s, loading: false }))
            return
        }

        setMedicoInfo(medico)

        // 2. Obtener estadísticas y turnos
        const now = new Date()
        const hoy = now.toISOString().split('T')[0]
        const finSemana = new Date(now)
        finSemana.setDate(now.getDate() + 7)
        const finSemanaStr = finSemana.toISOString().split('T')[0]

        const [
            { count: totalHoy },
            { count: completados },
            { count: pendientes },
            { data: turnosData },
            { data: pacientesUnicos }
        ] = await Promise.all([
            supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('medico_id', medico.id).gte('fecha_hora', `${hoy}T00:00:00`).lte('fecha_hora', `${hoy}T23:59:59`),
            supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('medico_id', medico.id).eq('estado', 'COMPLETADO'),
            supabase.from('turnos').select('*', {
                count: 'exact', head: true
            }).eq('medico_id', medico.id).eq('estado', 'PENDIENTE'),
            supabase.from('turnos').select('*, paciente:pacientes(*)').eq('medico_id', medico.id).gte('fecha_hora', `${hoy}T00:00:00`).lte('fecha_hora', `${finSemanaStr}T23:59:59`).order('fecha_hora'),
            supabase.from('turnos').select('paciente_id').eq('medico_id', medico.id)
        ])

        // Calcular pacientes únicos
        const uniquePatientIds = new Set(pacientesUnicos?.map(p => p.paciente_id) || [])

        setStats({
            turnosHoy: totalHoy || 0,
            completados: completados || 0,
            pendientes: pendientes || 0,
            misPacientes: uniquePatientIds.size,
            loading: false
        })

        setTurnosSemana(turnosData || [])
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Bienvenido, {usuario?.nombre_completo}
                            {usuario?.clinica?.nombre && (
                                <span className="text-teal-600 ml-2 font-semibold"> - {usuario.clinica.nombre}</span>
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestiona tus turnos y pacientes asignados
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">Turnos Hoy</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.loading ? '...' : stats.turnosHoy}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">Atendidos</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.loading ? '...' : stats.completados}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.loading ? '...' : stats.pendientes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-medium text-gray-500">Mis Pacientes</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.loading ? '...' : stats.misPacientes}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Schedule Today */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-base font-semibold text-gray-900">Agenda de la Semana</h3>
                            <Link to="/medico/turnos" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Ver todos</Link>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {turnosSemana.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    No tienes turnos programados para esta semana.
                                </div>
                            ) : turnosSemana.map((turno) => (
                                <div key={turno.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center bg-gray-50 px-3 py-1 rounded min-w-[100px]">
                                            <p className="text-xs font-medium text-gray-500 uppercase">{new Date(turno.fecha_hora).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {new Date(turno.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{turno.paciente?.nombre_completo}</p>
                                            <p className="text-xs text-gray-500">{turno.motivo_consulta || 'Sin motivo especificado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${turno.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                                            turno.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {turno.estado}
                                        </span>
                                        <Link
                                            to={`/admin/historias-clinicas?pacienteId=${turno.paciente_id}`}
                                            className="inline-flex items-center p-1.5 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-50"
                                            title="Ver Historia Clínica"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions & Recent Patients placeholder */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Acciones Rápidas</h3>
                            <div className="space-y-3">
                                <Link to="/medico/turnos" className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                    Ver Mi Agenda Completa
                                </Link>
                                <Link to="/medico/pacientes" className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    Buscar Paciente
                                </Link>
                            </div>
                        </div>

                        <div className="bg-indigo-600 p-6 rounded-lg shadow-sm text-white">
                            <h3 className="text-lg font-bold mb-2">Mi Perfil</h3>
                            <p className="text-indigo-100 text-sm mb-4">Especialidad: {medicoInfo?.especialidad?.nombre || (stats.loading ? 'Cargando...' : 'No asignada')}</p>
                            <div className="text-xs text-indigo-200 bg-indigo-700 p-3 rounded">
                                Recuerda registrar la evolución médica después de cada consulta para mantener actualizada la historia clínica.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
