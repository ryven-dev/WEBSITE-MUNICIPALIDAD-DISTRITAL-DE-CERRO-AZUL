import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  RiSearchLine, RiAddLine, RiFileExcel2Line, RiComputerLine, 
  RiPencilLine, RiDeleteBinLine, RiFilter3Line 
} from 'react-icons/ri';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import InventarioInformaticaForm from '../../components/Forms/InventarioInformaticaForm';
import { ORGANIGRAMA } from '../../data/organigrama';

const InventarioInformaticaPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Filtros Dependientes
  const [filterGerencia, setFilterGerencia] = useState('TODAS');
  const [filterOficina, setFilterOficina] = useState('TODAS');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Obtener la lista de oficinas dinámicamente según la gerencia seleccionada
  const oficinasDisponibles = filterGerencia !== 'TODAS' 
    ? (ORGANIGRAMA as any)[filterGerencia] || [] 
    : [];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('inventario_informatica').select('*');
    
    // Aplicar Filtro 1: Gerencia
    if (filterGerencia !== 'TODAS') {
        query = query.eq('unidad_organica', filterGerencia);
    }
    
    // Aplicar Filtro 2: Oficina 
    if (filterOficina !== 'TODAS') {
        query = query.eq('oficina_especifica', filterOficina);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) toast.error(error.message); 
    else setItems(data || []);
    
    setLoading(false);
  }, [filterGerencia, filterOficina]);

  useEffect(() => { 
    fetchItems(); 
  }, [fetchItems]);

  // Si cambia la gerencia, reseteamos la oficina a "TODAS"
  const handleGerenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterGerencia(e.target.value);
    setFilterOficina('TODAS');
  };

  const filteredItems = items.filter(item => 
    item.denominacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_patrimonial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    if (filteredItems.length === 0) return toast.error("No hay datos");
    const data = filteredItems.map(i => ({ 
      "GERENCIA": i.unidad_organica, "OFICINA": i.oficina_especifica, "CÓD. CONTABLE": i.codigo_contable,
      "CÓD. PATRIMONIAL": i.codigo_patrimonial, "DENOMINACIÓN": i.denominacion, "MARCA": i.marca,
      "MODELO": i.modelo, "SERIE": i.serie, "COLOR": i.color, "ESTADO": i.estado, "OBSERVACIONES": i.observaciones
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario IT");
    XLSX.writeFile(wb, `Inventario_${filterGerencia}_${filterOficina}.xlsx`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar registro patrimonial?")) return;
    const { error } = await supabase.from('inventario_informatica').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success("Eliminado"); fetchItems(); }
  };

  const headerClass = "p-2 border border-gray-700 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-[#16171d] text-center whitespace-nowrap";
  const cellClass = "p-1.5 border border-gray-800 text-[10px] font-bold uppercase whitespace-nowrap transition-all";

  return (
    <div className="p-2 md:p-6 font-sans">
      <InventarioInformaticaForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedItem(null); }} onFormSubmit={fetchItems} dataToEdit={selectedItem} />

      {/* CABECERA CON FILTROS DEPENDIENTES */}
      <div className="flex flex-col gap-3 mb-4 bg-[#1E1F25] p-4 rounded-xl border border-gray-800 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <RiComputerLine className="text-emerald-500" size={20} />
            <h1 className="text-lg font-black text-white uppercase tracking-tighter italic">Inventario IT</h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleExportExcel} className="flex-1 bg-[#13141a] text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"><RiFileExcel2Line size={14}/> Excel</button>
            <button onClick={() => setIsFormOpen(true)} className="flex-1 bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"><RiAddLine size={16}/> Nuevo</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2">
          {/* BUSCADOR */}
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]" />
            <input type="text" placeholder="BUSCAR POR BIEN O SERIE..." className="w-full bg-[#13141a] border border-gray-700 rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-white outline-none focus:border-blue-500 font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* FILTRO 1: GERENCIA */}
          <div className="relative flex-1">
            <select 
                value={filterGerencia} 
                onChange={handleGerenciaChange} 
                className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-black text-blue-400 outline-none cursor-pointer uppercase appearance-none"
            >
                <option value="TODAS">📁 TODAS LAS GERENCIAS</option>
                {Object.keys(ORGANIGRAMA).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <RiFilter3Line className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>

          {/* FILTRO 2: OFICINA (DEPENDIENTE) */}
          <div className="relative flex-1">
            <select 
                disabled={filterGerencia === 'TODAS'}
                value={filterOficina} 
                onChange={(e) => setFilterOficina(e.target.value)} 
                className={`w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-black outline-none cursor-pointer uppercase appearance-none ${filterGerencia === 'TODAS' ? 'opacity-20 grayscale' : 'text-orange-400 border-orange-900/30'}`}
            >
                <option value="TODAS">📍 TODAS LAS OFICINAS</option>
                {oficinasDisponibles.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
            <RiFilter3Line className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* TABLA ESTILO EXCEL */}
      <div className="bg-[#1E1F25] rounded-lg border border-gray-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr>
                <th className={headerClass}>Oficina Detalle</th>
                <th className={headerClass}>Patrimonial</th>
                <th className={headerClass}>Denominación del Bien</th>
                <th className={headerClass}>Marca / Modelo</th>
                <th className={headerClass}>Color</th>
                <th className={headerClass}>N° Serie</th>
                <th className={headerClass}>Estado</th>
                <th className={headerClass}>Observaciones</th>
                <th className={headerClass}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-20 text-center text-gray-600 animate-pulse font-black uppercase text-[10px]">Cargando Inventario...</td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.04] transition-all group">
                    <td className={`${cellClass} text-blue-400`}>{item.oficina_especifica}</td>
                    <td className={`${cellClass} text-zinc-400 text-center`}>{item.codigo_patrimonial || '---'}</td>
                    <td className={`${cellClass} text-white font-black`}>{item.denominacion}</td>
                    <td className={`${cellClass} text-zinc-300`}>{item.marca} / {item.modelo}</td>
                    <td className={`${cellClass} text-zinc-400 text-center`}>{item.color}</td>
                    <td className={`${cellClass} font-mono text-emerald-500 text-center tracking-tighter`}>{item.serie}</td>
                    <td className={`${cellClass} text-center`}>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        item.estado === 'MALO' ? 'bg-red-500/20 text-red-500' : 
                        item.estado === 'REGULAR' ? 'bg-orange-500/10 text-orange-500' : 
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>{item.estado}</span>
                    </td>
                    <td className={`${cellClass} text-zinc-500 lowercase first-letter:uppercase max-w-[150px] truncate`} title={item.observaciones}>
                      {item.observaciones || '-'}
                    </td>
                    <td className={`${cellClass} text-center`}>
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setSelectedItem(item); setIsFormOpen(true); }} className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-all"><RiPencilLine size={12}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all"><RiDeleteBinLine size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="p-20 text-center text-gray-600 font-bold uppercase text-[10px]">No hay bienes registrados con estos filtros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-2 flex justify-end px-4">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900/50 px-3 py-1 rounded-full border border-gray-800">
          Items Filtrados: {filteredItems.length}
        </span>
      </div>
    </div>
  );
};

export default InventarioInformaticaPage;