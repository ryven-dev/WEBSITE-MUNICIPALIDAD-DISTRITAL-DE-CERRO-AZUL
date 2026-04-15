// src/components/Forms/EstablecidoForm.tsx
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from '../../supabaseClient';
import type { ComercioEstablecido } from '../../types';
import { RiCloseLine, RiSave3Line } from 'react-icons/ri';
import { GIROS_DATA } from '../../data/girosData';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface EstablecidoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: () => void;
  dataToEdit?: ComercioEstablecido | null;
  currentYearContext: string; 
}

const initialState = {
  nro_licencia: '',
  nro_expediente: '',
  ruc: '',
  razon_social: '',
  nombre_comercial: '',
  representante_legal: '',
  direccion: '',
  area_local: '',
  aforo: '',
  giro: '',
  categoria_horario: '',
  horario_atencion: '',
  fecha_emision: '',
  fecha_vencimiento: '',
  telefono: '',
  nro_resolucion: '',
  fecha_resolucion: ''
};

const EstablecidoForm = ({ isOpen, onClose, onFormSubmit, dataToEdit, currentYearContext }: EstablecidoFormProps) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [isIndeterminado, setIsIndeterminado] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [isManualGiro, setIsManualGiro] = useState(false);

  const isEditMode = !!dataToEdit;

  useEffect(() => {
    if (isEditMode && isOpen && dataToEdit) {
      setFormData({
        ...initialState,
        ...dataToEdit,
        area_local: dataToEdit.area_local?.toString() || '',
        aforo: dataToEdit.aforo?.toString() || '',
        fecha_emision: dataToEdit.fecha_emision || '',
        fecha_vencimiento: dataToEdit.fecha_vencimiento || '',
        nro_resolucion: dataToEdit.nro_resolucion || '',
        fecha_resolucion: dataToEdit.fecha_resolucion || ''
      });
      
      if (!dataToEdit.fecha_vencimiento) setIsIndeterminado(true);
      else setIsIndeterminado(false);

      const foundCategory = GIROS_DATA.find(c => c.giros.includes(dataToEdit.giro));
      if (foundCategory) {
        setSelectedCategoria(foundCategory.categoria);
        setIsManualGiro(false);
      } else {
        if (dataToEdit.categoria_horario) setSelectedCategoria(dataToEdit.categoria_horario);
        setIsManualGiro(true);
      }
    } else {
      // RESETEAR TODO AL ABRIR NUEVO
      setFormData(initialState);
      setIsIndeterminado(true);
      setSelectedCategoria('');
      setIsManualGiro(false);
    }
  }, [dataToEdit, isOpen, isEditMode]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setSelectedCategoria(cat);
    
    // Auto-llenar horario
    const categoryData = GIROS_DATA.find(c => c.categoria === cat);
    const defaultHorario = categoryData ? categoryData.horario : '';

    setFormData(prev => ({ ...prev, giro: '', horario_atencion: defaultHorario }));
    setIsManualGiro(false);
  };

  const handleGiroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoGiro = e.target.value;
    
    if (nuevoGiro === 'OTRO') {
        setIsManualGiro(true);
        setFormData(prev => ({ ...prev, giro: '' })); 
    } else {
        setIsManualGiro(false);
        const categoryData = GIROS_DATA.find(c => c.categoria === selectedCategoria);
        setFormData(prev => ({
            ...prev,
            giro: nuevoGiro,
            horario_atencion: categoryData ? categoryData.horario : prev.horario_atencion
        }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA DE GUARDADO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submitData: any = {
        ...formData,
        area_local: formData.area_local ? parseFloat(formData.area_local) : null,
        aforo: formData.aforo ? parseInt(formData.aforo) : null,
        fecha_vencimiento: isIndeterminado ? null : formData.fecha_vencimiento,
        fecha_emision: formData.fecha_emision || null,
        fecha_resolucion: formData.fecha_resolucion || null,
        categoria_horario: selectedCategoria,
        anio: currentYearContext
    };

    if (!isEditMode) {
         const userEmail = session?.user.email || 'Sistema';
         submitData.usuario_registro = userEmail.split('@')[0];
    }

    const { id, ...dataToSend } = submitData; 

    try {
        if (isEditMode && dataToEdit) {
            // --- EDICIÓN ---
            const { error } = await supabase.from('comercios_establecidos').update(dataToSend).eq('id', dataToEdit.id);
            if (error) throw error;
            toast.success('Licencia actualizada correctamente');

        } else {
            // --- CREACIÓN ---
            // AQUÍ es donde se genera el número, justo al guardar.
            
            // 1. Buscamos TODOS los números de este año
            const { data: existingLicenses, error: fetchError } = await supabase
                .from('comercios_establecidos')
                .select('nro_licencia')
                .eq('anio', currentYearContext);

            if (fetchError) throw fetchError;

            // 2. Calculamos el máximo
            let maxNum = 0;
            if (existingLicenses && existingLicenses.length > 0) {
                existingLicenses.forEach(item => {
                    if (item.nro_licencia) {
                        const parts = item.nro_licencia.split('-'); // "0001-2026"
                        if (parts.length > 0) {
                            const num = parseInt(parts[0], 10);
                            if (!isNaN(num) && num > maxNum) maxNum = num;
                        }
                    }
                });
            }

            // 3. El siguiente es máximo + 1
            const nextNum = maxNum + 1;
            const correlativoStr = nextNum.toString().padStart(4, '0');
            
            // 4. Asignamos el número final
            dataToSend.nro_licencia = `${correlativoStr}-${currentYearContext}`;

            // 5. Insertar
            const { error: insertError } = await supabase.from('comercios_establecidos').insert([dataToSend]);
            
            if (insertError) {
                if (insertError.code === '23505') {
                    toast.error('Hubo un conflicto de numeración. Por favor intente guardar de nuevo.');
                    setLoading(false);
                    return; 
                }
                throw insertError; 
            }
            toast.success(`Licencia generada: ${dataToSend.nro_licencia}`);
        }

        onFormSubmit();
        onClose();

    } catch (error: any) {
        console.error("Error saving:", error);
        toast.error("Error al guardar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white rounded-lg max-w-4xl w-full mx-4 shadow-2xl outline-none border border-gray-700 max-h-[90vh] flex flex-col"
      overlayClassName="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
    >
      <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0 bg-[#1E1F25] rounded-t-lg z-10">
        <div>
            <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Editar Licencia' : 'Nueva Licencia'}</h2>
            <p className="text-sm text-gray-400">Año de registro: <span className="text-yellow-400 font-bold">{currentYearContext}</span></p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><RiCloseLine size={28} /></button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        <form id="establecido-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <div className="md:col-span-12">
                <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-2 border-b border-blue-500/30 pb-1">1. Resolución y Licencia</h3>
            </div>

            <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">N° Resolución Sub Gerencial</label>
                <div className="flex items-center">
                    <span className="bg-gray-700 text-gray-300 p-2 rounded-l border border-gray-600 border-r-0 text-sm">Nº</span>
                    <input 
                        type="text" 
                        name="nro_resolucion" 
                        value={formData.nro_resolucion} 
                        onChange={handleChange} 
                        className="w-20 bg-[#27282F] p-2 border-y border-gray-600 focus:border-blue-500 outline-none text-center font-bold" 
                        placeholder="000" 
                    />
                    <span className="bg-gray-700 text-gray-300 p-2 rounded-r border border-gray-600 border-l-0 text-xs truncate flex-1">
                        - {currentYearContext} - SGC-GDETPE-MDCA
                    </span>
                </div>
            </div>

            <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">Fecha de Resolución</label>
                <input type="date" name="fecha_resolucion" value={formData.fecha_resolucion} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600 focus:border-blue-500 text-white scheme-dark" />
            </div>

            <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">N° Licencia (Automático)</label>
                {/* CAMPO DE SOLO LECTURA VISUAL */}
                <input 
                    type="text" 
                    disabled 
                    value={isEditMode ? formData.nro_licencia : ''} // Vacío si es nuevo
                    placeholder="Se generará automáticamente al guardar"
                    className="w-full bg-[#1a1b20] rounded p-2 border border-gray-700 text-gray-500 italic cursor-not-allowed font-mono text-xs placeholder:text-gray-600" 
                />
            </div>

            <div className="md:col-span-12 mt-2">
                <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-2 border-b border-blue-500/30 pb-1">2. Datos del Establecimiento</h3>
            </div>

            <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">N° Expediente</label>
                <input type="text" name="nro_expediente" value={formData.nro_expediente} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" placeholder="Exp. 1234" />
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-400 mb-1">RUC</label>
                <input type="text" name="ruc" value={formData.ruc} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" placeholder="20..." />
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-400 mb-1">Apellidos y nombres ó Razon Social</label>
                <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" />
            </div>
            
            <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-400 mb-1">Nombre Comercial</label>
                <input type="text" name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600 font-semibold" required />
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-400 mb-1">Propietario / Rep. Legal</label>
                <input type="text" name="representante_legal" value={formData.representante_legal} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" />
            </div>

            <div className="md:col-span-8">
                <label className="block text-xs font-medium text-gray-400 mb-1">Ubicación</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" placeholder="Dirección exacta" required />
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Área (m²)</label>
                <input type="number" step="0.01" name="area_local" value={formData.area_local} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Aforo</label>
                <input type="number" name="aforo" value={formData.aforo} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" />
            </div>

            <div className="md:col-span-12 mt-2">
                <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-2 border-b border-green-500/30 pb-1">3. Giro y Horario</h3>
            </div>

            <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-300 mb-1">Categoría</label>
                <select value={selectedCategoria} onChange={handleCategoriaChange} className="w-full bg-[#1a1b20] text-white rounded p-2 border border-gray-600 outline-none">
                    <option value="">-- Seleccione Categoría --</option>
                    {GIROS_DATA.map((item, idx) => (<option key={idx} value={item.categoria}>{item.categoria}</option>))}
                </select>
            </div>
            <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-300 mb-1">Giro Específico</label>
                <select name="giro" value={isManualGiro ? 'OTRO' : formData.giro} onChange={handleGiroChange} className="w-full bg-[#1a1b20] text-white rounded p-2 border border-gray-600 outline-none" disabled={!selectedCategoria}>
                    <option value="">-- Seleccione Giro --</option>
                    {selectedCategoria && GIROS_DATA.find(c => c.categoria === selectedCategoria)?.giros.map((g, idx) => (<option key={idx} value={g}>{g}</option>))}
                    <option value="OTRO">OTRO (Manual)</option>
                </select>
                {isManualGiro && (
                    <input type="text" name="giro" value={formData.giro} placeholder="Especifique el giro manualmente" className="mt-2 w-full bg-[#27282F] rounded p-2 border border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 outline-none" onChange={handleChange} autoFocus />
                )}
            </div>

            <div className="md:col-span-12">
                <label className="block text-xs font-medium text-gray-400 mb-1">Horario de Atención</label>
                <textarea name="horario_atencion" value={formData.horario_atencion} onChange={handleChange} rows={2} className="w-full bg-[#27282F] rounded p-2 border border-gray-600 font-mono text-sm" />
            </div>

            <div className="md:col-span-6 flex items-center gap-2 mt-1">
                 <input type="checkbox" id="indeterminado" checked={isIndeterminado} onChange={(e) => setIsIndeterminado(e.target.checked)} className="w-4 h-4" />
                 <label htmlFor="indeterminado" className="text-sm text-gray-300">Vigencia Indeterminada</label>
            </div>
        </form>
      </div>

      <div className="p-6 border-t border-gray-700 bg-[#1E1F25] rounded-b-lg flex justify-end gap-4 shrink-0 z-10">
        <button onClick={onClose} className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
        <button 
            type="submit" 
            form="establecido-form" 
            disabled={loading} 
            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2"
        >
            <RiSave3Line size={18} />
            {loading ? 'Guardando...' : 'Guardar Licencia'}
        </button>
      </div>
    </Modal>
  );
};

export default EstablecidoForm;