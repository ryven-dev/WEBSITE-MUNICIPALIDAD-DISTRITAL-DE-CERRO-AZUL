import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  RiComputerLine,RiArrowUpSLine, 
  RiPieChartLine, RiBarChartFill, RiStackLine, RiToolsFill,
  RiArrowRightSLine, RiErrorWarningLine, RiBuilding4Fill
} from 'react-icons/ri';
import toast from 'react-hot-toast';

const ITAnalyticsDashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    bueno: 0,
    regular: 0,
    malo: 0,
    tipos: {} as Record<string, number>,
    marcas: {} as Record<string, number>,
    porOficina: [] as any[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const { data: items, error } = await supabase.from('inventario_informatica').select('*');
      
      if (error) {
        toast.error("Error al cargar analíticas");
      } else if (items) {
        setData(items);
        processStats(items);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const processStats = (items: any[]) => {
    const s = {
      total: items.length,
      bueno: items.filter(i => i.estado === 'BUENO' || i.estado === 'NUEVO').length,
      regular: items.filter(i => i.estado === 'REGULAR').length,
      malo: items.filter(i => i.estado === 'MALO').length,
      tipos: {} as Record<string, number>,
      marcas: {} as Record<string, number>,
      porOficina: [] as any[]
    };

    items.forEach(i => {
      s.tipos[i.denominacion] = (s.tipos[i.denominacion] || 0) + 1;
      s.marcas[i.marca] = (s.marcas[i.marca] || 0) + 1;
    });

    setStats(s);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-xs">Generando Reporte Pro...</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#0a0b10] min-h-screen font-sans text-gray-300">
      
      {/* --- HEADER --- */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            Panel de control <span className="text-emerald-500">TI</span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">Visión General de Infraestructura Municipal</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Sincronizado en Tiempo Real</span>
        </div>
      </div>

      {/* --- FILA 1: MÉTRICAS GLOBALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card Total */}
        <div className="bg-gradient-to-br from-[#1c1d26] to-[#111218] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-blue-500/10 w-24 h-24 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <RiComputerLine className="text-blue-500 mb-4" size={32} />
          <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Equipos IT</h3>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-6xl font-black text-white leading-none">{stats.total}</span>
            <div className="flex items-center text-emerald-400 text-sm font-bold mb-1">
              <RiArrowUpSLine size={20} /> 12%
            </div>
          </div>
          <div className="mt-6 flex gap-2">
             <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 uppercase font-black">Operativos</p>
                <p className="text-emerald-400 font-bold">{stats.bueno + stats.regular}</p>
             </div>
             <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[9px] text-zinc-500 uppercase font-black">Críticos</p>
                <p className="text-red-500 font-bold">{stats.malo}</p>
             </div>
          </div>
        </div>

        {/* Card Distribución (Tipo) */}
        <div className="bg-[#16171d] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <RiPieChartLine className="text-purple-500" /> Distribución por Tipo
            </h3>
          </div>
          <div className="flex items-center justify-between flex-grow">
             <div className="space-y-3">
                {Object.entries(stats.tipos).slice(0, 4).map(([name, val], idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{name}</span>
                    <span className="text-[10px] text-white font-black ml-auto">{val}</span>
                  </div>
                ))}
             </div>
             {/* Visualización circular simplificada con CSS */}
             <div className="w-28 h-28 rounded-full border-[10px] border-emerald-500/20 border-t-emerald-500 border-r-blue-500 border-b-purple-500 flex items-center justify-center relative">
                <div className="text-[10px] font-black text-white">TOP 4</div>
             </div>
          </div>
        </div>

        {/* Card Estado General */}
        <div className="bg-[#16171d] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <RiStackLine className="text-orange-500" /> Salud del Inventario
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                <span>Estado Bueno</span>
                <span className="text-emerald-400">{Math.round((stats.bueno/stats.total)*100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{width: `${(stats.bueno/stats.total)*100}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                <span>Estado Regular</span>
                <span className="text-orange-400">{Math.round((stats.regular/stats.total)*100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 shadow-[0_0_10px_#f59e0b]" style={{width: `${(stats.regular/stats.total)*100}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black mb-2 uppercase">
                <span>Baja / Malo</span>
                <span className="text-red-500">{Math.round((stats.malo/stats.total)*100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 shadow-[0_0_10px_#ef4444]" style={{width: `${(stats.malo/stats.total)*100}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILA 2: ANÁLISIS DETALLADO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TOP MARCAS (Bar Chart) */}
        <div className="lg:col-span-8 bg-[#16171d]/60 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-white font-black italic text-lg uppercase tracking-tighter flex items-center gap-2">
                <RiBarChartFill size={24} className="text-blue-500" /> Desglose por Marca & Fabricante
              </h3>
              <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Ver Padrón Completo</button>
           </div>
           
           <div className="flex items-end justify-between h-48 gap-4 px-4">
              {Object.entries(stats.marcas).slice(0, 8).map(([name, val], idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1">
                   <div className="text-[10px] font-black text-white">{val}</div>
                   <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xl transition-all duration-1000 hover:brightness-125"
                    style={{ height: `${(val / stats.total) * 200}%`, minHeight: '10px' }}
                   ></div>
                   <div className="text-[9px] font-black text-zinc-500 uppercase rotate-45 mt-4 origin-left whitespace-nowrap">{name}</div>
                </div>
              ))}
           </div>
        </div>

        {/* ACCIONES REQUERIDAS (Malo) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                   <RiErrorWarningLine size={20}/> Críticos (Urgente)
                 </h3>
                 <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg animate-pulse">{stats.malo}</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
                 {data.filter(i => i.estado === 'MALO').slice(0, 5).map((item, idx) => (
                   <div key={idx} className="bg-[#111218] p-4 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-[11px] font-black text-white uppercase italic">{item.denominacion}</h4>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">{item.oficina_especifica}</p>
                         </div>
                         <button className="p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><RiToolsFill size={14}/></button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                         <span className="text-[9px] font-mono text-zinc-600 tracking-tighter">S/N: {item.serie}</span>
                         <div className="flex gap-1">
                            <button className="text-[8px] font-black text-zinc-400 bg-white/5 px-2 py-1 rounded uppercase hover:bg-white/10 transition-all">Ticket</button>
                         </div>
                      </div>
                   </div>
                 ))}
                 {stats.malo === 0 && <p className="text-center text-emerald-500 text-xs py-10 font-bold italic">¡Sin equipos en mal estado!</p>}
              </div>

              <button className="w-full mt-6 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-900/40 hover:bg-red-500 transition-all flex items-center justify-center gap-2">
                 Generar Reporte de Baja <RiArrowRightSLine />
              </button>
           </div>

           {/* Tip de área */}
           <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2.5rem] flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-900/20 text-white"><RiBuilding4Fill size={20}/></div>
              <div>
                 <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest italic">Área Propietaria</p>
                 <p className="text-white font-bold text-sm">Oficina de Informática</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ITAnalyticsDashboard;