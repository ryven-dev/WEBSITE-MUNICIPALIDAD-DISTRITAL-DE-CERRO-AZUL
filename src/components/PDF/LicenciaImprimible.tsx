// src/components/PDF/LicenciaImprimible.tsx
import { forwardRef } from 'react';
import type { ComercioEstablecido } from '../../types';

interface LicenciaProps {
  comercio: ComercioEstablecido;
}

const LicenciaImprimible = forwardRef<HTMLDivElement, LicenciaProps>(({ comercio }, ref) => {
  
  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return "___ de ___________ del ____";
    const [year, month, day] = fechaStr.split('-').map(Number);
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${day} de ${meses[month - 1]} del ${year}`;
  };

  const resolucionCompleta = comercio.nro_resolucion 
    ? `Nº ${comercio.nro_resolucion}-${comercio.anio || '2025'}-SGC-GDETPE-MDCA`
    : '___________________________';

  const textBase = "absolute text-black font-bold uppercase text-[16px] leading-tight tracking-wide";

  return (
    <div ref={ref} className="w-[297mm] h-[210mm] relative bg-white print:m-0 overflow-hidden text-black">
      
      {/* 1. IMAGEN DE FONDO */}
      <img 
        src="/sgc/fondo_licencia.png" 
        alt="Plantilla Licencia" 
        className="absolute inset-0 w-full h-full object-fill z-0" 
      />

      {/* 2. DATOS SOBREPUESTOS */}
      
      {/* NÚMERO DE LICENCIA */}
      <div className="absolute top-[20%] left-[69.3%] transform -translate-x-1/2 text-[26px] font-black text-white z-10">
        Nº {comercio.nro_licencia || '____-____'}
      </div>

  {/* --- CUERPO DEL TEXTO LEGAL (CORREGIDO PARA ENCAJAR) --- */}
      <div className="absolute top-[28%] left-[21.5%] w-[70%] h-[16%] text-justify text-[15px] leading-snug z-10 flex items-center text-black">
        <p>
            Habiéndose cumplido con los requisitos establecidos para obtener la Autorización Municipal de Funcionamiento a que se refiere el artículo 7º del Decreto Supremo Nº046-2017-PCM, que aprueba el texto único Ordenando de la Ley Marco de Licencia de Funcionamiento; de conformidad con la 
            <span className="font-bold"> RESOLUCIÓN SUB GERENCIAL {resolucionCompleta}</span>, 
            de fecha <span className="font-bold">{formatFecha(comercio.fecha_resolucion)}</span>; 
            y, con la facultad conferida por el inciso 3.6) numeral 3 del artículo 79º de la ley nº27972- Ley Orgánica de la Municipalidades, se concede 
            <span className="font-bold"> LA LICENCIA DE FUNCIONAMIENTO PARA EL ESTABLECIMIENTO</span>, Según el detalle siguiente:
        </p>
      </div>

      {/* --- COLUMNA IZQUIERDA --- */}
      
      {/* Razón Social */}
      <div className={`${textBase} top-[48.5%] left-[26.3%] w-[25%]`}>
        {comercio.razon_social}
      </div>

      {/* Nombre Comercial (Ahora aquí en lugar de Propietario) */}
      <div className={`${textBase} top-[58.5%] left-[26.3%] w-[25%]`}>
        {comercio.nombre_comercial}
      </div>

      {/* Expediente */}
      <div className={`${textBase} top-[68%] left-[26.3%] w-[25%]`}>
        {comercio.nro_expediente}
      </div>

      {/* RUC */}
      <div className={`${textBase} top-[75%] left-[26.3%] w-[25%]`}>
        {comercio.ruc}
      </div>

      {/* Horario */}
      <div className={`${textBase} top-[82%] left-[26.3%] w-[25%] whitespace-pre-wrap`}>
        {comercio.horario_atencion}
      </div>


      {/* --- COLUMNA DERECHA --- */}
      
      {/* Giro */}
      <div className={`${textBase} top-[48%] left-[67%] w-[25%]`}>
        "{comercio.giro}"
      </div>

      {/* Ubicación */}
      <div className={`${textBase} top-[57%] left-[67%] w-[25%]`}>
        {comercio.direccion}
      </div>

      {/* Área */}
      <div className={`${textBase} top-[65.7%] left-[67%] w-[25%]`}>
        {comercio.area_local ? `${comercio.area_local} M2` : ''}
      </div>

      {/* Vigencia */}
      <div className={`${textBase} top-[69.7%] left-[67%] w-[25%]`}>
        {comercio.fecha_vencimiento ? comercio.fecha_vencimiento : 'INDETERMINADO'}
      </div>

      {/* --- PIE DE PÁGINA --- */}
<div className="absolute bottom-[10%] right-[12%] text-xs font-bold z-10 text-right text-black">
        {/* Usamos comercio.created_at en lugar de new Date() */}
        Cerro Azul, {formatFecha(comercio.created_at?.split('T')[0])}
      </div>

    </div>
  );
});

export default LicenciaImprimible;