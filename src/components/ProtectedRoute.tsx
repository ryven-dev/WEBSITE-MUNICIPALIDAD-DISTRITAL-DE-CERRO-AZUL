// src/components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#181A20] flex items-center justify-center text-white">Cargando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Renderiza el contenido de la ruta protegida (ej: el Dashboard)
};

export default ProtectedRoute;