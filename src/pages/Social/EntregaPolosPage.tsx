// src/pages/Social/EntregaPolosPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import type { AlumnoVacaciones } from '../../types';
import { 
  RiSearchLine, RiShirtLine, RiCameraLine, RiCheckDoubleLine, RiLoader4Line, RiImageLine,
  RiFilter3Line 
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import FileViewerModal from '../../components/Modals/FileViewerModal';

const EntregaPolosPage = () => {
  const [alumnos, setAlumnos] = useState<AlumnoVacaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADO DEL FILTRO (TODOS, PENDIENTES, ENTREGADOS)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentFoto, setCurrentFoto] = useState('');

  const fetchData = useCallback(async () => {
    const { data: alumnosData, error } = await supabase
      .from('vacaciones_alumnos')
      .select('*, vacaciones_inscripciones(vacaciones_talleres(nombre))')
      .order('nombre_completo_nino', { ascending: true });

    if (error) { toast.error('Error al cargar lista'); setLoading(false); return; }

    const formatted = alumnosData.map((a: any) => ({
      ...a,
      talleres_inscritos: a.vacaciones_inscripciones.map((i: any) => i.vacaciones_talleres.nombre)
    }));

    setAlumnos(formatted);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>, alumnoId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(alumnoId);
    const toastId = toast.loading('Subiendo evidencia...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `polo_${alumnoId}_${Date.now()}.${fileExt}`;
      const filePath = `evidencias_polos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('vacaciones_alumnos').update({ polo_entregado: true, foto_entrega_url: urlData.publicUrl }).eq('id', alumnoId);
      if (dbError) throw dbError;

      toast.success('¡Polo entregado con éxito!', { id: toastId });
      setAlumnos(prev => prev.map(a => a.id === alumnoId ? { ...a, polo_entregado: true, foto_entrega_url: urlData.publicUrl } : a));

    } catch (error) {
      console.error(error); toast.error('Error al guardar', { id: toastId });
    } finally {
      setUploadingId(null); event.target.value = '';
    }
  };

  // --- LÓGICA DE FILTRADO COMBINADO ---
  const filteredData = alumnos.filter(a => {
    const matchesSearch = a.nombre_completo_nino.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'PENDING') matchesStatus = !a.polo_entregado; // Solo los false
    if (filterStatus === 'DELIVERED') matchesStatus = a.polo_entregado === true; // Solo los true

    return matchesSearch && matchesStatus;
  });

  // Calcular contadores para los botones
  const countPending = alumnos.filter(a => !a.polo_entregado).length;
  const countDelivered = alumnos.filter(a => a.polo_entregado).length;

  return (
    <div className="p-4 pb-24"> 
      <FileViewerModal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} fileUrl={currentFoto} fileName="Evidencia de Entrega" />

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <RiShirtLine className="text-green-400" /> Entrega de Polos
        </h1>
      </div>

      {/* --- BARRA DE FILTROS (TABS) --- */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                filterStatus === 'ALL' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-[#1E1F25] text-gray-400 border-gray-700 hover:text-white'
            }`}
        >
            Todos ({alumnos.length})
        </button>
        <button 
            onClick={() => setFilterStatus('PENDING')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                filterStatus === 'PENDING' 
                ? 'bg-red-600 text-white border-red-600' 
                : 'bg-[#1E1F25] text-gray-400 border-gray-700 hover:text-white'
            }`}
        >
            Faltan ({countPending})
        </button>
        <button 
            onClick={() => setFilterStatus('DELIVERED')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                filterStatus === 'DELIVERED' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-[#1E1F25] text-gray-400 border-gray-700 hover:text-white'
            }`}
        >
            Entregados ({countDelivered})
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><RiSearchLine className="text-gray-400 text-lg" /></div>
        <input 
            type="text" 
            className="w-full bg-[#1E1F25] text-white text-lg rounded-xl pl-10 p-3 border border-gray-600 focus:ring-green-500 focus:border-green-500 outline-none shadow-lg placeholder-gray-500"
            placeholder="Buscar alumno..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
            <div className="text-center text-gray-500 col-span-full py-10">Cargando lista...</div>
        ) : filteredData.length > 0 ? (
            filteredData.map((alumno) => (
                <div key={alumno.id} className={`p-4 rounded-xl border-l-4 shadow-md transition-all ${alumno.polo_entregado ? 'bg-[#1a2e1a] border-green-500' : 'bg-[#1E1F25] border-gray-600'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-white font-bold text-lg leading-tight">{alumno.nombre_completo_nino}</h3>
                            <p className="text-gray-400 text-sm mt-1">Edad: {alumno.edad} años</p>
                        </div>
                        {alumno.polo_entregado ? (
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><RiCheckDoubleLine /> Entregado</span>
                        ) : (
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase">Falta</span>
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                        {alumno.talleres_inscritos?.map((t, i) => (
                            <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{t}</span>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-3">
                        {alumno.polo_entregado && alumno.foto_entrega_url && (
                            <button onClick={() => { setCurrentFoto(alumno.foto_entrega_url!); setIsViewerOpen(true); }} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm bg-black/20 px-3 py-2 rounded-lg">
                                <RiImageLine /> Ver Evidencia
                            </button>
                        )}
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold cursor-pointer transition-all shadow-lg select-none ${uploadingId === alumno.id ? 'opacity-50 cursor-wait' : ''} ${alumno.polo_entregado ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'}`}>
                            {uploadingId === alumno.id ? <RiLoader4Line className="animate-spin text-xl" /> : <RiCameraLine className="text-xl" />}
                            <span className="text-sm">{alumno.polo_entregado ? 'Cambiar Foto' : 'Entregar Polo'}</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" disabled={uploadingId === alumno.id} onChange={(e) => handleCameraCapture(e, alumno.id)} />
                        </label>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center text-gray-500 col-span-full py-10 flex flex-col items-center">
                <RiFilter3Line size={40} className="mb-2 opacity-50" />
                <p>No hay alumnos en esta categoría.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default EntregaPolosPage;