// src/components/PDF/CarnetImprimible.tsx
import { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import type { Comercio } from '../../types';

interface CarnetProps {
  comercio: Comercio;
}

const CarnetImprimible = forwardRef<HTMLDivElement, CarnetProps>(({ comercio }, ref) => {  
   const idFormatted = comercio.numero_autorizacion 
    ? comercio.numero_autorizacion.toString().padStart(3, '0') 
    : '000';

  const textStyle = "absolute font-bold text-black text-[13px] uppercase leading-none";

  // --- LÓGICA PARA SEPARAR APELLIDOS ---
  // Tomamos la cadena completa "RIVERA ZEVALLOS"
  const apellidosFull = comercio.apellidos || '';
  // Buscamos dónde está el primer espacio
  const primerEspacioIndex = apellidosFull.indexOf(' ');

  let apellidoPaterno = '';
  let apellidoMaterno = '';

  if (primerEspacioIndex !== -1) {
    // Si hay espacio, partimos la cadena
    apellidoPaterno = apellidosFull.substring(0, primerEspacioIndex); // "RIVERA"
    apellidoMaterno = apellidosFull.substring(primerEspacioIndex + 1); // "ZEVALLOS"
  } else {
    // Si no hay espacio (solo tiene un apellido), lo ponemos todo en el primero
    apellidoPaterno = apellidosFull;
  }

  return (
    <div ref={ref} className="w-full h-full bg-white p-0 m-0">
      
      <div className="flex flex-row gap-6 w-max transform scale-[1.35] origin-top-left mt-10 ml-10">
        
        {/* ================= CARA FRONTAL ================= */}
        <div className="relative w-[450px] border border-gray-300 print:border-none shrink-0">
          
          <img 
            src="/sgc/carnet_front.jpg" 
            className="w-full h-auto block" 
            alt="Frente" 
          />

          <div className="absolute inset-0">
            
            {/* ID */}
            <div className="absolute top-[3.5%] right-[8%] text-xl font-black text-black tracking-widest z-20">
                {idFormatted}
            </div>

            {/* N° Autorización */}
            <div className="absolute top-[19%] w-full text-center text-white font-bold text-[13px]">
               AUTORIZACIÓN TEMPORAL N°{comercio.numero_autorizacion_temporal || '---'}
            </div>

            {/* NOMBRES */}
            <div className={`${textStyle} top-[35%] left-[22%] w-[50%]`}>{comercio.nombres}</div>
            
            {/* APELLIDO PATERNO (Primer recuadro) */}
            <div className={`${textStyle} top-[43%] left-[22%] w-[50%]`}>
                {apellidoPaterno}
            </div>

            {/* APELLIDO MATERNO (Segundo recuadro - NUEVO) */}
            {/* Calculado: Si el anterior es 43% y la diferencia es aprox 9%, este va en 52% */}
            <div className={`${textStyle} top-[51%] left-[22%] w-[50%]`}>
                {apellidoMaterno}
            </div>

            {/* GIRO */}
            <div className={`${textStyle} top-[61%] left-[22%] w-[60%]`}>{comercio.giro}</div>
            
            {/* UBICACIÓN */}
            <div className={`${textStyle} top-[69%] left-[22%] w-[60%]`}>{comercio.ubicacion}</div>

            {/* --- LÓGICA DE CÍRCULOS PINTADOS --- */}
            
            {comercio.tipo_comercio === 'ESTÁTICO' && (
              <div className="absolute top-[80%] left-[20.2%] w-3 h-3 bg-black rounded-full z-20" />
            )}
            {comercio.tipo_comercio === 'MÓVIL' && (
              <div className="absolute top-[80%] left-[37.7%] w-3 h-3 bg-black rounded-full z-20" />
            )}

            {comercio.turno.includes('MAÑANA') && (
              <div className="absolute top-[85.1%] left-[20.2%] w-3 h-3 bg-black rounded-full z-20" />
            )}
            {comercio.turno.includes('TARDE') && (
              <div className="absolute top-[85%] left-[37.8%] w-3 h-3 bg-black rounded-full z-20" />
            )}
            {comercio.turno.includes('NOCHE') && (
              <div className="absolute top-[85.2%] left-[55.3%] w-3 h-3 bg-black rounded-full z-20" />
            )}
            
            {/* QR */}
            <div className="absolute bottom-[11%] right-[6.5%] bg-white p-0.5">
                <QRCode 
                    value={JSON.stringify({ id: comercio.id, dni: comercio.dni, aut: comercio.numero_autorizacion_temporal })} 
                    size={65} 
                    level="M"
                />
            </div>
          </div>
        </div>

        {/* ================= CARA POSTERIOR ================= */}
        <div className="relative w-[450px] border border-gray-300 print:border-none shrink-0">
          <img 
            src="/sgc/carnet_back.jpg" 
            className="w-full h-auto block" 
            alt="Reverso" 
          />

          <div className="absolute inset-0">
            <div className={`${textStyle} top-[5%] left-[25%] w-[58%]`}>{comercio.domicilio}</div>
            <div className={`${textStyle} top-[15%] left-[52%]`}>{comercio.dni}</div>
            <div className={`${textStyle} top-[22%] left-[52%]`}>{comercio.fecha_expedicion}</div>
            <div className={`${textStyle} top-[30%] left-[52%]`}>{comercio.fecha_caducidad}</div>
            <div className={`${textStyle} top-[37%] left-[52%]`}>{comercio.horario}</div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default CarnetImprimible;