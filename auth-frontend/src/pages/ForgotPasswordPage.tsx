import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const { resetPassword } = useAuth()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setLoading(true)

        try {
            const { error } = await resetPassword(email)
            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError('Error al enviar el correo. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
            <div className="max-w-md w-full">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Recuperar contraseña
                    </h1>
                    <p className="text-gray-600">
                        Ingresa tu correo para recibir instrucciones
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Correo enviado
                            </h3>
                            <p className="text-gray-600">
                                Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500">
                                Revisa tu bandeja de entrada y sigue las instrucciones.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                ← Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
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
                                        Enviando...
                                    </span>
                                ) : (
                                    'Enviar instrucciones'
                                )}
                            </button>

                            {/* Back to login link */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                >
                                    ← Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
