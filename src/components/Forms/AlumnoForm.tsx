import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { supabase } from '../../supabaseClient';
import type { AlumnoVacaciones, Taller } from '../../types';
import { RiCloseLine, RiSave3Line } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

interface AlumnoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: () => void;
  dataToEdit?: AlumnoVacaciones | null;
  talleresDisponibles: Taller[];
}

const initialState = {
  nombre_completo_nino: '',
  edad: '',
  celular_nino: '',
  nombre_apoderado: '',
  celular_apoderado: '',
  sabe_opcion: 'NINGUNO'
};

const AlumnoForm = ({ isOpen, onClose, onFormSubmit, dataToEdit, talleresDisponibles }: AlumnoFormProps) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [selectedTalleres, setSelectedTalleres] = useState<string[]>([]); // IDs de talleres seleccionados
  const [loading, setLoading] = useState(false);

  const isEditMode = !!dataToEdit;

  useEffect(() => {
    if (isEditMode && isOpen && dataToEdit) {
      setFormData({
        nombre_completo_nino: dataToEdit.nombre_completo_nino,
        edad: dataToEdit.edad.toString(),
        celular_nino: dataToEdit.celular_nino || '',
        nombre_apoderado: dataToEdit.nombre_apoderado,
        celular_apoderado: dataToEdit.celular_apoderado,
        sabe_opcion: dataToEdit.sabe_opcion
      });
      // Cargar talleres ya inscritos
      setSelectedTalleres(dataToEdit.talleres_ids || []);
    } else {
      setFormData(initialState);
      setSelectedTalleres([]);
    }
  }, [dataToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTallerToggle = (tallerId: string) => {
    setSelectedTalleres(prev => 
      prev.includes(tallerId) 
        ? prev.filter(id => id !== tallerId) 
        : [...prev, tallerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userEmail = session?.user.email || 'Sistema';

    const alumnoData = {
        nombre_completo_nino: formData.nombre_completo_nino,
        edad: parseInt(formData.edad),
        celular_nino: formData.celular_nino || null,
        nombre_apoderado: formData.nombre_apoderado,
        celular_apoderado: formData.celular_apoderado,
        sabe_opcion: formData.sabe_opcion,
        usuario_registro: userEmail.split('@')[0]
    };

    try {
        let alumnoId = dataToEdit?.id;

        if (isEditMode && alumnoId) {
            // 1. Actualizar Alumno
            await supabase.from('vacaciones_alumnos').update(alumnoData).eq('id', alumnoId);
            
            // 2. Limpiar inscripciones anteriores
            await supabase.from('vacaciones_inscripciones').delete().eq('alumno_id', alumnoId);
        } else {
            // 1. Crear Alumno
            const { data, error } = await supabase.from('vacaciones_alumnos').insert([alumnoData]).select();
            if (error) throw error;
            alumnoId = data[0].id;
        }

        // 3. Crear nuevas inscripciones (para ambos casos)
        if (selectedTalleres.length > 0 && alumnoId) {
            const inscripciones = selectedTalleres.map(tallerId => ({
                alumno_id: alumnoId,
                taller_id: tallerId
            }));
            await supabase.from('vacaciones_inscripciones').insert(inscripciones);
        }

        onFormSubmit();
        onClose();

    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white rounded-lg max-w-2xl w-full mx-4 shadow-2xl outline-none border border-gray-700 max-h-[90vh] flex flex-col"
      overlayClassName="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
    >
      <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0 bg-[#1E1F25] rounded-t-lg z-10">
        <h2 className="text-2xl font-bold">{isEditMode ? 'Editar Alumno' : 'Inscribir Alumno'}</h2>
        <button onClick={onClose}><RiCloseLine size={28} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2">
            <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Datos del Niño</h3>
        </div>
        
        <div className="md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Nombre Completo</label>
            <input type="text" name="nombre_completo_nino" value={formData.nombre_completo_nino} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" required />
        </div>
        <div className="md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Edad</label>
            <input type="number" name="edad" value={formData.edad} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" required />
        </div>
        <div className="md:col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Celular Niño (Opcional)</label>
            <input type="text" name="celular_nino" value={formData.celular_nino} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" />
        </div>

        <div className="md:col-span-2 mt-2">
            <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Datos del Apoderado</h3>
        </div>

        <div className="md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Nombre Apoderado</label>
            <input type="text" name="nombre_apoderado" value={formData.nombre_apoderado} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" required />
        </div>
        <div className="md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Celular Apoderado</label>
            <input type="text" name="celular_apoderado" value={formData.celular_apoderado} onChange={handleChange} className="w-full bg-[#27282F] rounded p-2 border border-gray-600" required />
        </div>

        <div className="md:col-span-2 mt-2">
            <h3 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Información Adicional</h3>
        </div>

        <div className="md:col-span-1">
            <label className="text-xs text-gray-400 block mb-1">Opción SABE</label>
            <select name="sabe_opcion" value={formData.sabe_opcion} onChange={handleChange} className="w-full bg-[#27282F] text-white rounded p-2 border border-gray-600">
                <option value="NINGUNO">Ninguno</option>
                <option value="SABE COAR">SABE COAR</option>
                <option value="SABE BECA 18">SABE BECA 18</option>
            </select>
        </div>

        <div className="md:col-span-2">
            <label className="text-xs text-gray-400 block mb-2">Seleccione Talleres:</label>
            <div className="grid grid-cols-2 gap-2 bg-[#27282F] p-3 rounded border border-gray-600 h-40 overflow-y-auto custom-scrollbar">
                {talleresDisponibles.map((taller) => (
                    <label key={taller.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                        <input 
                            type="checkbox" 
                            checked={selectedTalleres.includes(taller.id)}
                            onChange={() => handleTallerToggle(taller.id)}
                            className="rounded border-gray-500 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-300">{taller.nombre}</span>
                    </label>
                ))}
            </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 mt-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-2">
                <RiSave3Line size={18} /> {loading ? 'Guardando...' : 'Guardar Inscripción'}
            </button>
        </div>

      </form>
    </Modal>
  );
};

export default AlumnoForm;