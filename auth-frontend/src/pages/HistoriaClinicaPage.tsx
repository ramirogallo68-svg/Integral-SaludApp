import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { supabase, HistoriaClinica, Paciente, Medico } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function HistoriaClinicaPage() {
    const { usuario } = useAuth()
    const [searchParams] = useSearchParams()
    const pacienteId = searchParams.get('pacienteId')

    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [registros, setRegistros] = useState<HistoriaClinica[]>([])
    const [medicos, setMedicos] = useState<Medico[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [formData, setFormData] = useState({
        medico_id: '',
        fecha: new Date().toISOString().split('T')[0],
        diagnostico: '',
        tratamiento: '',
        observaciones: ''
    })

    useEffect(() => {
        if (usuario?.clinic_id && pacienteId) {
            fetchInitialData()
            fetchHistorias()
        }
    }, [usuario, pacienteId])

    const fetchInitialData = async () => {
        const [pacienteRes, medicosRes] = await Promise.all([
            supabase.from('pacientes').select('*').eq('id', pacienteId).single(),
            supabase.from('medicos').select('*, usuario:usuarios(nombre_completo)').eq('clinic_id', usuario?.clinic_id).eq('activo', true)
        ])
        if (pacienteRes.data) setPaciente(pacienteRes.data)
        if (medicosRes.data) setMedicos(medicosRes.data)
    }

    const fetchHistorias = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('historias_clinicas')
            .select('*, medico:medicos(*, usuario:usuarios(nombre_completo))')
            .eq('paciente_id', pacienteId)
            .order('fecha', { ascending: false })

        if (error) console.error('Error fetching historias:', error)
        else setRegistros(data || [])
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.clinic_id || !pacienteId) return
        setLoading(true)

        const { error } = await supabase
            .from('historias_clinicas')
            .insert([{
                ...formData,
                clinic_id: usuario.clinic_id,
                paciente_id: pacienteId
            }])

        if (error) alert('Error guardando registro profesional')
        else {
            fetchHistorias()
            setIsModalOpen(false)
            setFormData({
                medico_id: '',
                fecha: new Date().toISOString().split('T')[0],
                diagnostico: '',
                tratamiento: '',
                observaciones: ''
            })
        }
        setLoading(false)
    }

    const downloadPDF = () => {
        if (!paciente || registros.length === 0) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()

        // Título y Datos de la Clínica
        doc.setFontSize(20)
        doc.setTextColor(31, 41, 55)
        doc.text('Historia Clínica', 14, 22)

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 30)

        // Información del Paciente
        doc.setDrawColor(229, 231, 235)
        doc.line(14, 35, pageWidth - 14, 35)

        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.setFont('helvetica', 'bold')
        doc.text('Datos del Paciente', 14, 45)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const patientData = [
            ['Nombre Completo:', paciente.nombre_completo],
            ['DNI:', paciente.dni || 'No informado'],
            ['Obra Social:', paciente.obra_social || 'Particular'],
            ['Nº Afiliado:', paciente.numero_afiliado || 'N/A'],
            ['Teléfono:', paciente.telefono || 'No informado'],
            ['Email:', paciente.email || 'No informado']
        ]

        let yPos = 52
        patientData.forEach(([label, value]) => {
            doc.text(label, 14, yPos)
            doc.text(value, 50, yPos)
            yPos += 6
        })

        // Evoluciones
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Evoluciones Profesionales', 14, yPos + 10)

        const tableData = registros.map(reg => [
            new Date(reg.fecha).toLocaleDateString(),
            reg.medico?.usuario?.nombre_completo || 'N/A',
            reg.diagnostico || '',
            reg.tratamiento || '',
            reg.observaciones || ''
        ])

        autoTable(doc, {
            startY: yPos + 15,
            head: [['Fecha', 'Profesional', 'Diagnóstico', 'Tratamiento', 'Observaciones']],
            body: tableData,
            headStyles: { fillColor: [79, 70, 229] },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 20 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 30 },
                2: { cellWidth: 40 },
                3: { cellWidth: 40 },
                4: { cellWidth: 'auto' }
            }
        })

        doc.save(`Historia_Clinica_${paciente.nombre_completo.replace(/\s+/g, '_')}.pdf`)
    }

    if (!pacienteId) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Selecciona un paciente para ver su historia clínica.</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Historia Clínica</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Paciente: <span className="font-semibold">{paciente?.nombre_completo || 'Cargando...'}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={downloadPDF}
                            disabled={registros.length === 0}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar PDF
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                            Nueva Evolución
                        </button>
                    </div>
                </div>

                {/* Timeline de Registros */}
                <div className="flow-root">
                    <ul className="-mb-8">
                        {loading && registros.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Cargando historia clínica...</p>
                        ) : registros.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No hay registros médicos cargados aún.</p>
                        ) : registros.map((reg, regIdx) => (
                            <li key={reg.id}>
                                <div className="relative pb-8">
                                    {regIdx !== registros.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 bg-white p-4 rounded-lg border border-gray-200 shadow-sm ml-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{new Date(reg.fecha).toLocaleDateString()}</p>
                                                    <p className="text-xs text-indigo-600 font-medium">{reg.medico?.usuario?.nombre_completo}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-4">
                                                {reg.diagnostico && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico</h4>
                                                        <p className="mt-1 text-sm text-gray-700">{reg.diagnostico}</p>
                                                    </div>
                                                )}
                                                {reg.tratamiento && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tratamiento</h4>
                                                        <p className="mt-1 text-sm text-gray-700">{reg.tratamiento}</p>
                                                    </div>
                                                )}
                                                {reg.observaciones && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observaciones</h4>
                                                        <p className="mt-1 text-sm text-gray-700">{reg.observaciones}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Modal Nueva Evolución */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" onClick={() => setIsModalOpen(false)}>
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Nueva Carga Profesional</h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Profesional Atendiente</label>
                                            <select
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.medico_id}
                                                onChange={(e) => setFormData({ ...formData, medico_id: e.target.value })}
                                            >
                                                <option value="">Selecciona un profesional</option>
                                                {medicos.map(m => (
                                                    <option key={m.id} value={m.id}>{m.usuario?.nombre_completo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha</label>
                                            <input
                                                type="date"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={formData.fecha}
                                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
                                        <textarea
                                            rows={2}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.diagnostico}
                                            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tratamiento / Indicaciones</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.tratamiento}
                                            onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Observaciones Generales</label>
                                        <textarea
                                            rows={2}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.observaciones}
                                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-5">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none"
                                        >
                                            {loading ? 'Guardando...' : 'Guardar Evolución'}
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
