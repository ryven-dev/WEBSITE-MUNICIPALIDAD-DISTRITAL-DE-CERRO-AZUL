// src/pages/FiscalizacionPage.tsx
import { RiShieldCheckLine, RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

const FiscalizacionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
      
      {/* Icono grande animado */}
      <div className="bg-[#27282F] p-8 rounded-full mb-6 animate-pulse">
        <RiShieldCheckLine size={64} className="text-red-500" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Subgerencia de Fiscalización
      </h1>
      
      <p className="text-gray-400 text-lg max-w-md mb-8">
        Estamos construyendo el módulo de <span className="text-red-400 font-semibold">Control y Sanciones</span>. 
        <br />
        Pronto podrás gestionar papeletas e inspecciones desde aquí.
      </p>

      {/* Botón para regresar */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
      >
        <RiArrowLeftLine />
        Volver al Inicio
      </button>
    </div>
  );
};

export default FiscalizacionPage;