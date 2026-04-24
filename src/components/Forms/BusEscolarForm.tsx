// src/components/Forms/BusEscolarForm.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';
import type { AlumnoBus } from '../../types';

interface BusEscolarFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dataToEdit?: AlumnoBus | null;
}

const BusEscolarForm = ({ isOpen, onClose, onSuccess, dataToEdit }: BusEscolarFormProps) => {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<Partial<AlumnoBus>>({
        nombre_alumno: '', dni_alumno: '', edad: 0, sexo: '', colegio: '',
        nombre_apoderado: '', telefono_apoderado: '', dni_apoderado: '', direccion: ''
    });

    useEffect(() => {
        if (dataToEdit) setFormData(dataToEdit);
        else setFormData({ nombre_alumno: '', dni_alumno: '', edad: 0, sexo: '', colegio: '', nombre_apoderado: '', telefono_apoderado: '', dni_apoderado: '', direccion: '' });
    }, [dataToEdit, isOpen]);

    // Función auxiliar para manejar cambios y forzar Mayúsculas
    const handleChange = (field: keyof AlumnoBus, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: typeof value === 'string' ? value.toUpperCase() : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            
            const payload = {
                nombre_alumno: formData.nombre_alumno?.trim().toUpperCase(),
                dni_alumno: formData.dni_alumno?.trim(),
                edad: formData.edad,
                sexo: formData.sexo?.toUpperCase(),
                colegio: formData.colegio?.trim().toUpperCase(),
                nombre_apoderado: formData.nombre_apoderado?.trim().toUpperCase(),
                telefono_apoderado: formData.telefono_apoderado?.trim(),
                dni_apoderado: formData.dni_apoderado?.trim(),
                direccion: formData.direccion?.trim().toUpperCase(),
                usuario_registro: session?.user?.email?.toUpperCase()
            };

            if (dataToEdit) {
                const { error } = await supabase.from('social_bus_escolar').update(payload).eq('id', dataToEdit.id);
                if (error) throw error;
                toast.success('REGISTRO ACTUALIZADO');
            } else {
                
                const { data: nextCode, error: rpcError } = await supabase.rpc('generar_siguiente_codigo_bus');
                if (rpcError) throw rpcError;

                const { error } = await supabase.from('social_bus_escolar').insert([{
                    ...payload,
                    codigo: nextCode
                }]);
                if (error) throw error;
                toast.success(`INSCRITO CON ÉXITO: ${nextCode}`);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'ERROR AL PROCESAR');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full bg-[#13141a] border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-orange-500 text-sm transition-all uppercase placeholder:text-gray-700 font-medium";
    const labelClass = "block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1F25] border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
                {/* CABECERA */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#27282F]">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">
                        {dataToEdit ? 'Editar Inscripción' : 'Inscripción Bus Municipal'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <RiCloseLine size={24}/>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* SECCIÓN ESTUDIANTE */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                <h3 className="text-orange-500 text-xs font-black uppercase tracking-widest">Datos del Estudiante</h3>
                            </div>

                            <div>
                                <label className={labelClass}>Nombres y Apellidos Completos</label>
                                <input required type="text" placeholder="EJ: JUAN PEREZ" className={inputClass} value={formData.nombre_alumno} onChange={e => handleChange('nombre_alumno', e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>DNI Alumno</label>
                                    <input required type="text" maxLength={8} placeholder="8 DÍGITOS" className={inputClass} value={formData.dni_alumno} onChange={e => handleChange('dni_alumno', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Edad</label>
                                    <input required type="number" className={inputClass} value={formData.edad} onChange={e => handleChange('edad', parseInt(e.target.value))} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Sexo</label>
                                    <select required className={inputClass} value={formData.sexo} onChange={e => handleChange('sexo', e.target.value)}>
                                        <option value="">SELECCIONAR</option>
                                        <option value="MASCULINO">MASCULINO</option>
                                        <option value="FEMENINO">FEMENINO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Institución Educativa</label>
                                    <input required type="text" placeholder="EJ: I.E.P PROGRESO" className={inputClass} value={formData.colegio} onChange={e => handleChange('colegio', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN APODERADO */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                <h3 className="text-blue-500 text-xs font-black uppercase tracking-widest">Datos del Apoderado</h3>
                            </div>

                            <div>
                                <label className={labelClass}>Nombre del Apoderado</label>
                                <input required type="text" placeholder="EJ: MARIA SOSA" className={inputClass} value={formData.nombre_apoderado} onChange={e => handleChange('nombre_apoderado', e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>DNI Apoderado</label>
                                    <input required type="text" maxLength={8} className={inputClass} value={formData.dni_apoderado} onChange={e => handleChange('dni_apoderado', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelClass}>Celular</label>
                                    <input required type="text" placeholder="900 000 000" className={inputClass} value={formData.telefono_apoderado} onChange={e => handleChange('telefono_apoderado', e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Dirección Domicilio</label>
                                <textarea required placeholder="EJ: AV. LIBERTAD 123" className={inputClass + " h-[84px] resize-none py-2"} value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* BOTÓN DE ACCIÓN */}
                    <div className="pt-4 border-t border-gray-800">
                        <button 
                            disabled={loading} 
                            type="submit" 
                            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-900/20 uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><RiSaveLine size={22}/> GUARDAR REGISTRO</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusEscolarForm;