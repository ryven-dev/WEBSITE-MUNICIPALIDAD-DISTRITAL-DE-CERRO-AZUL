import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';
import type { Libro } from '../../types';

const CLASIFICACIONES = [
    { label: "Generalidades", desc: "Computación, enciclopedias, bibliografía" },
    { label: "Filosofía y Psicología", desc: "Ética, lógica, filosofía" },
    { label: "Religión", desc: "Mitología, teología" },
    { label: "Ciencias Sociales", desc: "Política, economía, derecho, educación" },
    { label: "Lenguas", desc: "Idiomas, lingüística" },
    { label: "Matemáticas y Ciencias Naturales", desc: "Física, química, biología" },
    { label: "Tecnología y Ciencias Aplicadas", desc: "Medicina, ingeniería, agricultura, cocina" },
    { label: "Artes", desc: "Música, juegos, deportes, diseño" },
    { label: "Literatura", desc: "Poesía, teatro, novelas" },
    { label: "Historia y Geografía", desc: "Viajes, biografías, historia mundial" }
];

interface LibroFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    dataToEdit?: Libro | null;
}

const LibroForm = ({ isOpen, onClose, onSuccess, dataToEdit }: LibroFormProps) => {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Libro>>({
        titulo: '', autor: '', editorial: '', tomo: '', valor_referencial: 0, clasificacion: ''
    });

    useEffect(() => {
        if (dataToEdit) setFormData(dataToEdit);
        else setFormData({ titulo: '', autor: '', editorial: '', tomo: '', valor_referencial: 0, clasificacion: '' });
    }, [dataToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clasificacion) return toast.error("Seleccione una clasificación");
        setLoading(true);

        try {
            const payload = {
                titulo: formData.titulo?.toUpperCase(),
                autor: formData.autor,
                editorial: formData.editorial,
                tomo: formData.tomo,
                clasificacion: formData.clasificacion,
                valor_referencial: formData.valor_referencial
            };

            if (dataToEdit) {
                const { error } = await supabase.from('biblioteca_libros').update(payload).eq('id', dataToEdit.id);
                if (error) throw error;
                toast.success('Libro actualizado');
            } else {
                const { data: nextCode } = await supabase.rpc('generar_siguiente_codigo_biblioteca');
                const { error } = await supabase.from('biblioteca_libros').insert([{
                    ...payload,
                    codigo: nextCode,
                    usuario_registro: session?.user?.email
                }]);
                if (error) throw error;
                toast.success(`Registrado con código ${nextCode}`);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full bg-[#13141a] border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-blue-500 text-sm transition-all";
    const labelClass = "block text-[10px] font-bold text-gray-500 uppercase mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-[#1E1F25] border border-gray-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#27282F]">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Gestión de Libro</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><RiCloseLine size={24}/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className={labelClass}>Título</label>
                        <input required type="text" className={inputClass + " uppercase"} value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} />
                    </div>

                    {/* SELECTOR DE CLASIFICACIÓN */}
                    <div>
                        <label className={labelClass}>Clasificación</label>
                        <select 
                            required
                            className={inputClass}
                            value={formData.clasificacion}
                            onChange={e => setFormData({...formData, clasificacion: e.target.value})}
                        >
                            <option value="">-- Seleccionar Categoría --</option>
                            {CLASIFICACIONES.map((c, i) => (
                                <option key={i} value={c.label}>
                                    {c.label} ({c.desc})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Autor</label>
                            <input type="text" className={inputClass} value={formData.autor} onChange={e => setFormData({...formData, autor: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Editorial</label>
                            <input type="text" className={inputClass} value={formData.editorial} onChange={e => setFormData({...formData, editorial: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tomo / Volumen</label>
                            <input type="text" className={inputClass} value={formData.tomo} onChange={e => setFormData({...formData, tomo: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Valor Ref. (S/)</label>
                            <input type="number" step="0.01" className={inputClass} value={formData.valor_referencial} onChange={e => setFormData({...formData, valor_referencial: parseFloat(e.target.value)})} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><RiSaveLine size={20}/> GUARDAR REGISTRO</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LibroForm;