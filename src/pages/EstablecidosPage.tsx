// src/pages/EstablecidosPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { ComercioEstablecido } from '../types';
import { 
  RiAddLine, RiPencilLine, RiDeleteBinLine, RiSearchLine, RiFileExcel2Line, 
  RiStore2Line, RiArrowLeftSLine, RiArrowRightSLine,
  RiUploadCloud2Line, RiFileTextLine, RiCloseCircleLine, RiLoader4Line,
  RiLockLine, RiEyeLine // <--- Usamos RiEyeLine (Ojo)
} from 'react-icons/ri';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

import EstablecidoForm from '../components/Forms/EstablecidoForm';
import ConfirmModal from '../components/Modals/ConfirmModal'; 
import FileViewerModal from '../components/Modals/FileViewerModal';
import LicenciaPreviewModal from '../components/Modals/LicenciaPreviewModal';

const EstablecidosPage = () => {
  const { userRole, session } = useAuth();
  const { anio } = useParams();
  
  const [comercios, setComercios] = useState<ComercioEstablecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const currentUser = session?.user?.email?.split('@')[0] || '';

  // Estados Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Estado para Previsualizar Licencia
  const [previewLicenciaData, setPreviewLicenciaData] = useState<ComercioEstablecido | null>(null);
  const [isPreviewLicenciaOpen, setIsPreviewLicenciaOpen] = useState(false);

  // Estados Visor Archivos (Defensa Civil)
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [itemToEdit, setItemToEdit] = useState<ComercioEstablecido | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchEstablecidos = useCallback(async () => {
    if (!anio) return;
    const { data, error } = await supabase
      .from('comercios_establecidos')
      .select('*')
      .eq('anio', anio)
      .order('nro_licencia', { ascending: true });
      
    if (!error && data) setComercios(data);
    setLoading(false);
  }, [anio]);

  useEffect(() => { fetchEstablecidos(); }, [fetchEstablecidos]);

  // --- HANDLERS ARCHIVOS (DEFENSA CIVIL) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, comercioId: string) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (userRole !== 'admin') { toast.error('Solo administradores pueden subir archivos.'); return; }

    const file = event.target.files[0];
    setUploadingId(comercioId); 

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${comercioId}_defensa_civil_${Date.now()}.${fileExt}`;
        const filePath = `certificados/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('documentos').getPublicUrl(filePath);

        const { error: dbError } = await supabase.from('comercios_establecidos')
            .update({ certificado_url: publicUrlData.publicUrl }).eq('id', comercioId);

        if (dbError) throw dbError;

        toast.success('Certificado subido correctamente');
        fetchEstablecidos();
    } catch (error: any) {
        console.error(error);
        toast.error('Error al subir archivo');
    } finally {
        setUploadingId(null);
        event.target.value = '';
    }
  };

  const handleDeleteCertificado = async (comercioId: string, fileUrl: string) => {
    if (userRole !== 'admin') return toast.error('No tiene permisos.');
    if(!window.confirm("¿Seguro que desea eliminar el certificado?")) return;

    setUploadingId(comercioId);
    try {
        const path = fileUrl.split('/documentos/')[1]; 
        if (path) await supabase.storage.from('documentos').remove([path]);

        const { error } = await supabase.from('comercios_establecidos')
            .update({ certificado_url: null }).eq('id', comercioId);

        if (error) throw error;
        toast.success('Certificado eliminado');
        fetchEstablecidos();
    } catch (error) {
        toast.error('Error al eliminar');
    } finally {
        setUploadingId(null);
    }
  };

  const handleViewCertificado = (url: string, nombreComercial: string) => {
    setCurrentFileUrl(url); setCurrentFileName(`Certificado - ${nombreComercial}`); setIsViewerOpen(true);
  };

  // --- HANDLER: ABRIR PREVISUALIZACIÓN DE LICENCIA ---
  const handleOpenLicenciaPreview = (item: ComercioEstablecido) => {
    setPreviewLicenciaData(item);
    setIsPreviewLicenciaOpen(true);
  };

  // --- FILTRADO ---
  const filteredData = comercios.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nombre = (item.nombre_comercial || item.razon_social || '').toLowerCase();
    const licencia = item.nro_licencia?.toLowerCase() || '';
    const ruc = item.ruc?.toLowerCase() || '';
    return nombre.includes(term) || licencia.includes(term) || ruc.includes(term);
  });

  // --- EXCEL ---
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(c => ({
        "Licencia": c.nro_licencia, "RUC": c.ruc, "Nombre Comercial": c.nombre_comercial, "Razón Social": c.razon_social, "Giro": c.giro, "Dirección": c.direccion, "Área (m2)": c.area_local, "Aforo": c.aforo, "Horario": c.horario_atencion, "Teléfono": c.telefono, "Fecha Emisión": c.fecha_emision, "Vencimiento": c.fecha_vencimiento || 'INDETERMINADO', "Certificado URL": c.certificado_url || 'No adjunto', "Registrado Por": c.usuario_registro || 'fabiola.carbonero'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Establecidos");
    XLSX.writeFile(workbook, `Padron_Establecidos_${anio}.xlsx`);
  };

  // --- PAGINACIÓN ---
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- PERMISOS ---
  const checkOwnership = (registroOwner: string | undefined) => {
    const owner = registroOwner || 'fabiola.carbonero';
    if (userRole === 'admin' && currentUser === 'miguel.romero') return true; 
    if (owner === currentUser) return true;
    toast.error('Solo el propietario puede modificar.', { style: { border: '1px solid #EF4444', color: '#EF4444', background: '#1E1F25' }, icon: '🔒' });
    return false;
  };
  const checkPermission = () => {
    if (userRole !== 'admin') { toast.error('Sin privilegios.', { style: { border: '1px solid #EF4444', color: '#EF4444', background: '#1E1F25' } }); return false; }
    return true;
  };

  const handleCreate = () => { if (checkPermission()) { setItemToEdit(null); setIsFormOpen(true); } };
  const handleEdit = (item: ComercioEstablecido) => { if (checkOwnership(item.usuario_registro)) { setItemToEdit(item); setIsFormOpen(true); } };
  const handleDelete = (id: string, registroOwner?: string) => { if (checkOwnership(registroOwner)) { setItemToDeleteId(id); setIsConfirmOpen(true); } };

  const confirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('comercios_establecidos').delete().eq('id', itemToDeleteId);
    if (error) toast.error('Error'); else { toast.success('Eliminado'); fetchEstablecidos(); }
    setIsDeleting(false); setIsConfirmOpen(false);
  };

  // --- ESTILOS ---
  const baseCellStyle = "px-2 py-2.5 border border-gray-600 align-middle text-[11px]"; 
  const textCellStyle = `${baseCellStyle} whitespace-normal leading-tight break-words`;
  const fixedCellStyle = `${baseCellStyle} whitespace-nowrap text-center`;
  const headerStyle = "px-2 py-3 border border-gray-500 bg-[#27282F] text-center font-bold tracking-wider align-middle text-[10px] text-gray-200 uppercase";

  return (
    <div className="p-4">
      
      {/* MODALES */}
      <FileViewerModal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} fileUrl={currentFileUrl} fileName={currentFileName} />
      
      <LicenciaPreviewModal 
        isOpen={isPreviewLicenciaOpen} 
        onClose={() => setIsPreviewLicenciaOpen(false)} 
        data={previewLicenciaData} 
      />

      <EstablecidoForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onFormSubmit={fetchEstablecidos} dataToEdit={itemToEdit} currentYearContext={anio || '2025'} />
      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} isLoading={isDeleting} />

      {/* HEADER PAGINA */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><RiStore2Line size={24} /></div>
            <div>
                <h1 className="text-2xl font-bold text-white leading-none">Comercios Establecidos</h1>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">Licencias <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 rounded-md">{anio}</span></p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><RiSearchLine className="text-gray-400 text-sm" /></div>
                <input type="text" className="bg-[#1E1F25] text-white text-xs rounded block w-full pl-8 p-2 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 outline-none" placeholder="Buscar por Licencia, RUC o Nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center justify-center gap-2"><RiFileExcel2Line size={14} /> Excel</button>
            
            <button onClick={handleCreate} className={`text-white text-xs font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors ${userRole === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-500 opacity-80'}`}><RiAddLine size={14} /> Nueva Licencia</button>
        </div>
      </div>

      {/* TABLA COMPACTA */}
      {!loading && (
        <>
            <div className="bg-[#1E1F25] rounded-t border border-gray-600 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-gray-300 border-collapse">
                <thead>
                <tr>
                    <th className={`${headerStyle} w-[70px]`}>Licencia</th>
                    <th className={`${headerStyle} w-[80px]`}>RUC</th>
                    <th className={`${headerStyle} w-[160px]`}>Nombre Comercial</th>
                    <th className={`${headerStyle} w-[140px]`}>Razón Social</th>
                    <th className={`${headerStyle} w-[100px]`}>Giro</th>
                    <th className={`${headerStyle} w-[140px]`}>Dirección</th>
                    <th className={`${headerStyle} w-[50px]`}>Área</th>
                    <th className={`${headerStyle} w-[50px]`}>Aforo</th>
                    <th className={`${headerStyle} w-[100px]`}>Horario</th>
                    <th className={`${headerStyle} w-[80px] bg-orange-900/30 text-orange-200`}>Defensa Civil</th>
                    <th className={`${headerStyle} w-[90px] text-gray-400`}>Registrado Por</th>
                    <th className={`${headerStyle} w-[90px]`}>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {currentItems.length > 0 ? (
                    currentItems.map((item) => {
                        const owner = item.usuario_registro || 'fabiola.carbonero';
                        const isOwner = owner === currentUser;
                        const isSuperAdmin = currentUser === 'miguel.romero';
                        const canEdit = isOwner || isSuperAdmin;

                        return (
                        <tr key={item.id} className="hover:bg-[#2a2b33] transition-colors">
                            <td className={`${fixedCellStyle} font-bold text-white`}>{item.nro_licencia || '-'}</td>
                            <td className={`${fixedCellStyle} text-gray-400 font-mono`}>{item.ruc}</td>
                            <td className={`${textCellStyle} font-bold text-white`}>{item.nombre_comercial}</td>
                            <td className={`${textCellStyle} text-gray-400`}>{item.razon_social}</td>
                            <td className={`${textCellStyle}`}><span className="bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded text-[10px] border border-blue-900/50">{item.giro}</span></td>
                            <td className={`${textCellStyle}`}>{item.direccion}</td>
                            <td className={`${fixedCellStyle}`}>{item.area_local} m²</td>
                            <td className={`${fixedCellStyle}`}>{item.aforo} p.</td>
                            <td className={`${textCellStyle} text-[10px]`}>{item.horario_atencion}</td>
                            
                            <td className={`${fixedCellStyle} bg-orange-900/10`}>
                                {uploadingId === item.id ? (
                                    <div className="flex justify-center"><RiLoader4Line className="animate-spin text-orange-400" size={20}/></div>
                                ) : item.certificado_url ? (
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleViewCertificado(item.certificado_url!, item.nombre_comercial)} className="text-orange-400 hover:text-orange-300" title="Ver"><RiFileTextLine size={20} /></button>
                                        {userRole === 'admin' && (<button onClick={() => handleDeleteCertificado(item.id, item.certificado_url!)} className="text-red-500 hover:text-red-400" title="Eliminar"><RiCloseCircleLine size={16} /></button>)}
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <label className={`cursor-pointer text-gray-500 hover:text-orange-400 ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileUpload(e, item.id)} disabled={userRole !== 'admin'} />
                                            <RiUploadCloud2Line size={22} title="Subir" />
                                        </label>
                                    </div>
                                )}
                            </td>

                            <td className={`${fixedCellStyle} text-[10px] text-gray-500 italic`}>{item.usuario_registro || 'fabiola.carbonero'}</td>

                            <td className={`${fixedCellStyle}`}>
                                <div className="flex justify-center gap-1.5">
                                    
                                    {/* --- BOTÓN VER/IMPRIMIR LICENCIA (OJO) --- */}
                                    <button 
                                        onClick={() => handleOpenLicenciaPreview(item)} 
                                        className="text-green-400 hover:text-green-300" 
                                        title="Ver Licencia"
                                    >
                                        <RiEyeLine size={16} /> 
                                    </button>

                                    {/* --- ELIMINADO EL BOTÓN DE QR QUE ESTABA AQUÍ --- */}

                                    <button onClick={() => handleEdit(item)} className={`${canEdit ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed opacity-50'}`} title="Editar">{canEdit ? <RiPencilLine size={14} /> : <RiLockLine size={14} />}</button>
                                    <button onClick={() => handleDelete(item.id, item.usuario_registro)} className={`${canEdit ? 'text-red-500 hover:text-red-400' : 'text-gray-600 cursor-not-allowed opacity-50'}`} title="Eliminar">{canEdit ? <RiDeleteBinLine size={14} /> : <RiLockLine size={14} />}</button>
                                </div>
                            </td>
                        </tr>
                    );
                })
              ) : (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-gray-500">No hay registros.</td></tr>
              )}
            </tbody>
          </table>
            </div>
            
            {filteredData.length > 0 && (
                <div className="flex justify-between items-center bg-[#27282F] px-4 py-3 rounded-b border-t border-gray-700">
                    <span className="text-xs text-gray-400">Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} de <span className="text-white font-bold">{filteredData.length}</span></span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white"><RiArrowLeftSLine size={20} /></button>
                        <div className="flex gap-1">{Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                             (totalPages <= 10 || Math.abs(currentPage - number) < 3 || number === 1 || number === totalPages) ? 
                             <button key={number} onClick={() => paginate(number)} className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{number}</button>
                             : (Math.abs(currentPage - number) === 3 && <span key={number} className="text-gray-500">.</span>)
                        ))}</div>
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white"><RiArrowRightSLine size={20} /></button>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default EstablecidosPage;