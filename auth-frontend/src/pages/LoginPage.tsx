import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await signIn(email, password)
            if (error) {
                setError(error.message)
            } else {
                // La redirección se maneja en App.tsx basada en el rol
                navigate('/')
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
            <div className="max-w-md w-full">
                {/* Logo y título */}
                <div className="text-center mb-10">
                    <Logo variant="icon" className="h-16 w-16 mx-auto mb-6 drop-shadow-sm" />
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                        Integral<span className="text-indigo-600">Salud</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        Plataforma integral para la gestión de centros de salud
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                placeholder="tu@email.com"
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Iniciando sesión...
                                </span>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </button>

                        {/* Forgot password link */}
                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-400 mt-8 font-medium">
                    &copy; {new Date().getFullYear()} IntegralSalud
                </p>
            </div>
        </div>
    )
}
