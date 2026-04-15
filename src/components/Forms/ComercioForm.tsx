// src/components/Forms/ComercioForm.tsx
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from '../../supabaseClient';
import type { Comercio } from '../../types';
import { RiCloseLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

interface ComercioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: () => void;
  comercioData?: Comercio | null;
  currentYearContext: string; // <--- NUEVA PROP: Recibe el año (2025, 2026)
}

const initialState = {
  numero_autorizacion: '', 
  nombres: '', 
  apellidos: '', 
  giro: '', 
  ubicacion: '',
  tipo_comercio: 'ESTÁTICO', 
  turno: 'MAÑANA', 
  domicilio: '', 
  dni: '', 
  telefono: '',
  fecha_expedicion: '', 
  fecha_caducidad: '', 
  horario: '',
};

const ComercioForm = ({ isOpen, onClose, onFormSubmit, comercioData, currentYearContext }: ComercioFormProps) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState(initialState);
  
  // Estado para el número temporal (ej: el "123" de "123-2026")
  const [tempAuthNumber, setTempAuthNumber] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditMode = !!comercioData;

  useEffect(() => {
    if (isEditMode && isOpen && comercioData) {
      // MODO EDICIÓN: Cargamos datos existentes
      setFormData({
        ...initialState,
        ...comercioData,
        fecha_expedicion: comercioData.fecha_expedicion || '', 
        fecha_caducidad: comercioData.fecha_caducidad || '',
        telefono: comercioData.telefono || '',
        numero_autorizacion: comercioData.numero_autorizacion || '',
      });

      // Extraer el número temporal si existe (ej: "045" de "045-2025")
      if (comercioData.numero_autorizacion_temporal) {
        const parts = comercioData.numero_autorizacion_temporal.split('-');
        if (parts.length >= 1) {
            setTempAuthNumber(parts[0]);
        }
      }
    } else {
      // MODO CREACIÓN: Limpiamos
      setFormData(initialState);
      setTempAuthNumber('');
    }
  }, [comercioData, isOpen, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Construimos la autorización temporal forzando el año actual del contexto
    const authTemporalFinal = tempAuthNumber ? `${tempAuthNumber}-${currentYearContext}` : null;

    const { id, created_at, updated_at, qr_code_url, correlativo, numero_autorizacion, anio, ...restData } = formData as Comercio;
    
    // 2. Datos base a guardar
    let submitData: any = { 
        ...restData, 
        numero_autorizacion_temporal: authTemporalFinal,
        fecha_expedicion: formData.fecha_expedicion === '' ? null : formData.fecha_expedicion,
        fecha_caducidad: formData.fecha_caducidad === '' ? null : formData.fecha_caducidad,
        anio: currentYearContext // <--- GUARDAMOS EL AÑO EN QUE ESTAMOS
    };

    try {
        if (isEditMode) {
          // --- EDICIÓN ---
          await supabase
            .from('comercios_ambulatorios')
            .update(submitData)
            .eq('id', comercioData!.id);
        } else {
          // --- CREACIÓN (Lógica Inteligente de Correlativo por Año) ---
          
          // A. Capturamos usuario
          const userEmail = session?.user.email || 'Sistema';
          submitData.usuario_registro = userEmail.split('@')[0];

          // B. Calculamos el siguiente número AUTOMÁTICO para ESTE año
          // Buscamos el último registro SOLO del año actual (ej: 2026)
          const { data: lastRecord } = await supabase
            .from('comercios_ambulatorios')
            .select('numero_autorizacion')
            .eq('anio', currentYearContext) 
            .order('numero_autorizacion', { ascending: false })
            .limit(1)
            .single();

          let nextNum = 1;
          if (lastRecord && lastRecord.numero_autorizacion) {
             // Si el último fue "005", el siguiente es 6
             const currentNum = parseInt(lastRecord.numero_autorizacion, 10);
             if (!isNaN(currentNum)) nextNum = currentNum + 1;
          }

          // C. Formateamos a 3 dígitos ("001")
          submitData.numero_autorizacion = nextNum.toString().padStart(3, '0');

          // D. Guardamos
          const { error: insertError } = await supabase
            .from('comercios_ambulatorios')
            .insert([submitData]);
          
          if (insertError) throw insertError;
        }

        onFormSubmit();
        onClose();

    } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || 'Error al guardar');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white p-8 rounded-lg max-w-2xl w-full mx-auto my-16 shadow-lg outline-none flex flex-col max-h-[90vh]"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-2xl font-bold">{isEditMode ? 'Editar Comerciante' : 'Registrar Nuevo Comerciante'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><RiCloseLine size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto pr-4 custom-scrollbar flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Columna Izquierda */}
          <div>
            <label className="block text-sm font-medium text-blue-400 mb-1">N° Aut. Temporal</label>
            <div className="flex items-center mb-4 h-[42px]">
                <input 
                    type="number" 
                    value={tempAuthNumber} 
                    onChange={(e) => setTempAuthNumber(e.target.value)} 
                    className="w-2/3 h-full bg-[#27282F] rounded-l-lg p-2 border border-r-0 border-gray-600 focus:ring-blue-500 text-right font-bold text-white placeholder-gray-500" 
                    placeholder="000" 
                />
                
                {/* --- AQUI ESTA EL CAMBIO: AÑO FIJO --- */}
                <div className="w-1/3 h-full flex items-center justify-center bg-gray-800 border border-l-0 border-gray-600 rounded-r-lg px-2">
                    <span className="text-gray-400 font-bold select-none">- {currentYearContext}</span>
                </div>
            </div>

            <label className="block text-sm font-medium text-gray-400">N° Autorización (Automático)</label>
            <input 
                type="text" 
                disabled 
                value={isEditMode && comercioData?.numero_autorizacion 
                    ? comercioData.numero_autorizacion 
                    : ''
                } 
                placeholder={`Se generará para ${currentYearContext}`}
                className="w-full mt-1 bg-[#1a1b20] rounded-lg p-2 border border-gray-700 text-gray-500 cursor-not-allowed italic mb-4" 
            />

            <label className="block text-sm font-medium text-gray-400">Nombres</label>
            <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />
            
            <label className="block text-sm font-medium text-gray-400">Apellidos</label>
            <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />
            
            <label className="block text-sm font-medium text-gray-400">DNI</label>
            <input type="text" name="dni" value={formData.dni} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />

            <label className="block text-sm font-medium text-gray-400">Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500" />
          </div>

          {/* Columna Derecha */}
          <div>
            {/* ... resto de campos (Giro, Ubicación, etc) igual que antes ... */}
            <label className="block text-sm font-medium text-gray-400">Giro</label>
            <input type="text" name="giro" value={formData.giro} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />

            <label className="block text-sm font-medium text-gray-400">Ubicación</label>
            <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />

            <label className="block text-sm font-medium text-gray-400">Domicilio</label>
            <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 focus:ring-red-500 mb-4" required />
            
            <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">F. Expedición</label>
                    <input type="date" name="fecha_expedicion" value={formData.fecha_expedicion} onChange={handleChange} className="w-full bg-[#27282F] rounded-lg p-2 border border-gray-600 text-white text-sm focus:ring-blue-500" />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">F. Caducidad</label>
                    <input type="date" name="fecha_caducidad" value={formData.fecha_caducidad} onChange={handleChange} className="w-full bg-[#27282F] rounded-lg p-2 border border-gray-600 text-white text-sm focus:ring-red-500" required />
                </div>
            </div>

            <label className="block text-sm font-medium text-gray-400">Horario</label>
            <input type="text" name="horario" value={formData.horario} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600 mb-4" placeholder="Ej: 9:00 AM - 5:00 PM" required />

            <label className="block text-sm font-medium text-gray-400">Tipo de Comercio</label>
            <div className="flex gap-4 mt-2 mb-4">
              <label className="flex items-center cursor-pointer">
                  <input type="radio" name="tipo_comercio" value="ESTÁTICO" checked={formData.tipo_comercio === 'ESTÁTICO'} onChange={handleRadioChange} className="mr-2 text-red-500 focus:ring-red-500"/> Estático
              </label>
              <label className="flex items-center cursor-pointer">
                  <input type="radio" name="tipo_comercio" value="MÓVIL" checked={formData.tipo_comercio === 'MÓVIL'} onChange={handleRadioChange} className="mr-2 text-red-500 focus:ring-red-500"/> Móvil
              </label>
            </div>
            
            <label className="block text-sm font-medium text-gray-400">Turno</label>
            <select name="turno" value={formData.turno} onChange={handleChange} className="w-full mt-1 bg-[#27282F] rounded-lg p-2 border border-gray-600">
                <option value="MAÑANA">Mañana</option>
                <option value="TARDE">Tarde</option>
                <option value="NOCHE">Noche</option>
                <option value="MAÑANA-TARDE">Mañana-Tarde</option>
                <option value="TARDE-NOCHE">Tarde-Noche</option>
                <option value="MAÑANA-TARDE-NOCHE">Todo el día</option>
            </select>
          </div>
        </div>
        {error && <p className="text-red-500 mt-4 text-sm text-center font-bold bg-red-500/10 p-2 rounded">{error}</p>}
        
        <div className="mt-6 flex justify-end gap-4 shrink-0">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold transition-colors">
            {loading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ComercioForm;