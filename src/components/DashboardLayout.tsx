// src/components/DashboardLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar'; // Asegúrate que la ruta sea correcta
import Header from './Header/Header';    // Asegúrate que la ruta sea correcta

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#13141a]"> {/* Fondo general de la app */}
      
      {/* 1. EL SIDEBAR (Siempre fijo a la izquierda) */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* 2. EL CONTENIDO PRINCIPAL */}
      {/* 
          lg:ml-72 -> ESTA ES LA CLAVE. 
          En pantallas grandes (Desktop), empujamos el contenido 72 unidades (288px) 
          a la derecha para que el Sidebar no lo tape.
      */}
      <div className="flex flex-col min-h-screen transition-all duration-300 lg:ml-72">
        
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Aquí se renderizan las páginas (Dashboard, Comercios, etc.) */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;