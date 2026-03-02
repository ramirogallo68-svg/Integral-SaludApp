import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'

interface Stats {
    clinicasActivas: number
    totalMedicos: number
    totalPacientes: number
    totalTurnos: number
    loading: boolean
}

export function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        clinicasActivas: 0,
        totalMedicos: 0,
        totalPacientes: 0,
        totalTurnos: 0,
        loading: true
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch stats in parallel
                const [
                    { count: clinicasCount },
                    { count: medicosCount },
                    { count: pacientesCount },
                    { count: turnosCount }
                ] = await Promise.all([
                    supabase.from('clinicas').select('*', { count: 'exact', head: true }).eq('activa', true),
                    supabase.from('medicos').select('*', { count: 'exact', head: true }),
                    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
                    supabase.from('turnos').select('*', { count: 'exact', head: true })
                ])

                setStats({
                    clinicasActivas: clinicasCount || 0,
                    totalMedicos: medicosCount || 0,
                    totalPacientes: pacientesCount || 0,
                    totalTurnos: turnosCount || 0,
                    loading: false
                })
            } catch (error) {
                console.error('Error fetching dashboard stats:', error)
                setStats(s => ({ ...s, loading: false }))
            }
        }

        fetchStats()
    }, [])

    const statCards = [
        {
            name: 'Clínicas Activas',
            value: stats.clinicasActivas,
            icon: (
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            color: 'bg-indigo-50'
        },
        {
            name: 'Total Médicos/Profesionales',
            value: stats.totalMedicos,
            icon: (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            color: 'bg-blue-50'
        },
        {
            name: 'Total Pacientes',
            value: stats.totalPacientes,
            icon: (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'bg-green-50'
        },
        {
            name: 'Turnos Totales',
            value: stats.totalTurnos,
            icon: (
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: 'bg-purple-50'
        }
    ]

    return (
        <DashboardLayout>
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Global</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Resumen del estado actual de todo el ecosistema SaaS.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                    {stats.loading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-pulse bg-white overflow-hidden shadow rounded-lg h-32"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card) => (
                                <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-md">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 p-3 rounded-md ${card.color}`}>
                                                {card.icon}
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                                        {card.name}
                                                    </dt>
                                                    <dd className="flex items-baseline">
                                                        <div className="text-2xl font-semibold text-gray-900">
                                                            {card.value}
                                                        </div>
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions or More Metrics */}
                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Gestión Rápida</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <button className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-indigo-50 rounded-md">
                                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-700">Nueva Clínica</span>
                                </button>
                                <button className="flex items-center justify-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-green-50 rounded-md">
                                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-700">Nuevo Admin</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Estado del Sistema</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Base de Datos</span>
                                    </div>
                                    <span className="text-xs text-green-600 font-semibold">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Servicio de Autenticación</span>
                                    </div>
                                    <span className="text-xs text-green-600 font-semibold">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Almacenamiento (Storage)</span>
                                    </div>
                                    <span className="text-xs text-green-600 font-semibold">ONLINE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
