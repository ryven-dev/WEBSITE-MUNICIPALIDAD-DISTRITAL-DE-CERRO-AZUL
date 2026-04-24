// src/components/DashboardSocial.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  RiHeartPulseLine, RiWheelchairLine, RiGobletLine,
  RiBusLine, RiBookOpenLine, RiBasketballLine,
  RiLoader4Line, RiArrowRightSLine,
  RiCustomerService2Line, RiTeamLine, RiShieldUserLine
} from 'react-icons/ri';
import StatCard from './Dashboard/StatCard';
import { useNavigate } from 'react-router-dom';

const DashboardSocial = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ciam: 0, 
    omaped: 0, 
    vasoLeche: 0,
    busMunicipal: 0, 
    biblioteca: 0, 
    vacaciones: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [busRes, bibRes, vacRes] = await Promise.all([
        supabase.from('social_bus_escolar').select('*', { count: 'exact', head: true }),
        supabase.from('biblioteca_libros').select('*', { count: 'exact', head: true }),
        supabase.from('vacaciones_alumnos').select('*', { count: 'exact', head: true })
      ]);

      setStats(prev => ({
        ...prev,
        busMunicipal: busRes.count || 0,
        biblioteca: bibRes.count || 0,
        vacaciones: vacRes.count || 0,
        vasoLeche: 0, 
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA DE ORDENAMIENTO (Solo 6 tarjetas ahora) ---
  const allCards = [
    { icon: <RiHeartPulseLine />, title: "CIAM", value: stats.ciam, color: "pink" as const, subtext: "Adulto Mayor" },
    { icon: <RiWheelchairLine />, title: "OMAPED", value: stats.omaped, color: "blue" as const, subtext: "Discapacidad" },
    { icon: <RiGobletLine />, title: "Vaso de Leche", value: stats.vasoLeche, color: "purple" as const, subtext: "Beneficiarios Activos" },
    { icon: <RiBusLine />, title: "Bus Municipal", value: stats.busMunicipal, color: "orange" as const, subtext: "Alumnos Inscritos" },
    { icon: <RiBookOpenLine />, title: "Biblioteca", value: stats.biblioteca, color: "green" as const, subtext: "Libros Registrados" },
    { icon: <RiBasketballLine />, title: "Vacaciones Útiles", value: stats.vacaciones, color: "indigo" as const, subtext: "Padrón 2026" },
  ];

  // Ordenar: Valores más altos primero (Móvil y Desktop)
  const sortedCards = [...allCards].sort((a, b) => b.value - a.value);

  const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-8 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">Desarrollo Social</h1>
            <p className="text-gray-400 mt-2 text-lg uppercase font-bold text-xs tracking-[0.2em] text-blue-500 font-mono">Gestión de Padrones Municipales</p>
        </div>
        <div className="text-right">
            <span className="text-gray-400 font-bold capitalize text-sm">{currentDate}</span>
            {loading && <div className="flex items-center gap-2 text-blue-500 text-[10px] mt-2 uppercase tracking-widest font-black animate-pulse"><RiLoader4Line className="animate-spin" /> Sincronizando datos...</div>}
        </div>
      </div>

      {/* --- STAT CARDS (6 tarjetas organizadas en 3 columnas para Desktop) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {sortedCards.map((card, index) => (
          <StatCard 
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            color={card.color}
            subtext={card.subtext}
          />
        ))}
      </div>

      {/* --- SECCIÓN INFERIOR: MÓDULOS DE GESTIÓN DESTACADOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: PROGRAMAS EN PROCESO */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                Gestión Operativa de Servicios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1E1F25] p-6 rounded-3xl border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden">
                    <RiShieldUserLine className="absolute -right-4 -bottom-4 text-gray-800/20 text-8xl group-hover:scale-110 transition-transform"/>
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <RiTeamLine size={24}/>
                            </div>
                            <h4 className="text-white font-bold text-lg mb-1 italic">Programas de Inclusión</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">Gestione los padrones de CIAM y OMAPED para garantizar el apoyo a poblaciones vulnerables.</p>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                            Estado: Operativo <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E1F25] p-6 rounded-3xl border border-gray-800 hover:border-orange-500/50 transition-all cursor-pointer group relative overflow-hidden">
                    <RiCustomerService2Line className="absolute -right-4 -bottom-4 text-gray-800/20 text-8xl group-hover:scale-110 transition-transform"/>
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div>
                            <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                <RiBasketballLine size={24}/>
                            </div>
                            <h4 className="text-white font-bold text-lg mb-1 italic">Niñez y Juventud</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">Administración de Vacaciones Útiles y Bus Escolar. Seguimiento de asistencia y beneficios.</p>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                            Periodo: Verano 2026 <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner decorativo inferior */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-blue-900/20 overflow-hidden relative">
                <div className="relative z-10">
                    <h4 className="text-white font-black text-xl leading-tight italic uppercase">Soporte y Consultas</h4>
                    <p className="text-blue-100 text-xs opacity-80 mt-1 uppercase tracking-widest font-bold">Gerencia de Desarrollo Social</p>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md relative z-10">
                    <RiCustomerService2Line size={32} className="text-white"/>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
            </div>
        </div>

        {/* COLUMNA DERECHA: ACCESOS RÁPIDOS */}
        <div className="bg-[#1E1F25] rounded-3xl border border-gray-800 p-8 flex flex-col shadow-2xl">
            <h3 className="text-xl font-black text-white mb-8 border-b border-gray-800 pb-4 uppercase tracking-tighter italic">Acceso Directo</h3>
            
            <div className="grid grid-cols-1 gap-3 flex-1">
                <button 
                    onClick={() => navigate('/social/bus-escolar')} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#13141a] border border-gray-700 hover:border-orange-500 hover:bg-[#27282F] text-white transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                            <RiBusLine size={20}/>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tighter italic tracking-widest">Padrón de Bus</span>
                    </div>
                    <RiArrowRightSLine className="group-hover:translate-x-1 transition-transform text-orange-500"/>
                </button>

                <button 
                    onClick={() => navigate('/social/biblioteca')} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#13141a] border border-gray-700 hover:border-green-500 hover:bg-[#27282F] text-white transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center text-green-500">
                            <RiBookOpenLine size={20}/>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tighter italic tracking-widest">Inventario Libros</span>
                    </div>
                    <RiArrowRightSLine className="group-hover:translate-x-1 transition-transform text-green-500"/>
                </button>

                <button 
                    onClick={() => navigate('/social/vacaciones-utiles')} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#13141a] border border-gray-700 hover:border-indigo-500 hover:bg-[#27282F] text-white transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500">
                            <RiBasketballLine size={20}/>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tighter italic tracking-widest">Vacaciones Útiles</span>
                    </div>
                    <RiArrowRightSLine className="group-hover:translate-x-1 transition-transform text-indigo-500"/>
                </button>
            </div>

            <div className="mt-8 border-t border-gray-800 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Base de datos sincronizada</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardSocial;