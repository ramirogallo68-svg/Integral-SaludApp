import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Usuario } from '../lib/supabase'

interface AuthContextType {
    user: User | null
    usuario: (Usuario & { clinica?: Clinica | null }) | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [usuario, setUsuario] = useState<(Usuario & { clinica?: Clinica | null }) | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUsuario(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUsuario(session.user.id)
            } else {
                setUsuario(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUsuario = async (authUserId: string) => {
        setLoading(true)
        try {
            console.log('Intentando obtener perfil para auth_id:', authUserId);
            const { data, error } = await supabase
                .from('usuarios')
                .select('*, clinica:clinicas(*)')
                .eq('auth_user_id', authUserId)
                .single()

            if (error) {
                console.error('Error de Supabase al buscar perfil:', error.message, error.code);
                throw error
            }

            console.log('Perfil cargado exitosamente:', data);
            setUsuario(data)
        } catch (error) {
            console.error('Error fetching usuario:', error)
            setUsuario(null)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
    }

    const value = {
        user,
        usuario,
        session,
        loading,
        signIn,
        signOut,
        resetPassword,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
