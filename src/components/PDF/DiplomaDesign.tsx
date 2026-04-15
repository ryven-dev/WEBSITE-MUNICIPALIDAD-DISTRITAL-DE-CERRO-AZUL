import { forwardRef } from 'react';

interface DiplomaDesignProps {
  nombre: string;
}

const DiplomaDesign = forwardRef<HTMLDivElement, DiplomaDesignProps>(({ nombre }, ref) => {
  return (
    // Dimensiones exactas A4 apaisado: 297mm x 210mm
    <div 
        ref={ref} 
        className="relative bg-white overflow-hidden text-black"
        style={{ width: '297mm', height: '210mm', margin: 0, padding: 0 }}
    >
      
      {/* 1. IMAGEN DE FONDO */}
      <img 
        src="/sgc/diploma_vacaciones.png"
        alt="Diploma Fondo" 
        className="absolute top-0 left-0 w-full h-full object-cover z-0 block"
      />

      {/* 2. NOMBRE DEL NIÑO */}
      {/* Ajusta 'top' según dónde esté la línea negra en tu imagen */}
      <div 
        className="absolute w-full text-center z-10 font-bold uppercase tracking-widest text-[#1a2e35]"
        style={{ 
            top: '46%',          // <--- Juega con esto para subir/bajar el nombre
            fontFamily: '"Times New Roman", Times, serif', // Una fuente clásica pero legible
            fontSize: '40px',    // Tamaño grande
            textShadow: '2px 2px 0px rgba(255,255,255,0.8)' // Sombra blanca sutil para legibilidad
        }}
      >
        {nombre}
      </div>

    </div>
  );
});

export default DiplomaDesign;