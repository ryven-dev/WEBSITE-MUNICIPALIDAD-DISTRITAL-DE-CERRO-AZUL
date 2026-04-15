// src/components/Header/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { 
  RiMenuLine, 
  RiNotification3Line, 
  RiSearchLine, 
  RiHome4Line, 
  RiArrowRightSLine,
  RiLogoutBoxRLine,
  RiUserSettingsLine,
  RiArrowDownSLine
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session, signOut, userArea } = useAuth(); 
  const location = useLocation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageNames: Record<string, string> = {
    '/': 'Panel de Control',
    '/panel-comercializacion': 'Panel de Control',
    '/comercios': 'Comerciantes Ambulatorios',
    '/comercios-establecidos': 'Comerciantes Establecidos',
    '/gerencia': 'Gerencia D.E.T.P.E.',
    '/fiscalizacion': 'Fiscalización',
  };

  // --- LÓGICA DE ETIQUETA GENERALIZADA ---
  const getUserLabel = () => {
    // Solo la cuenta maestra se ve como Admin
    if (userArea === 'ADMIN') return 'Administrador';
    
    // Para Gleidys, Fabiola, Miguel y cualquier otro:
    return 'Usuario Municipal';
  };

  const userLabel = getUserLabel();
  const currentTitle = pageNames[location.pathname] || 'Sección';
  const userEmail = session?.user?.email || 'Usuario';
  const userName = userEmail.split('@')[0].replace('.', ' '); 

  return (
    <header className="bg-[#1E1F25] h-[8vh] flex items-center justify-between px-6 border-b border-gray-800 relative z-30">
      
      {/* IZQUIERDA */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white">
          <RiMenuLine size={24} />
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-400 transition-colors">
                <RiHome4Line size={16} />
            </Link>
            <RiArrowRightSLine size={14} />
            <span className="hidden md:inline">Dashboard</span>
            <RiArrowRightSLine size={14} className="hidden md:inline" />
            <span className="text-white font-medium capitalize">{currentTitle}</span>
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-6">
        
        {/* Buscador */}
        <div className="hidden md:flex items-center bg-[#27282F] rounded-full px-4 py-2 w-64 border border-gray-700/50 focus-within:border-gray-600 transition-colors">
            <RiSearchLine className="text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="bg-transparent border-none outline-none text-white text-xs ml-2 w-full placeholder-gray-500"
            />
        </div>

        <div className="flex items-center gap-4">
            <button className="relative text-gray-400 hover:text-white transition-colors">
                <RiNotification3Line size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            
            {/* PERFIL */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-4 border-l border-gray-700 hover:bg-[#27282F] p-2 rounded-lg transition-colors"
                >
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-white font-medium capitalize leading-none mb-1">{userName}</p>
                        
                        {/* ETIQUETA GENERALIZADA */}
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">
                            {userLabel}
                        </p>
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    
                    <RiArrowDownSLine className={`text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* MENU FLOTANTE */}
                {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#1E1F25] border border-gray-700 rounded-xl shadow-2xl py-2 animate-fade-in-down origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-700 mb-2">
                            <p className="text-sm text-white font-bold capitalize">{userName}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{userLabel}</p>
                        </div>

                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#27282F] hover:text-blue-400 flex items-center gap-2 transition-colors">
                            <RiUserSettingsLine size={16} />
                            Mi Perfil
                        </button>

                        <div className="border-t border-gray-700 my-2"></div>

                        <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 transition-colors font-medium">
                            <RiLogoutBoxRLine size={16} />
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>

        </div>
      </div>

    </header>
  );
};

export default Header;