// src/components/DashboardLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar'; 
import Header from './Header/Header';    

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#13141a]"> 
      
      {/* 1. EL SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* 2. EL CONTENIDO PRINCIPAL */}
   
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