// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 1. IMPORTAR EL HOOK
import { useAuth } from './context/AuthContext';

// Páginas
import LoginPage from './pages/LoginPage';
import ComerciosPage from './pages/ComerciosPage';
import Dashboard from './components/Dashboard';
import EstablecidosPage from './pages/EstablecidosPage';
import GerenciaPage from './pages/GerenciaPage';
import FiscalizacionPage from './pages/FiscalizacionPage'; 
import DashboardSocial from './components/DashboardSocial'; 

// Layout y Protección
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AlumnosVacacionesPage from './pages/Social/AlumnosVacacionesPage';
import EntregaPolosPage from './pages/Social/EntregaPolosPage';
import BibliotecaPage from './pages/Social/BibliotecaPage'; // Importar
import BusEscolarPage from './pages/Social/BusEscolarPage'; // Importar

// Componente para redirigir según el área
const HomeRedirect = () => {
  const { userArea, loading, session } = useAuth(); 
  
  // 1. Si está cargando, mostramos spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#13141a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-sm">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  // 2. Si no hay sesión, mandarlo al login (Seguridad extra)
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. (CORRECCIÓN) Si hay sesión pero el área aún no llega, esperamos un poco más
  // Esto evita que te mande al default por error.
  if (!userArea) {
     return (
      <div className="min-h-screen bg-[#13141a] flex items-center justify-center">
        <span className="text-gray-500 text-sm animate-pulse">Obteniendo permisos...</span>
      </div>
    );
  }
  
  // 4. Redirecciones Específicas
  if (userArea === 'DESARROLLO_SOCIAL') {
    return <Navigate to="/panel-social" replace />;
  }

  if (userArea === 'FISCALIZACION') {
    return <Navigate to="/fiscalizacion" replace />;
  }
  
  // 5. Default (Admin, Gerencia, Comercialización)
  return <Navigate to="/panel-comercializacion" replace />;
};

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            
            {/* Redirección Inicial Inteligente */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Paneles de Control */}
            <Route path="/panel-comercializacion" element={<Dashboard />} />
            <Route path="/panel-social" element={<DashboardSocial />} />
            
            {/* Comercialización (Con Año) */}
            <Route path="/comercios/:anio" element={<ComerciosPage />} />
            <Route path="/comercios-establecidos/:anio" element={<EstablecidosPage />} />
            
            {/* Gerencia */}
            <Route path="/gerencia" element={<GerenciaPage />} />

            {/* Fiscalización */}
            <Route path="/fiscalizacion" element={<FiscalizacionPage />} />

            {/* Rutas de los Programas Sociales */}
            <Route path="/social/:programa" element={<GerenciaPage />} />
            <Route path="/social/vacaciones-utiles" element={<AlumnosVacacionesPage />} />
            <Route path="/social/entrega-polos" element={<EntregaPolosPage />} />
            <Route path="/social/biblioteca" element={<BibliotecaPage />} />
            <Route path="/social/bus-escolar" element={<BusEscolarPage />} />

          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;