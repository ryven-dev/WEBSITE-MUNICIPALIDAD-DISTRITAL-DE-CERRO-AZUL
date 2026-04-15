// src/pages/Social/AlumnosVacacionesPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import type { AlumnoVacaciones, Taller } from '../../types';
import { 
    RiAddLine, RiPencilLine, RiSearchLine, RiFileExcel2Line, 
    RiBasketballLine, RiAwardLine, RiLoader4Line, RiFolderZipLine 
} from 'react-icons/ri';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Librerías para PDF y ZIP
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

import AlumnoForm from '../../components/Forms/AlumnoForm';
import DiplomaPreviewModal from '../../components/Modals/DiplomaPreviewModal';
// Ruta corregida según tu estructura de carpetas
import DiplomaDesign from '../../components/PDF/DiplomaDesign'; 

const AlumnosVacacionesPage = () => {
  const { userArea } = useAuth();
  
  const [alumnos, setAlumnos] = useState<AlumnoVacaciones[]>([]);
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTaller, setFilterTaller] = useState('TODOS');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [alumnoToEdit, setAlumnoToEdit] = useState<AlumnoVacaciones | null>(null);

  // Estados Diplomas (Individual)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  // --- ESTADOS PARA GENERACIÓN MASIVA (ZIP) ---
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [tempBulkName, setTempBulkName] = useState('');
  const bulkPrintRef = useRef<HTMLDivElement>(null);

  // --- CARGA DE DATOS ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const { data: talleresData } = await supabase.from('vacaciones_talleres').select('*');
        if (talleresData) setTalleres(talleresData);

        const { data: alumnosData, error } = await supabase
          .from('vacaciones_alumnos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const { data: inscripcionesData } = await supabase
          .from('vacaciones_inscripciones')
          .select('alumno_id, vacaciones_talleres(nombre)');

        const alumnosCompletos = alumnosData.map(alumno => {
            const inscripciones = inscripcionesData?.filter((i: any) => i.alumno_id === alumno.id) || [];
            const nombresTalleres = inscripciones.map((i: any) => i.vacaciones_talleres?.nombre);
            
            return {
                ...alumno,
                talleres_inscritos: nombresTalleres
            };
        });

        setAlumnos(alumnosCompletos);
    } catch (error) {
        toast.error('Error cargando datos');
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- FILTRADO ---
  const filteredData = alumnos.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = item.nombre_completo_nino.toLowerCase().includes(term) || 
                          item.nombre_apoderado.toLowerCase().includes(term);
    const matchesTaller = filterTaller === 'TODOS' || item.talleres_inscritos?.includes(filterTaller);

    return matchesSearch && matchesTaller;
  });

  // --- GENERAR PDFs INDIVIDUALES EN UN ZIP ---
  const handleBulkDiplomasZip = async () => {
    if (filteredData.length === 0) return toast.error("No hay alumnos en la lista");
    
    const confirmGen = window.confirm(`Se generarán ${filteredData.length} archivos PDF independientes dentro de un ZIP. ¿Continuar?`);
    if (!confirmGen) return;

    setIsGeneratingBulk(true);
    const zip = new JSZip(); 
    const toastId = toast.loading('Iniciando proceso masivo...');

    try {
        for (let i = 0; i < filteredData.length; i++) {
            const alumno = filteredData[i];
            const nombreLimpio = alumno.nombre_completo_nino.toUpperCase().trim();
            
            // 1. Cambiamos el nombre en el componente invisible
            setTempBulkName(nombreLimpio);

            // 2. Pausa técnica para que React pinte el nombre
            await new Promise(r => setTimeout(r, 150));

            if (bulkPrintRef.current) {
                // 3. Captura de imagen
                const canvas = await html2canvas(bulkPrintRef.current, { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.8);

                // 4. Crear PDF individual (A4 Horizontal)
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

                // 5. Agregar al ZIP (Limpiamos el nombre de caracteres prohibidos en archivos)
                const pdfBlob = pdf.output('blob');
                const fileName = `${nombreLimpio.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
                zip.file(fileName, pdfBlob);
            }

            // Progreso visual
            if ((i + 1) % 5 === 0) {
                toast.loading(`Procesando: ${i + 1} de ${filteredData.length}...`, { id: toastId });
            }
        }

        // 6. Generar y descargar el ZIP
        toast.loading('Comprimiendo carpeta...', { id: toastId });
        const zipContent = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `Diplomas_${filterTaller}_${new Date().getTime()}.zip`;
        link.click();

        toast.success(`¡Éxito! ${filteredData.length} PDFs descargados.`, { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error('Error al generar el paquete ZIP', { id: toastId });
    } finally {
        setIsGeneratingBulk(false);
        setTempBulkName('');
    }
  };

  // --- EXPORTAR A EXCEL ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map((c, index) => ({
        "N°": index + 1,
        "Nombre Niño": c.nombre_completo_nino,
        "Edad": c.edad,
        "Celular Niño": c.celular_nino || '-',
        "Nombre Apoderado": c.nombre_apoderado,
        "Talleres": c.talleres_inscritos?.join(', '),
        "Opción SABE": c.sabe_opcion
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnos");
    XLSX.writeFile(workbook, `Padron_Vacaciones_${filterTaller}.xlsx`);
  };

  const canEdit = userArea === 'ADMIN' || userArea === 'DESARROLLO_SOCIAL';
  const headerStyle = "px-3 py-3 border border-gray-600 bg-[#27282F] text-gray-200 uppercase text-center font-bold tracking-wider text-[10px]";
  const cellStyle = "px-3 py-2 border border-gray-700 align-middle text-[11px]";

  return (
    <div className="p-4">
      {/* --- ELEMENTO OCULTO PARA CAPTURA (DIPLOMA TEMPORAL) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={bulkPrintRef} style={{ width: '1122px', height: '794px' }}>
            <DiplomaDesign nombre={tempBulkName} />
        </div>
      </div>

      <AlumnoForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onFormSubmit={fetchData} 
        dataToEdit={alumnoToEdit} 
        talleresDisponibles={talleres} 
      />

      <DiplomaPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        nombre={selectedName} 
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><RiBasketballLine size={24} /></div>
            <div>
                <h1 className="text-2xl font-bold text-white leading-none">Alumnos Inscritos</h1>
                <p className="text-xs text-gray-400 mt-1">Diviértete y Aprende 2025</p>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
            <div className="bg-[#27282F] text-gray-300 text-xs px-3 py-2 rounded border border-gray-600 font-mono">
                Total: <span className="text-white font-bold">{filteredData.length}</span>
            </div>

            <select 
                value={filterTaller} 
                onChange={(e) => setFilterTaller(e.target.value)} 
                className="bg-[#1E1F25] text-white text-xs rounded px-2 py-2 border border-gray-600 outline-none"
            >
                <option value="TODOS">Todos los Talleres</option>
                {talleres.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>

            <div className="relative">
                <RiSearchLine className="absolute left-2 top-2.5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Buscar alumno..." 
                    className="bg-[#1E1F25] text-white text-xs rounded pl-8 pr-2 py-2 border border-gray-600 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* BOTÓN DESCARGA ZIP */}
            <button 
                onClick={handleBulkDiplomasZip} 
                disabled={isGeneratingBulk || filteredData.length === 0}
                className={`text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all ${
                    isGeneratingBulk ? 'bg-yellow-700 opacity-70 cursor-wait' : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
            >
                {isGeneratingBulk ? <RiLoader4Line className="animate-spin" /> : <RiFolderZipLine />}
                {isGeneratingBulk ? 'Procesando...' : 'Diplomas Masivos (ZIP)'}
            </button>

            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2">
                <RiFileExcel2Line /> Excel
            </button>
            
            {canEdit && (
                <button 
                    onClick={() => { setAlumnoToEdit(null); setIsFormOpen(true); }} 
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                    <RiAddLine /> Inscribir
                </button>
            )}
        </div>
      </div>

      {!loading ? (
        <div className="bg-[#1E1F25] rounded border border-gray-600 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-gray-300 border-collapse">
            <thead>
              <tr className="bg-[#27282F]">
                <th className={headerStyle}>#</th>
                <th className={headerStyle}>Nombre del Niño</th>
                <th className={headerStyle}>Edad</th>
                <th className={headerStyle}>Cel. Niño</th>
                <th className={headerStyle}>Apoderado</th>
                <th className={headerStyle}>Cel. Apoderado</th>
                <th className={headerStyle}>Talleres Inscritos</th>
                <th className={headerStyle}>SABE</th>
                <th className={headerStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#2a2b33] transition-colors border-b border-gray-700">
                    <td className={`${cellStyle} text-center font-mono text-gray-500`}>{index + 1}</td>
                    <td className={`${cellStyle} font-bold text-white uppercase`}>{item.nombre_completo_nino}</td>
                    <td className={`${cellStyle} text-center`}>{item.edad}</td>
                    <td className={`${cellStyle} text-center`}>{item.celular_nino || '-'}</td>
                    <td className={`${cellStyle}`}>{item.nombre_apoderado}</td>
                    <td className={`${cellStyle} text-center`}>{item.celular_apoderado}</td>
                    <td className={`${cellStyle}`}>
                        <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                            {item.talleres_inscritos?.map((t, i) => (
                                <span key={i} className="bg-blue-900/30 text-blue-200 px-2 py-0.5 rounded text-[9px] border border-blue-500/20">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className={`${cellStyle} text-center`}>
                        {item.sabe_opcion !== 'NINGUNO' && (
                            <span className="text-yellow-400 font-bold text-[9px] bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-500/50 block">
                                {item.sabe_opcion}
                            </span>
                        )}
                    </td>
                    <td className={`${cellStyle} text-center`}>
                        <div className="flex justify-center gap-2">
                            <button 
                                onClick={() => { setSelectedName(item.nombre_completo_nino.toUpperCase()); setIsPreviewOpen(true); }} 
                                className="text-yellow-400 hover:text-yellow-300 p-1"
                                title="Diploma Individual"
                            >
                                <RiAwardLine size={18} />
                            </button>
                            {canEdit && (
                                <button 
                                    onClick={() => { setAlumnoToEdit(item); setIsFormOpen(true); }} 
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                    title="Editar"
                                >
                                    <RiPencilLine size={18} />
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="p-8 text-center text-gray-500">No se encontraron alumnos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">Cargando registros...</div>
      )}
    </div>
  );
};

export default AlumnosVacacionesPage;