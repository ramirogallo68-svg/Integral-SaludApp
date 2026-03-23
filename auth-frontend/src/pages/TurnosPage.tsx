import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Turno, Medico, Paciente, Especialidad } from '../lib/supabase'
import { getMondayOf, getWeeklyRange, formatDateForInput } from '../lib/dateUtils'

export function TurnosPage() {
    const { usuario } = useAuth()
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [medicos, setMedicos] = useState<Medico[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([])
    const [selectedEspecialidad, setSelectedEspecialidad] = useState('')
    const [medicosFiltrados, setMedicosFiltrados] = useState<Medico[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTurno, setEditingTurno] = useState<Turno | null>(null)

    // Filtros - Inicializar con el lunes de esta semana
    const [filtroFecha, setFiltroFecha] = useState(formatDateForInput(getMondayOf(new Date())))
    const [filtroMedico, setFiltroMedico] = useState('')

    const [formData, setFormData] = useState({
        paciente_id: '',
        medico_id: '',
        fecha_hora: '',
        motivo_consulta: '',
        estado: 'PENDIENTE' as Turno['estado']
    })

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchInitialData()
        }
    }, [usuario])

    useEffect(() => {
        if (usuario?.clinic_id) {
            fetchTurnos()
        }
    }, [filtroFecha, filtroMedico, usuario])

    const fetchInitialData = async () => {
        const [medicosRes, pacientesRes, especialidadesRes] = await Promise.all([
            supabase.from('medicos').select('*, usuario:usuarios(nombre_completo)').eq('clinic_id', usuario?.clinic_id).eq('activo', true),
            supabase.from('pacientes').select('*').eq('clinic_id', usuario?.clinic_id).order('nombre_completo'),
            supabase.from('especialidades').select('*').eq('clinic_id', usuario?.clinic_id).eq('activa', true).order('nombre')
        ])
        if (medicosRes.data) setMedicos(medicosRes.data)
        if (pacientesRes.data) setPacientes(pacientesRes.data)
        if (especialidadesRes.data) setEspecialidades(especialidadesRes.data)
    }

    const loadMedicosPorEspecialidad = async (especialidadId: string) => {
        if (!especialidadId) {
            setMedicosFiltrados([])
            return
        }
        const { data, error } = await supabase
            .from('medicos')
            .select('*, usuario:usuarios(nombre_completo)')
            .eq('clinic_id', usuario?.clinic_id)
            .eq('activo', true)
            .eq('especialidad_id', especialidadId)

        if (!error && data) {
            setMedicosFiltrados(data)
        } else {
            setMedicosFiltrados([])
        }
    }

    const handleEspecialidadChange = (especialidadId: string) => {
        setSelectedEspecialidad(especialidadId)
        setFormData(prev => ({ ...prev, medico_id: '' }))
        loadMedicosPorEspecialidad(especialidadId)
    }



    const fetchTurnos = async () => {
        setLoading(true)

        const [year, month, day] = filtroFecha.split('-').map(Number)
        // Usamos el día seleccionado como base, pero el plan dice Monday-start
        // Para que sea consistente, si el usuario elige un día, mostramos la semana de ese lunes
        const baseDate = new Date(year, month - 1, day)
        const lunes = getMondayOf(baseDate)
        const { start, end } = getWeeklyRange(lunes)

        let query = supabase
            .from('turnos')
            .select('*, medico:medicos(*, usuario:usuarios(nombre_completo)), paciente:pacientes(*)')
            .eq('clinic_id', usuario?.clinic_id)
            .gte('fecha_hora', start)
            .lte('fecha_hora', end)
            .order('fecha_hora', { ascending: true })

        if (filtroMedico) {
            query = query.eq('medico_id', filtroMedico)
        }

        const { data, error } = await query
        if (error) console.error('Error fetching turnos:', error)
        else setTurnos(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.clinic_id) return
        setLoading(true)

        // Convertir la fecha local del input HTML (YYYY-MM-DDTHH:mm) a ISO con offset real
        const localDate = new Date(formData.fecha_hora)

        const payload = {
            ...formData,
            fecha_hora: localDate.toISOString(),
            clinic_id: usuario.clinic_id,
            duracion_minutos: 30
        }

        if (editingTurno) {
            const { error } = await supabase
                .from('turnos')
                .update(payload)
                .eq('id', editingTurno.id)
            if (error) alert('Error actualizando turno')
            else {
                fetchTurnos()
                closeModal()
            }
        } else {
            const { error } = await supabase
                .from('turnos')
                .insert([payload])
            if (error) alert('Error creando turno')
            else {
                fetchTurnos()
                closeModal()
            }
        }
        setLoading(false)
    }

    const updateEstado = async (turnoId: string, nuevoEstado: Turno['estado']) => {
        const { error } = await supabase
            .from('turnos')
            .update({ estado: nuevoEstado })
            .eq('id', turnoId)

        if (error) alert('Error actualizando estado')
        else fetchTurnos()
    }

    const openModal = async (turno: Turno | null = null) => {
        if (turno) {
            setEditingTurno(turno)
            setFormData({
                paciente_id: turno.paciente_id,
                medico_id: turno.medico_id,
                fecha_hora: turno.fecha_hora.substring(0, 16),
                motivo_consulta: turno.motivo_consulta || '',
                estado: turno.estado
            })
            
            const medicoActual = medicos.find(m => m.id === turno.medico_id)
            if (medicoActual?.especialidad_id) {
                setSelectedEspecialidad(medicoActual.especialidad_id)
                loadMedicosPorEspecialidad(medicoActual.especialidad_id)
            } else {
                 const { data } = await supabase.from('medicos').select('especialidad_id').eq('id', turno.medico_id).single()
                 if (data?.especialidad_id) {
                     setSelectedEspecialidad(data.especialidad_id)
                     loadMedicosPorEspecialidad(data.especialidad_id)
                 }
            }
        } else {
            setEditingTurno(null)
            setSelectedEspecialidad('')
            setMedicosFiltrados([])
            // Para el valor por defecto, usamos la fecha de inicio del filtro a las 09:00 local
            const [year, month, day] = filtroFecha.split('-').map(Number)
            const defaultDate = new Date(year, month - 1, day, 9, 0)

            // Reutilizamos formatDateForInput para la parte de la fecha
            const datePart = formatDateForInput(defaultDate)
            const hoursStr = String(defaultDate.getHours()).padStart(2, '0')
            const minsStr = String(defaultDate.getMinutes()).padStart(2, '0')

            setFormData({
                paciente_id: '',
                medico_id: filtroMedico || '',
                fecha_hora: `${datePart}T${hoursStr}:${minsStr}`,
                motivo_consulta: '',
                estado: 'PENDIENTE'
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingTurno(null)
    }

    const getEstadoBadgeClass = (estado: string) => {
        switch (estado) {
            case 'CONFIRMADO': return 'bg-green-100 text-green-800'
            case 'CANCELADO': return 'bg-red-100 text-red-800'
            case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800'
            case 'COMPLETADO': return 'bg-blue-100 text-blue-800'
            case 'AUSENTE': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getRangeText = () => {
        const [year, month, day] = filtroFecha.split('-').map(Number)
        const lunes = getMondayOf(new Date(year, month - 1, day))
        const { start, end } = getWeeklyRange(lunes)

        return `Mostrando turnos del ${new Date(start).toLocaleDateString()} al ${new Date(end).toLocaleDateString()}`
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Agenda de Turnos
                            {usuario?.clinica?.nombre && (
                                <span className="text-teal-600 ml-2 font-semibold"> - {usuario.clinica.nombre}</span>
                            )}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestiona las citas médicas y disponibilidad
                        </p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        Nueva Cita
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Desde la fecha (Semana)</label>
                        <input
                            type="date"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Médico (Opcional)</label>
                        <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={filtroMedico}
                            onChange={(e) => setFiltroMedico(e.target.value)}
                        >
                            <option value="">Todos los médicos</option>
                            {medicos.map(m => (
                                <option key={m.id} value={m.id}>{m.usuario?.nombre_completo}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Rango de Fechas Informativo */}
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

                {/* Tabla de Turnos */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Cargando turnos...</td>
                                </tr>
                            ) : turnos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-500 font-medium text-lg">No hay turnos programados para esta semana</p>
                                            <p className="text-gray-400 text-sm mt-1">Prueba seleccionando otro médico o una fecha de inicio distinta.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : turnos.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(t.fecha_hora).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {new Date(t.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {t.paciente?.nombre_completo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {t.medico?.usuario?.nombre_completo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeClass(t.estado)}`}>
                                            {t.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {t.estado === 'PENDIENTE' && (
                                            <button onClick={() => updateEstado(t.id, 'CONFIRMADO')} className="text-green-600 hover:text-green-900">Confirmar</button>
                                        )}
                                        {t.estado !== 'CANCELADO' && t.estado !== 'COMPLETADO' && (
                                            <button onClick={() => updateEstado(t.id, 'CANCELADO')} className="text-red-600 hover:text-red-900">Cancelar</button>
                                        )}
                                        <button onClick={() => openModal(t)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal de Turno */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" onClick={closeModal}>
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingTurno ? 'Editar Turno' : 'Nueva Cita'}
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Paciente</label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.paciente_id}
                                            onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                                        >
                                            <option value="">Selecciona un paciente</option>
                                            {pacientes.map(p => (
                                                <option key={p.id} value={p.id}>{p.nombre_completo} (DNI: {p.dni})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Especialidad</label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={selectedEspecialidad}
                                            onChange={(e) => handleEspecialidadChange(e.target.value)}
                                        >
                                            <option value="">Selecciona una especialidad</option>
                                            {especialidades.map(esp => (
                                                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Médico</label>
                                        <select
                                            required
                                            disabled={!selectedEspecialidad}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                            value={formData.medico_id}
                                            onChange={(e) => setFormData({ ...formData, medico_id: e.target.value })}
                                        >
                                            <option value="">
                                                {!selectedEspecialidad 
                                                    ? 'Selecciona una especialidad primero' 
                                                    : medicosFiltrados.length === 0 
                                                        ? 'No hay profesionales disponibles para esta especialidad' 
                                                        : 'Selecciona un médico'}
                                            </option>
                                            {medicosFiltrados.map(m => (
                                                <option key={m.id} value={m.id}>{m.usuario?.nombre_completo}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.fecha_hora}
                                            onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Motivo</label>
                                        <textarea
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.motivo_consulta}
                                            onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-5">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none"
                                        >
                                            {loading ? 'Guardando...' : editingTurno ? 'Guardar Cambios' : 'Agendar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
