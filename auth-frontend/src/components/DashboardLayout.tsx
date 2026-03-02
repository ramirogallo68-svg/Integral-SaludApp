import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'

interface MenuItem {
    name: string
    path: string
    icon: ReactNode
    roles: string[]
}

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { usuario, signOut } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    // Menú de navegación basado en roles
    const menuItems: MenuItem[] = [
        // SUPER_ADMIN
        {
            name: 'Dashboard',
            path: '/super-admin/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            roles: ['SUPER_ADMIN'],
        },
        {
            name: 'Clínicas',
            path: '/super-admin/clinicas',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            roles: ['SUPER_ADMIN'],
        },
        {
            name: 'Usuarios',
            path: '/super-admin/usuarios',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ['SUPER_ADMIN'],
        },
        // ADMIN_CLINICA
        {
            name: 'Dashboard',
            path: '/admin/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            roles: ['ADMIN_CLINICA'],
        },
        {
            name: 'Médicos/Profesionales',
            path: '/admin/medicos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            roles: ['ADMIN_CLINICA'],
        },
        {
            name: 'Pacientes',
            path: '/admin/pacientes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['ADMIN_CLINICA'],
        },
        {
            name: 'Turnos',
            path: '/admin/turnos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            roles: ['ADMIN_CLINICA'],
        },
        {
            name: 'Especialidades',
            path: '/admin/especialidades',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            roles: ['ADMIN_CLINICA'],
        },
        // MEDICO
        {
            name: 'Dashboard',
            path: '/medico/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            roles: ['MEDICO'],
        },
        {
            name: 'Mis Turnos',
            path: '/medico/turnos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            roles: ['MEDICO'],
        },
        {
            name: 'Pacientes',
            path: '/medico/pacientes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            roles: ['MEDICO'],
        },
        {
            name: 'Historias Clínicas',
            path: '/admin/historias-clinicas',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            roles: ['MEDICO'],
        },
    ]

    // Filtrar menú según rol del usuario
    const filteredMenu = menuItems.filter((item) =>
        usuario ? item.roles.includes(usuario.rol) : false
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
                    {/* Logo */}
                    <div className="flex h-16 shrink-0 items-center">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Logo variant="icon" className="h-9 w-9" />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight text-gray-900">
                                    Integral<span className="text-indigo-600">Salud</span>
                                </span>
                                {usuario?.clinica?.nombre && (
                                    <span className="text-[10px] font-bold text-teal-600 truncate -mt-0.5 uppercase tracking-widest">
                                        {usuario.clinica.nombre}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {filteredMenu.map((item) => {
                                        const isActive = location.pathname === item.path
                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    to={item.path}
                                                    className={`
                            group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all
                            ${isActive
                                                            ? 'bg-indigo-50 text-indigo-600'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                                        }
                          `}
                                                >
                                                    <span className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}>
                                                        {item.icon}
                                                    </span>
                                                    {item.name}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>

                            {/* User info at bottom */}
                            <li className="mt-auto">
                                <div className="flex items-center gap-x-4 px-3 py-3 text-sm font-medium leading-6 text-gray-900 border-t border-gray-200">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                                        {usuario?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {usuario?.nombre_completo || 'Usuario'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {usuario?.rol?.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="relative z-50 lg:hidden">
                    <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-0 flex">
                        <div className="relative mr-16 flex w-full max-w-xs flex-1">
                            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                    <span className="sr-only">Close sidebar</span>
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                                <div className="flex h-16 shrink-0 items-center">
                                    <div className="flex items-center gap-3">
                                        <Logo variant="icon" className="h-8 w-8" />
                                        <span className="text-xl font-bold tracking-tight text-gray-900">
                                            Integral<span className="text-indigo-600">Salud</span>
                                        </span>
                                    </div>
                                </div>
                                <nav className="flex flex-1 flex-col">
                                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                        <li>
                                            <ul role="list" className="-mx-2 space-y-1">
                                                {filteredMenu.map((item) => {
                                                    const isActive = location.pathname === item.path
                                                    return (
                                                        <li key={item.name}>
                                                            <Link
                                                                to={item.path}
                                                                onClick={() => setSidebarOpen(false)}
                                                                className={`
                                  group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all
                                  ${isActive
                                                                        ? 'bg-indigo-50 text-indigo-600'
                                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                                                    }
                                `}
                                                            >
                                                                <span className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}>
                                                                    {item.icon}
                                                                </span>
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {/* Breadcrumb o título podría ir aquí */}
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* User menu */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center gap-x-3 rounded-lg p-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                                        {usuario?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden lg:block">{usuario?.nombre_completo}</span>
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                        <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                            <div className="p-2">
                                                <div className="px-3 py-2 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{usuario?.nombre_completo}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{usuario?.email}</p>
                                                </div>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center gap-x-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 mt-1"
                                                >
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-8">
                    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    )
}
