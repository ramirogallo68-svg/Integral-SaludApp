import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { getLocalDayRange } from '../lib/dateUtils'

interface ClinicStats {
    totalMedicos: number
    totalPacientes: number
    turnosHoy: number
    totalEspecialidades: number
    loading: boolean
}

export function AdminDashboard() {
    const { usuario } = useAuth()
    const [stats, setStats] = useState<ClinicStats>({
        totalMedicos: 0,
        totalPacientes: 0,
        turnosHoy: 0,
        totalEspecialidades: 0,
        loading: true
    })

    useEffect(() => {
        if (!usuario?.clinic_id) return

        const fetchStats = async () => {
            try {
                const { start: hoyInicio, end: hoyFin } = getLocalDayRange(new Date())

                const [
                    { count: medicosCount },
                    { count: pacientesCount },
                    { count: turnosCount },
                    { count: especialidadesCount }
                ] = await Promise.all([
                    supabase.from('medicos').select('*', { count: 'exact', head: true }).eq('clinic_id', usuario.clinic_id),
                    supabase.from('pacientes').select('*', { count: 'exact', head: true }).eq('clinic_id', usuario.clinic_id),
                    supabase.from('turnos')
                        .select('*', { count: 'exact', head: true })
                        .eq('clinic_id', usuario.clinic_id)
                        .gte('fecha_hora', hoyInicio)
                        .lte('fecha_hora', hoyFin),
                    supabase.from('especialidades').select('*', { count: 'exact', head: true }).eq('clinic_id', usuario.clinic_id)
                ])

                setStats({
                    totalMedicos: medicosCount || 0,
                    totalPacientes: pacientesCount || 0,
                    turnosHoy: turnosCount || 0,
                    totalEspecialidades: especialidadesCount || 0,
                    loading: false
                })
            } catch (error) {
                console.error('Error fetching clinic stats:', error)
                setStats(s => ({ ...s, loading: false }))
            }
        }

        fetchStats()
    }, [usuario])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Panel de Administración
                        {usuario?.clinica?.nombre && (
                            <span className="text-teal-600 ml-2"> - {usuario.clinica.nombre}</span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Vista general y métricas de tu clínica
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Médicos */}
                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Médicos/Profesionales</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">
                                            {stats.loading ? '...' : stats.totalMedicos}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pacientes */}
                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Pacientes</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">
                                            {stats.loading ? '...' : stats.totalPacientes}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Turnos Hoy */}
                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Turnos Hoy</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">
                                            {stats.loading ? '...' : stats.turnosHoy}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Especialidades */}
                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Especialidades</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">
                                            {stats.loading ? '...' : stats.totalEspecialidades}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link to="/admin/medicos" className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Gestionar Profesionales
                        </Link>
                        <Link to="/admin/pacientes" className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Nuevo Paciente
                        </Link>
                        <Link to="/admin/turnos" className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Ver Agenda
                        </Link>
                        <Link to="/admin/especialidades" className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Especialidades
                        </Link>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h4 className="text-sm font-medium text-blue-800">Bienvenido al Panel de Administración</h4>
                        <p className="mt-1 text-sm text-blue-700">
                            Desde aquí puedes gestionar los profesionales, pacientes y turnos de tu clínica. Selecciona una opción de las acciones rápidas o del menú lateral para comenzar.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
