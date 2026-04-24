// src/pages/ComerciosPage.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Comercio } from '../types';
import { 
  RiAddLine, RiPencilLine, RiDeleteBinLine, RiQrCodeLine, RiPrinterLine, 
  RiSearchLine, RiFileExcel2Line, RiUserVoiceLine, RiFilter3Line,
  RiCloseLine, RiPieChart2Line, RiLockLine, 
  RiArrowLeftSLine, RiArrowRightSLine,
  RiErrorWarningLine, RiCalendarEventLine
} from 'react-icons/ri';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useSearchParams, useParams } from 'react-router-dom';

import ComercioForm from '../components/Forms/ComercioForm';
import ConfirmModal from '../components/Modals/ConfirmModal';
import QrModal from '../components/Modals/QrModal';
import { useReactToPrint } from 'react-to-print';
import CarnetImprimible from '../components/PDF/CarnetImprimible';

const ComerciosPage = () => {
  const { userRole, session } = useAuth();
  const { anio } = useParams(); 
  const [searchParams, setSearchParams] = useSearchParams(); 

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  
  // --- MODO DUPLICADOS ---
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const currentUser = session?.user?.email?.split('@')[0] || '';

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [comercioToEdit, setComercioToEdit] = useState<Comercio | null>(null);
  const [comercioToDeleteId, setComercioToDeleteId] = useState<string | null>(null);
  const [qrComercio, setQrComercio] = useState<Comercio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [printComercio, setPrintComercio] = useState<Comercio | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: "Carnet_Comercio" });
  const triggerPrint = (comercio: Comercio) => { setPrintComercio(comercio); setTimeout(() => { handlePrint(); }, 100); };

  useEffect(() => {
    const queryGiro = searchParams.get('buscar');
    if (queryGiro) setSearchTerm(queryGiro);
  }, [searchParams]);

  const clearFilter = () => {
    setSearchTerm('');
    setSearchParams({});
    setShowDuplicates(false);
  };

  // --- CARGA DE DATOS POR AÑO ---
  const fetchComercios = useCallback(async () => {
    if (!anio) return;

    const { data, error } = await supabase
      .from('comercios_ambulatorios')
      .select('*')
      .eq('anio', anio) 
      .order('numero_autorizacion', { ascending: true });

    if (error) setError(error.message); else setComercios(data);
    setLoading(false);
  }, [anio]);

  useEffect(() => { fetchComercios(); }, [fetchComercios]);

  // --- DUPLICADOS ---
  const duplicateRecords = useMemo(() => {
    if (!comercios.length) return [];
    const normalizeGiro = (giro: string) => giro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(venta|de|y|comercio|ambulatorio)\b/g, "").replace(/[^a-z0-9]/g, " ").trim().split(/\s+/).filter(w => w.length > 2);
    
    const groupedByDni: Record<string, Comercio[]> = {};
    comercios.forEach(c => { if (c.dni) { if (!groupedByDni[c.dni]) groupedByDni[c.dni] = []; groupedByDni[c.dni].push(c); }});

    const duplicates: Comercio[] = [];
    Object.values(groupedByDni).forEach(group => {
        if (group.length < 2) return;
        const addedIds = new Set<string>();
        for (let i = 0; i < group.length; i++) {
            const giroA = normalizeGiro(group[i].giro);
            for (let j = i + 1; j < group.length; j++) {
                const giroB = normalizeGiro(group[j].giro);
                const coincidence = giroA.some(w => giroB.includes(w)) || giroB.some(w => giroA.includes(w));
                if (coincidence || group[i].giro.toLowerCase() === group[j].giro.toLowerCase()) {
                    if (!addedIds.has(group[i].id)) { duplicates.push(group[i]); addedIds.add(group[i].id); }
                    if (!addedIds.has(group[j].id)) { duplicates.push(group[j]); addedIds.add(group[j].id); }
                }
            }
        }
    });
    return duplicates;
  }, [comercios]);

  const dataToDisplay = showDuplicates ? duplicateRecords : comercios.filter((comercio) => {
    const term = searchTerm.toLowerCase();
    const authNum = comercio.numero_autorizacion?.toLowerCase() || '';
    const dni = comercio.dni?.toLowerCase() || '';
    const nombre = `${comercio.nombres} ${comercio.apellidos}`.toLowerCase();
    const giro = comercio.giro?.toLowerCase() || ''; 
    const matchesSearch = authNum.includes(term) || dni.includes(term) || nombre.includes(term) || giro.includes(term);
    const matchesType = filterTipo === 'TODOS' || comercio.tipo_comercio === filterTipo;
    return matchesSearch && matchesType;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTipo, showDuplicates, anio]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataToDisplay.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataToDisplay.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleExportExcel = () => {
    const dataToExport = dataToDisplay.map(c => ({
        "N° Aut": c.numero_autorizacion, "Aut. Temp": c.numero_autorizacion_temporal, "Nombres": c.nombres, "Apellidos": c.apellidos, "DNI": c.dni, "Teléfono": c.telefono, "Domicilio": c.domicilio, "Giro": c.giro, "Tipo": c.tipo_comercio, "Ubicación": c.ubicacion, "Turno": c.turno, "Horario": c.horario, "Vencimiento": c.fecha_caducidad, 
        "Registrado Por": c.usuario_registro || 'fabiola.carbonero',
        "Año": c.anio || '2025' // Ahora TypeScript reconocerá c.anio
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Padrón ${anio}`);
    const wscols = [{wch: 8}, {wch: 12}, {wch: 25}, {wch: 25}, {wch: 10}, {wch: 12}, {wch: 30}, {wch: 20}, {wch: 10}, {wch: 25}, {wch: 10}, {wch: 15}, {wch: 12}, {wch: 15}];
    worksheet['!cols'] = wscols;
    XLSX.writeFile(workbook, `Padron_Ambulatorios_${anio}_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.xlsx`);
  };

  const checkOwnership = (registroOwner: string | undefined) => {
    const owner = registroOwner || 'fabiola.carbonero';
    if (userRole === 'admin' && currentUser === 'miguel.romero') return true; 
    if (owner === currentUser) return true;
    toast.error('Solo el usuario que registró puede modificar este dato.', { style: { border: '1px solid #EF4444', color: '#EF4444', background: '#1E1F25' }, icon: '🔒' });
    return false;
  };

  const handleActionEditCreate = (c?: Comercio) => { 
    if (c && !checkOwnership(c.usuario_registro)) return;
    if(c) setComercioToEdit(c); else setComercioToEdit(null); 
    setIsFormModalOpen(true); 
  };

  const handleActionDelete = (id: string, registroOwner?: string) => { 
    if (!checkOwnership(registroOwner)) return;
    setComercioToDeleteId(id); 
    setIsConfirmModalOpen(true); 
  };

  const handleCloseFormModal = () => { setIsFormModalOpen(false); setComercioToEdit(null); };
  const handleCloseConfirmModal = () => { setComercioToDeleteId(null); setIsConfirmModalOpen(false); };
  const handleConfirmDelete = async () => { if(!comercioToDeleteId) return; setIsDeleting(true); await supabase.from('comercios_ambulatorios').delete().eq('id', comercioToDeleteId); setComercios(prev => prev.filter(c => c.id !== comercioToDeleteId)); setIsDeleting(false); handleCloseConfirmModal(); toast.success('Eliminado'); };
  const handleOpenQrModal = (c: Comercio) => { setQrComercio(c); setIsQrModalOpen(true); };
  const handleCloseQrModal = () => { setQrComercio(null); setIsQrModalOpen(false); };
  const formatTurno = (turno: string) => { if (turno === 'MAÑANA-TARDE-NOCHE') return 'TODO EL DÍA'; return turno.replace('MAÑANA', 'MAÑ').replace('TARDE', 'TAR').replace('NOCHE', 'NOC').replace('-', ' - '); };

  const baseCellStyle = "px-2 py-2.5 border border-gray-600 align-middle text-[11px]"; 
  const textCellStyle = `${baseCellStyle} whitespace-normal leading-tight break-words`;
  const fixedCellStyle = `${baseCellStyle} whitespace-nowrap text-center`;
  const headerStyle = "px-2 py-3 border border-gray-500 bg-[#27282F] text-center font-bold tracking-wider align-middle text-[10px] text-gray-200 uppercase";

  return (
    <div className="p-4">
      <div style={{ display: 'none' }}>{printComercio && <CarnetImprimible ref={printRef} comercio={printComercio} />}</div>
      
      
     <ComercioForm 
  isOpen={isFormModalOpen} 
  onClose={handleCloseFormModal} 
  onFormSubmit={fetchComercios} 
  comercioData={comercioToEdit}
  
  
  currentYearContext={anio || '2025'} 
/>
      
      <ConfirmModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} isLoading={isDeleting} />
      <QrModal isOpen={isQrModalOpen} onClose={handleCloseQrModal} comercio={qrComercio} />

      {duplicateRecords.length > 0 && !showDuplicates && showDuplicateAlert && (
        <div className="mb-4 bg-orange-900/10 border border-orange-500/30 rounded-lg p-3 flex justify-between items-center animate-fade-in-down shadow-lg">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded text-orange-400 animate-pulse"><RiErrorWarningLine size={24} /></div>
                <div>
                    <h3 className="text-orange-200 font-bold text-sm">¡Atención! Se detectaron posibles duplicados en {anio}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">El sistema encontró <strong>{duplicateRecords.length} registros</strong> que parecen repetidos.</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setShowDuplicates(true)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-md">Revisar Ahora</button>
                <button onClick={() => setShowDuplicateAlert(false)} className="text-gray-500 hover:text-gray-300 p-1 rounded-full"><RiCloseLine size={20} /></button>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><RiUserVoiceLine size={24} /></div>
            <div>
                <h1 className="text-2xl font-bold text-white leading-none">Comercios Ambulatorios</h1>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  Autorizaciones Temporales 
                  <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 rounded-md flex items-center gap-1">
                     <RiCalendarEventLine /> {anio}
                  </span>
                </p>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
            {!showDuplicates && (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><RiFilter3Line className="text-gray-400 text-sm" /></div>
                    <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="bg-[#1E1F25] text-white text-xs rounded block pl-8 pr-8 p-2 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer hover:bg-[#2a2b33] transition-colors">
                        <option value="TODOS">Todos</option><option value="ESTÁTICO">Estáticos</option><option value="MÓVIL">Móviles</option>
                    </select>
                </div>
            )}
            {!showDuplicates && (
                <div className="relative w-full sm:w-56">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><RiSearchLine className="text-gray-400 text-sm" /></div>
                    <input type="text" className="bg-[#1E1F25] text-white text-xs rounded block w-full pl-8 p-2 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 outline-none" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            )}
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2"><RiFileExcel2Line size={14} /> Excel</button>
            <button onClick={() => handleActionEditCreate()} className={`text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors ${userRole === 'admin' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 opacity-80'}`}><RiAddLine size={14} /> Nuevo</button>
        </div>
      </div>

      {showDuplicates && (
        <div className="mb-4 bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 flex justify-between items-center animate-fade-in-down">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded text-orange-400"><RiErrorWarningLine size={20} /></div>
                <div><p className="text-orange-300 text-xs font-bold uppercase tracking-wider">Modo Revisión de Duplicados</p><h3 className="text-gray-300 text-xs mt-1">Estás viendo solo los registros conflictivos.</h3></div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowDuplicates(false)} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"><RiArrowLeftSLine /> Volver a la Lista</button>
            </div>
        </div>
      )}

      {searchTerm && !showDuplicates && (
        <div className="mb-4 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex justify-between items-center animate-fade-in-down">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded text-purple-400"><RiPieChart2Line size={20} /></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider">Filtrando por</p><h3 className="text-white font-bold text-sm">"{searchTerm.toUpperCase()}"</h3></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right"><p className="text-3xl font-black text-white leading-none">{dataToDisplay.length}</p><p className="text-[10px] text-gray-400 uppercase">Registros</p></div>
                <button onClick={clearFilter} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors" title="Limpiar filtro"><RiCloseLine /></button>
            </div>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-[#1E1F25] rounded border border-gray-600 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-gray-300 border-collapse">
            <thead>
              <tr>
                <th className={`${headerStyle} w-[50px]`}>N° Aut</th>
                <th className={`${headerStyle} w-[70px]`}>Aut. Temp</th>
                <th className={`${headerStyle} w-[160px]`}>Nombres y Apellidos</th>
                <th className={`${headerStyle} w-[65px]`}>DNI</th>
                <th className={`${headerStyle} w-[70px]`}>Teléfono</th>
                <th className={`${headerStyle} w-[120px]`}>Domicilio</th>
                <th className={`${headerStyle} w-[100px]`}>Giro</th>
                <th className={`${headerStyle} w-[70px]`}>Tipo</th>
                <th className={`${headerStyle} w-[110px]`}>Ubicación</th>
                <th className={`${headerStyle} w-[60px]`}>Turno</th>
                <th className={`${headerStyle} w-[80px]`}>Horario</th>
                <th className={`${headerStyle} w-[70px]`}>Vence</th>
                <th className={`${headerStyle} w-[100px] text-gray-400`}>Registrado Por</th>
                <th className={`${headerStyle} w-[90px]`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((comercio) => {
                    const owner = comercio.usuario_registro || 'fabiola.carbonero';
                    const isOwner = owner === currentUser;
                    const isSuperAdmin = currentUser === 'miguel.romero';
                    const canEdit = isOwner || isSuperAdmin;

                    return (
                        <tr key={comercio.id} className={`transition-colors ${showDuplicates ? 'hover:bg-orange-900/10 bg-orange-900/5' : 'hover:bg-[#2a2b33]'}`}>
                            <td className={`${fixedCellStyle} font-bold text-white`}>{comercio.numero_autorizacion}</td>
                            <td className={`${fixedCellStyle} text-blue-400 font-semibold`}>{comercio.numero_autorizacion_temporal || '-'}</td>
                            <td className={`${textCellStyle}`}>{comercio.nombres} {comercio.apellidos}</td>
                            <td className={`${fixedCellStyle}`}>{comercio.dni}</td>
                            <td className={`${fixedCellStyle}`}>{comercio.telefono || '-'}</td>
                            <td className={`${textCellStyle}`}>{comercio.domicilio || '-'}</td>
                            <td className={`${textCellStyle}`}>
                                {searchTerm && comercio.giro.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                    <span className="text-purple-300 font-bold">{comercio.giro}</span>
                                ) : comercio.giro}
                            </td>
                            <td className={`${fixedCellStyle}`}><span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${comercio.tipo_comercio === 'ESTÁTICO' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-orange-900/30 text-orange-300 border-orange-500/30'}`}>{comercio.tipo_comercio}</span></td>
                            <td className={`${textCellStyle}`}>{comercio.ubicacion}</td>
                            <td className={`${fixedCellStyle} text-[9px] font-medium`}>{formatTurno(comercio.turno)}</td>
                            <td className={`${textCellStyle}`}>{comercio.horario || '-'}</td>
                            <td className={`${fixedCellStyle}`}>{comercio.fecha_caducidad}</td>
                            <td className={`${fixedCellStyle} text-[10px] text-gray-500 italic`}>{comercio.usuario_registro || 'fabiola.carbonero'}</td>
                            <td className={`${fixedCellStyle}`}>
                                <div className="flex justify-center gap-1.5">
                                    <button onClick={() => triggerPrint(comercio)} className="text-green-400 hover:text-green-300" title="Imprimir"><RiPrinterLine size={14} /></button>
                                    <button onClick={() => handleOpenQrModal(comercio)} className="text-purple-400 hover:text-purple-300" title="QR"><RiQrCodeLine size={14} /></button>
                                    <button onClick={() => handleActionEditCreate(comercio)} className={`${canEdit ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed opacity-50'}`} title={canEdit ? "Editar" : "Solo el propietario puede editar"}>
                                        {canEdit ? <RiPencilLine size={14} /> : <RiLockLine size={14} />}
                                    </button>
                                    <button onClick={() => handleActionDelete(comercio.id, comercio.usuario_registro)} className={`${canEdit ? 'text-red-500 hover:text-red-400' : 'text-gray-600 cursor-not-allowed opacity-50'}`} title={canEdit ? "Eliminar" : "Solo el propietario puede eliminar"}>
                                        {canEdit ? <RiDeleteBinLine size={14} /> : <RiLockLine size={14} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })
              ) : (
                <tr><td colSpan={14} className="px-2 py-8 text-center text-gray-500 text-xs">{showDuplicates ? '¡Todo limpio! No se encontraron duplicados.' : searchTerm ? 'Sin resultados.' : 'Tabla vacía.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {dataToDisplay.length > 0 && (
          <div className="flex justify-between items-center bg-[#27282F] px-4 py-3 rounded-b border-t border-gray-700">
              <span className="text-xs text-gray-400">
                  Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, dataToDisplay.length)} de <span className="text-white font-bold">{dataToDisplay.length}</span> registros
              </span>
              <div className="flex items-center gap-1">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white"><RiArrowLeftSLine size={20} /></button>
                  <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                           (totalPages <= 10 || Math.abs(currentPage - number) < 3 || number === 1 || number === totalPages) ? 
                           <button key={number} onClick={() => paginate(number)} className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{number}</button>
                           : (Math.abs(currentPage - number) === 3 && <span key={number} className="text-gray-500">.</span>)
                      ))}
                  </div>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white"><RiArrowRightSLine size={20} /></button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ComerciosPage;