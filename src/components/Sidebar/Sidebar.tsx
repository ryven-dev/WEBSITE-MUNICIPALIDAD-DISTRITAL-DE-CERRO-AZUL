// src/components/Sidebar/Sidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiCloseLine, RiArrowDownSLine, RiArrowRightSLine,
  RiBuilding4Line, RiUserVoiceLine, RiDashboardLine,
  RiStore2Line, RiShieldCheckLine, RiBriefcase4Line,
  RiCalendarEventLine,
  RiHeartPulseLine, RiWheelchairLine, RiGobletLine, 
  RiBookOpenLine, RiParentLine, 
  RiBasketballLine, RiShirtLine, RiBusLine // <--- Agregado RiBusLine
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { userArea } = useAuth();
  const location = useLocation();
  
  const [showComercializacion, setShowComercializacion] = useState(false);
  const [showAmbulatoriosYears, setShowAmbulatoriosYears] = useState(false);
  const [showEstablecidosYears, setShowEstablecidosYears] = useState(false);
  const [showVacaciones, setShowVacaciones] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/comercios') || path.includes('/panel-comercializacion')) {
      setShowComercializacion(true);
      if (path.includes('/comercios/')) setShowAmbulatoriosYears(true);
      if (path.includes('/comercios-establecidos/')) setShowEstablecidosYears(true);
    }
    if (path.includes('/social/vacaciones') || path.includes('/social/entrega-polos')) {
        setShowVacaciones(true);
    }
  }, [location.pathname]);

  const linkStyles = "flex items-center gap-3 py-3 px-4 rounded-lg transition-colors cursor-pointer w-full text-sm font-medium text-gray-400 hover:text-white hover:bg-[#27282F]";
  const getNavLinkStyles = ({ isActive }: { isActive: boolean }) => 
    `${linkStyles} ${isActive ? 'bg-[#27282F] text-white font-bold border-l-4 border-blue-500' : ''}`;
  const subLinkStyles = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 py-2 pl-12 pr-4 text-sm rounded-lg transition-colors ${isActive ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`;

  const isSuperUser = userArea === 'ADMIN' || userArea === 'GERENCIA';
  const showComercial = isSuperUser || userArea === 'COMERCIALIZACION';
  const showFiscalizacion = isSuperUser || userArea === 'FISCALIZACION';
  const showSocial = isSuperUser || userArea === 'DESARROLLO_SOCIAL';

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

      <div className={`
          bg-[#1E1F25] fixed top-0 left-0 z-50 
          w-[85%] md:w-[60%] lg:w-72 h-[100dvh] 
          transition-transform duration-300 ease-in-out shadow-xl border-r border-gray-800 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          flex flex-col 
      `}>
        
        {/* 1. HEADER */}
        <div className="shrink-0 p-4 border-b border-gray-800/50">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <img src="https://municerroazul.gob.pe/muni-resources/img/logos/escudo_municipalidad.png" alt="Escudo" className="h-10 w-auto object-contain mt-1 opacity-90" />
                    <div className="flex flex-col">
                        <h1 className="text-white text-xl font-black tracking-tighter leading-none mb-1">SIGEM</h1>
                        <span className="text-[9px] text-gray-300 font-medium leading-tight mb-2">Sistema Integrado de <br /> Gestión Municipal</span>
                        <div className="h-0.5 w-10 bg-red-600 mb-2 rounded-full"></div>
                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest leading-tight">Municipalidad de <br /> Cerro Azul</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden p-2"><RiCloseLine size={24} /></button>
            </div>
        </div>

        {/* 2. NAVEGACIÓN */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-4">
            <nav className="pb-32">
                <ul className="flex flex-col gap-1">
                    
                    {(showComercial || showFiscalizacion) && <li className="px-4 text-[10px] uppercase text-gray-600 font-bold tracking-wider mb-2 mt-2">D.E.T.P.E.</li>}

                    {isSuperUser && (<li><NavLink to="/gerencia" className={getNavLinkStyles} onClick={onClose}><RiBriefcase4Line size={20} /><span>Gerencia General</span></NavLink></li>)}

                    {showComercial && (
                        <li>
                            <div onClick={() => setShowComercializacion(!showComercializacion)} className={`${linkStyles} justify-between ${showComercializacion ? 'text-white bg-[#2a2b32]' : ''}`}>
                                <div className="flex items-center gap-3"><RiStore2Line size={20} className={showComercializacion ? "text-blue-400" : ""} /><span className="truncate">Comercialización</span></div>
                                {showComercializacion ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${showComercializacion ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <ul className="flex flex-col gap-1 mt-1">
                                    <li><NavLink to="/panel-comercializacion" className={subLinkStyles} onClick={onClose} end><RiDashboardLine size={16}/><span>Panel</span></NavLink></li>
                                    <li>
                                        <div onClick={() => setShowAmbulatoriosYears(!showAmbulatoriosYears)} className="flex items-center justify-between py-2 pl-12 pr-4 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors rounded-lg hover:bg-[#27282F]/50">
                                            <div className="flex items-center gap-2"><RiUserVoiceLine size={16}/><span>Ambulatorios</span></div>
                                            {showAmbulatoriosYears ? <RiArrowDownSLine size={12}/> : <RiArrowRightSLine size={12}/>}
                                        </div>
                                        {showAmbulatoriosYears && (
                                            <ul className="flex flex-col gap-1 mt-1 border-l border-gray-700 ml-14">
                                                <li><NavLink to="/comercios/2026" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs ${isActive ? 'text-green-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiCalendarEventLine size={12}/> 2026</NavLink></li>
                                                <li><NavLink to="/comercios/2025" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs ${isActive ? 'text-blue-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiCalendarEventLine size={12}/> 2025</NavLink></li>
                                            </ul>
                                        )}
                                    </li>
                                    <li>
                                        <div onClick={() => setShowEstablecidosYears(!showEstablecidosYears)} className="flex items-center justify-between py-2 pl-12 pr-4 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors rounded-lg hover:bg-[#27282F]/50">
                                            <div className="flex items-center gap-2"><RiBuilding4Line size={16}/><span>Establecidos</span></div>
                                            {showEstablecidosYears ? <RiArrowDownSLine size={12}/> : <RiArrowRightSLine size={12}/>}
                                        </div>
                                        {showEstablecidosYears && (
                                            <ul className="flex flex-col gap-1 mt-1 border-l border-gray-700 ml-14">
                                                <li><NavLink to="/comercios-establecidos/2026" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs ${isActive ? 'text-green-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiCalendarEventLine size={12}/> 2026</NavLink></li>
                                                <li><NavLink to="/comercios-establecidos/2025" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs ${isActive ? 'text-blue-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiCalendarEventLine size={12}/> 2025</NavLink></li>
                                            </ul>
                                        )}
                                    </li>
                                </ul>
                            </div>
                        </li>
                    )}

                    {showFiscalizacion && (<li><NavLink to="/fiscalizacion" className={getNavLinkStyles} onClick={onClose}><RiShieldCheckLine size={20} /><span>Fiscalización</span></NavLink></li>)}

                    {showSocial && (
                        <>
                            <li className="px-4 text-[10px] uppercase text-gray-600 font-bold tracking-wider mb-2 mt-6">Desarrollo Social</li>
                            <li><NavLink to="/panel-social" className={getNavLinkStyles} onClick={onClose} end><RiDashboardLine size={20}/><span>Panel General</span></NavLink></li>
                            
                            {/* NUEVO: Bus Municipal (Primero después de Panel General) */}
                            <li><NavLink to="/social/bus-escolar" className={getNavLinkStyles} onClick={onClose}><RiBusLine size={20}/><span>Bus Municipal</span></NavLink></li>
                            
                            <li><NavLink to="/social/ciam" className={getNavLinkStyles} onClick={onClose}><RiHeartPulseLine size={20}/><span>CIAM</span></NavLink></li>
                            <li><NavLink to="/social/omaped" className={getNavLinkStyles} onClick={onClose}><RiWheelchairLine size={20}/><span>OMAPED</span></NavLink></li>
                            <li><NavLink to="/social/vaso-leche" className={getNavLinkStyles} onClick={onClose}><RiGobletLine size={20}/><span>Vaso de Leche</span></NavLink></li>
                            <li><NavLink to="/social/demuna" className={getNavLinkStyles} onClick={onClose}><RiParentLine size={20}/><span>DEMUNA</span></NavLink></li>
                            <li><NavLink to="/social/biblioteca" className={getNavLinkStyles} onClick={onClose}><RiBookOpenLine size={20}/><span>Biblioteca</span></NavLink></li>
                            <li>
                                <div onClick={() => setShowVacaciones(!showVacaciones)} className={`${linkStyles} justify-between ${showVacaciones ? 'text-white bg-[#2a2b32]' : ''}`}>
                                    <div className="flex items-center gap-3"><RiBasketballLine size={20} className={showVacaciones ? "text-orange-400" : ""} /><span className="truncate">Diviértete y Aprende</span></div>
                                    {showVacaciones ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                                </div>
                                <div className={`overflow-hidden transition-all duration-300 ${showVacaciones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <ul className="flex flex-col gap-1 mt-1 border-l border-gray-700 ml-14">
                                        <li><NavLink to="/social/vacaciones-utiles" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs transition-colors ${isActive ? 'text-orange-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiUserVoiceLine size={12} /> Alumnos</NavLink></li>
                                        <li><NavLink to="/social/entrega-polos" className={({ isActive }) => `flex items-center gap-2 py-2 pl-4 text-xs transition-colors ${isActive ? 'text-green-400 font-bold' : 'text-gray-500 hover:text-white'}`} onClick={onClose}><RiShirtLine size={12} /> Entrega de Polos</NavLink></li>
                                    </ul>
                                </div>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </div>

        {/* 3. FOOTER */}
        <div className="shrink-0 p-4 bg-[#1E1F25] border-t border-gray-800">
            <div className="bg-[#27282F] p-3 rounded-lg border border-gray-700/50">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Estado</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Área</p>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Operativo</span>
                    </div>
                    <span className="text-[9px] text-white bg-gray-700 px-2 py-0.5 rounded truncate max-w-[100px]">{userArea || '...'}</span>
                </div>
            </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;