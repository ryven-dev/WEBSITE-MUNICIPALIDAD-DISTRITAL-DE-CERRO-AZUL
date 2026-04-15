// src/pages/GerenciaPage.tsx
import { RiBriefcase4Line, RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

const GerenciaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
      
      {/* Icono grande animado */}
      <div className="bg-[#27282F] p-8 rounded-full mb-6 animate-pulse">
        <RiBriefcase4Line size={64} className="text-orange-500" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Gerencia de Desarrollo Social y participación vecinal
      </h1>
      
      <p className="text-gray-400 text-lg max-w-md mb-8">
        Estamos construyendo el panel de control para la <span className="text-orange-400 font-semibold">Gerencia D.S.P.V</span> 
        <br />
        Pronto podrás gestionar reportes generales desde aquí.
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

export default GerenciaPage;