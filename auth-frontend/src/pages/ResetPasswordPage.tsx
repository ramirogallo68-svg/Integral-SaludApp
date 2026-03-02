import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

export function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden')
        }

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres')
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
                setTimeout(() => {
                    navigate('/')
                }, 3000)
            }
        } catch (err) {
            setError('Error al actualizar la contraseña. Por favor intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Logo variant="icon" className="h-16 w-16 mx-auto mb-6 drop-shadow-sm" />
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Integral<span className="text-indigo-600">Salud</span>
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Establecer nueva contraseña para tu cuenta
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Contraseña actualizada
                            </h3>
                            <p className="text-gray-600">
                                Tu contraseña ha sido establecida correctamente. Serás redirigido en unos segundos...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? 'Guardando...' : 'Establecer contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
