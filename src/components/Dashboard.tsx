// src/components/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import StatCard from './Dashboard/StatCard';
import { 
  RiUserVoiceLine, 
  RiAlertLine, 
  RiStore3Line, 
  RiTruckLine,
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiPieChart2Line,
  RiStore2Line,
  RiRefreshLine // Icono para actualizar
} from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardItem {
  id: string;
  nombres: string;
  apellidos: string;
  numero_autorizacion: string;
  fecha: string;
  tipo: string;
}

interface GiroStat {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, porVencer: 0, estaticos: 0, moviles: 0 });
  const [recentRecords, setRecentRecords] = useState<DashboardItem[]>([]);
  const [expiringRecords, setExpiringRecords] = useState<DashboardItem[]>([]);
  const [topGiros, setTopGiros] = useState<GiroStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const currentDate = new Date().toLocaleDateString('es-ES', dateOptions);

  const colors = [
    { bg: 'bg-blue-500', text: 'text-blue-400', bgSoft: 'bg-blue-500/10' },
    { bg: 'bg-purple-500', text: 'text-purple-400', bgSoft: 'bg-purple-500/10' },
    { bg: 'bg-pink-500', text: 'text-pink-400', bgSoft: 'bg-pink-500/10' },
    { bg: 'bg-orange-500', text: 'text-orange-400', bgSoft: 'bg-orange-500/10' },
    { bg: 'bg-emerald-500', text: 'text-emerald-400', bgSoft: 'bg-emerald-500/10' },
    { bg: 'bg-cyan-500', text: 'text-cyan-400', bgSoft: 'bg-cyan-500/10' },
  ];

  const getSimilarity = (s1: string, s2: string) => {
    let longer = s1; let shorter = s2;
    if (s1.length < s2.length) { longer = s2; shorter = s1; }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    const editDistance = (s1: string, s2: string) => {
      s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
      const costs = new Array();
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) !== s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              costs[j - 1] = lastValue; lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    }
    return (longerLength - editDistance(longer, shorter)) / longerLength;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!loading) setIsRefreshing(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDateObj = new Date();
      futureDateObj.setDate(futureDateObj.getDate() + 30);
      const futureDate = futureDateObj.toISOString().split('T')[0];

      const { data: allData, error } = await supabase
        .from('comercios_ambulatorios')
        .select('id, tipo_comercio, fecha_caducidad, giro, nombres, apellidos, numero_autorizacion, created_at');

      if (error) throw error;

      if (allData) {
        const total = allData.length;
        setStats({
            total: total,
            estaticos: allData.filter(d => d.tipo_comercio === 'ESTÁTICO').length,
            moviles: allData.filter(d => d.tipo_comercio === 'MÓVIL').length,
            porVencer: allData.filter(d => d.fecha_caducidad && d.fecha_caducidad > today && d.fecha_caducidad < futureDate).length
        });

        const girosMap: Record<string, number> = {};
        allData.forEach(item => {
            if (!item.giro) return;
            const giroLimpio = item.giro.trim().toUpperCase();
            const llaveExistente = Object.keys(girosMap).find(key => getSimilarity(key, giroLimpio) > 0.80);
            if (llaveExistente) girosMap[llaveExistente]++; else girosMap[giroLimpio] = 1;
        });

        const girosOrdenados = Object.entries(girosMap)
            .map(([nombre, cantidad]) => ({
                nombre, cantidad, porcentaje: total > 0 ? Math.round((cantidad / total) * 100) : 0
            }))
            .sort((a, b) => b.cantidad - a.cantidad);

        setTopGiros(girosOrdenados);

        const sortedByDate = [...allData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentRecords(sortedByDate.slice(0, 4).map(item => ({
            id: item.id, nombres: item.nombres, apellidos: item.apellidos, numero_autorizacion: item.numero_autorizacion, 
            fecha: new Date(item.created_at).toLocaleDateString(), tipo: item.tipo_comercio
        })));
        
        const expiring = allData.filter(d => d.fecha_caducidad && d.fecha_caducidad > today)
            .sort((a, b) => new Date(a.fecha_caducidad).getTime() - new Date(b.fecha_caducidad).getTime());
        setExpiringRecords(expiring.slice(0, 4).map(item => ({
            id: item.id, nombres: item.nombres, apellidos: item.apellidos, numero_autorizacion: item.numero_autorizacion, 
            fecha: item.fecha_caducidad, tipo: item.tipo_comercio
        })));
      }
    } catch (error) { console.error(error); } finally { 
        setLoading(false); 
        setIsRefreshing(false); 
    }
  }, [loading]);

  useEffect(() => { fetchDashboardData(); }, []);

  const handleGiroClick = (nombreGiro: string) => {
    navigate(`/comercios?buscar=${encodeURIComponent(nombreGiro)}`);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) return <div className="flex justify-center items-center h-full text-gray-500 animate-pulse">Cargando métricas...</div>;

  return (
    <div className="p-8">
      {/* Estilos Scroll */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 12px; }
        .custom-scroll::-webkit-scrollbar-track { background: #2a2b32; border-radius: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #6B7280; border-radius: 6px; border: 3px solid #2a2b32; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
            {/* TÍTULO Y BOTÓN DE ACTUALIZAR JUNTOS */}
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white tracking-tight">Panel de Control</h1>
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-full bg-[#1E1F25] hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                    title="Actualizar Datos"
                >
                    <RiRefreshLine size={24} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
                </button>
            </div>
            <p className="text-gray-400 mt-2 text-lg">Bienvenido al sistema de gestión municipal.</p>
        </div>
        
        {/* FECHA A LA DERECHA */}
        <div className="text-right">
            <div className="bg-[#1E1F25] border border-gray-700 px-4 py-2 rounded-lg text-gray-300 text-sm flex items-center gap-2 shadow-sm">
                <RiCalendarCheckLine className="text-blue-500" /><span className="capitalize">{currentDate}</span>
            </div>
        </div>
      </div>
      
      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<RiUserVoiceLine />} title="Total Padrón" value={stats.total} color="blue" subtext="Comerciantes activos"/>
        <StatCard icon={<RiAlertLine />} title="Por Vencer" value={stats.porVencer} color="yellow" subtext="Requieren atención urgente"/>
        <StatCard icon={<RiStore3Line />} title="Estáticos" value={stats.estaticos} color="green" subtext="Puestos fijos"/>
        <StatCard icon={<RiTruckLine />} title="Móviles" value={stats.moviles} color="pink" subtext="Venta ambulatoria"/>
      </div>
      
      {/* Sección Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        
        {/* Columna 1 */}
        <div className="bg-[#1E1F25] rounded-2xl border border-gray-800 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-lg font-bold text-white">Actividad Reciente</h2><p className="text-[10px] text-gray-500">Últimos registrados</p></div>
                <Link to="/comercios/2026" className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"><RiArrowRightLine /></Link>
            </div>
        <div className="space-y-3 overflow-y-auto custom-scroll pr-2">
                {recentRecords.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1b20] border border-gray-800 hover:border-gray-700 transition-colors">
                        
                        {/* 1. AVATAR (Fijo) */}
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            {item.nombres.charAt(0)}
                        </div>

                        {/* 2. NOMBRE Y TIPO (Flexible - Se corta si es largo) */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs text-white font-medium truncate" title={item.nombres + ' ' + item.apellidos}>
                                {item.nombres} {item.apellidos.split(' ')[0]}
                            </h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded inline-block mt-1 ${item.tipo === 'ESTÁTICO' ? 'text-green-400 bg-green-900/20' : 'text-pink-400 bg-pink-900/20'}`}>
                                {item.tipo}
                            </span>
                        </div>

                        {/* 3. FECHA (Fija a la derecha) */}
                        <div className="shrink-0 text-right">
                            <span className="text-[10px] text-gray-500 font-mono block">
                                {item.fecha}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Columna 2 */}
        <div className="bg-[#1E1F25] rounded-2xl border border-gray-800 p-6 shadow-sm flex flex-col">
            <div className="mb-4 shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RiPieChart2Line className="text-purple-500" /> Lista de Giros Ambulatorios
                </h2>
                <p className="text-[10px] text-gray-500">Clic para ver detalles</p>
            </div>
            <div className="space-y-3 overflow-y-auto custom-scroll pr-2 h-[320px]">
                {topGiros.length > 0 ? topGiros.map((giro, idx) => {
                    const color = colors[idx % colors.length];
                    return (
                        <div key={idx} onClick={() => handleGiroClick(giro.nombre)} className="group cursor-pointer p-3 rounded-xl bg-[#15161b] border border-gray-800 hover:border-gray-600 transition-all hover:translate-x-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-1.5 rounded-lg ${color.bgSoft} ${color.text} shrink-0`}><RiStore2Line size={16} /></div>
                                    <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate max-w-[150px]">{giro.nombre}</span>
                                </div>
                                <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">{giro.cantidad}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full ${color.bg} transition-all duration-1000 ease-out`} style={{ width: `${giro.porcentaje}%` }}></div></div>
                        </div>
                    );
                }) : <div className="h-full flex flex-col items-center justify-center text-gray-500"><RiPieChart2Line size={40} className="mb-2 opacity-20" /><span className="text-xs">Sin datos registrados</span></div>}
            </div>
        </div>

        {/* Columna 3 */}
        <div className="bg-[#1E1F25] rounded-2xl border border-gray-800 p-6 shadow-sm flex flex-col">
            <div className="mb-6 border-l-4 border-yellow-500 pl-3 shrink-0">
                <h2 className="text-lg font-bold text-white">Vencimientos</h2><p className="text-[10px] text-gray-500">Licencias próximas a expirar</p>
            </div>
            <div className="space-y-3 overflow-y-auto custom-scroll pr-2 flex-1">
                {expiringRecords.length > 0 ? expiringRecords.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-yellow-500/5 transition-colors border border-gray-800 hover:border-yellow-500/30">
                        <div className="mt-0.5 text-yellow-500"><RiAlertLine /></div>
                        <div><h5 className="text-xs text-gray-300 font-medium">{item.nombres} {item.apellidos.split(' ')[0]}</h5><p className="text-[10px] text-yellow-600 font-medium mt-1">Vence: {item.fecha}</p></div>
                    </div>
                )) : <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 py-8"><span className="text-xs">Sin alertas pendientes</span></div>}
            </div>
            <Link to="/comercios" className="mt-4 w-full py-2 rounded-lg border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 hover:text-white transition-colors text-center block shrink-0">Ver Padrón</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;