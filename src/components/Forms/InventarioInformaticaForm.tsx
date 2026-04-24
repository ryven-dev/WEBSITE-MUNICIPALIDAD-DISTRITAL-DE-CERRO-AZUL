import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from '../../supabaseClient';
import { RiCloseLine, RiSave3Line } from 'react-icons/ri';
import { ORGANIGRAMA } from '../../data/organigrama';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onFormSubmit: () => void; 
  dataToEdit?: any | null; 
}

const InventarioInformaticaForm = ({ isOpen, onClose, onFormSubmit, dataToEdit }: Props) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const initialState = {
    unidad_organica: '',
    oficina_especifica: '',
    codigo_contable: '',
    codigo_patrimonial: '',
    denominacion: '',
    marca: '',
    modelo: '',
    tipo: '',
    color: '',
    serie: '',
    medida: '',
    estado: 'BUENO',
    observaciones: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (dataToEdit && isOpen) {
      setFormData({
        ...initialState,
        ...dataToEdit
      });
    } else {
      setFormData(initialState);
    }
  }, [dataToEdit, isOpen]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const val = value.toUpperCase(); // Forzar MAYÚSCULAS
    
    if (name === "unidad_organica") {
      setFormData({ ...formData, unidad_organica: val, oficina_especifica: '' });
    } else {
      setFormData({ ...formData, [name]: val });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unidad_organica || !formData.oficina_especifica || !formData.denominacion) {
      return toast.error("Complete los campos obligatorios (*)");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        usuario_registro: session?.user.email?.split('@')[0] || 'SISTEMA'
      };

      if (dataToEdit) {
        const { error } = await supabase.from('inventario_informatica').update(payload).eq('id', dataToEdit.id);
        if (error) throw error;
        toast.success('¡Actualizado!');
      } else {
        const { error } = await supabase.from('inventario_informatica').insert([payload]);
        if (error) throw error;
        toast.success('¡Guardado!');
      }
      onFormSubmit();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#13141a] border border-gray-700 rounded-lg p-2 text-[11px] outline-none focus:border-emerald-500 transition-all text-white font-medium";
  const labelClass = "text-[9px] text-gray-500 font-black uppercase mb-1 block tracking-widest ml-1";

  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onClose} 
      className="bg-[#1E1F25] text-white rounded-t-3xl md:rounded-2xl max-w-5xl w-full mx-auto outline-none border-t md:border border-gray-700 max-h-[95vh] flex flex-col shadow-2xl self-end md:self-center"
      overlayClassName="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm p-0 md:p-4"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
        <h2 className="text-sm md:text-base font-black uppercase italic text-emerald-400">Ficha de Registro Patrimonial</h2>
        <button onClick={onClose} className="p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white"><RiCloseLine size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-8 overflow-y-auto custom-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans italic">
        <div className="md:col-span-1">
          <label className={`${labelClass} text-blue-400`}>Gerencia / Oficina Gral *</label>
          <select required name="unidad_organica" value={formData.unidad_organica} onChange={handleChange} className={`${inputClass} border-blue-900/30 font-bold`}>
            <option value="">-- SELECCIONE --</option>
            {Object.keys(ORGANIGRAMA).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={`${labelClass} text-blue-400`}>Subgerencia / Oficina Detalle *</label>
          <select required name="oficina_especifica" value={formData.oficina_especifica} onChange={handleChange} disabled={!formData.unidad_organica} className={`${inputClass} border-blue-900/30 font-bold`}>
            <option value="">-- SELECCIONE UBICACIÓN ESPECÍFICA --</option>
            {formData.unidad_organica && (ORGANIGRAMA as any)[formData.unidad_organica].map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="md:col-span-3 border-b border-gray-800 mt-2"><span className="text-[10px] text-emerald-500 font-black uppercase">Datos del Bien</span></div>
        
        <div><label className={labelClass}>Cód. Contable</label><input name="codigo_contable" value={formData.codigo_contable} onChange={handleChange} className={inputClass} placeholder="OPCIONAL" /></div>
        <div><label className={labelClass}>Cód. Patrimonial</label><input name="codigo_patrimonial" value={formData.codigo_patrimonial} onChange={handleChange} className={inputClass} placeholder="OPCIONAL" /></div>
        <div><label className={`${labelClass} text-emerald-400`}>Denominación *</label><input required name="denominacion" value={formData.denominacion} onChange={handleChange} className={`${inputClass} border-emerald-900/30 font-black`} /></div>
        <div><label className={labelClass}>Marca *</label><input required name="marca" value={formData.marca} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Modelo *</label><input required name="modelo" value={formData.modelo} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>N° de Serie *</label><input required name="serie" value={formData.serie} onChange={handleChange} className={`${inputClass} font-mono tracking-widest`} /></div>
        <div><label className={labelClass}>Tipo / Clase</label><input name="tipo" value={formData.tipo} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Color *</label><input required name="color" value={formData.color} onChange={handleChange} className={inputClass} /></div>
        <div><label className={labelClass}>Medida</label><input name="medida" value={formData.medida} onChange={handleChange} className={inputClass} /></div>

        <div className="md:col-span-1">
          <label className={`${labelClass} text-orange-400`}>Estado Actual *</label>
          <select required name="estado" value={formData.estado} onChange={handleChange} className={`${inputClass} border-orange-900/30 font-black text-orange-400`}>
            <option value="NUEVO">NUEVO</option><option value="BUENO">BUENO</option><option value="REGULAR">REGULAR</option><option value="MALO">MALO</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Observaciones</label>
          <input name="observaciones" value={formData.observaciones} onChange={handleChange} className={inputClass} placeholder="EJ: SIN CABLE DE PODER, PANTALLA RAYADA..." />
        </div>

        <div className="md:col-span-3 flex flex-col md:flex-row justify-end gap-3 mt-4 pt-4 border-t border-gray-800">
          <button type="button" onClick={onClose} className="w-full md:w-auto px-6 py-2.5 bg-gray-800 rounded-xl text-[10px] font-bold uppercase transition-all">Cancelar</button>
          <button type="submit" disabled={loading} className="w-full md:w-auto px-10 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase shadow-lg transition-all">
            <RiSave3Line size={18} className="inline mr-1"/> {loading ? 'PROCESANDO...' : 'GUARDAR REGISTRO'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InventarioInformaticaForm;