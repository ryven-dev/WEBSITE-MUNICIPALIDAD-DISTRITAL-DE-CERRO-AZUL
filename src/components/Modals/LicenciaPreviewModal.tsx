import { useRef, useState } from 'react';
import Modal from 'react-modal';
import { useReactToPrint } from 'react-to-print';
import { RiCloseLine, RiPrinterLine, RiDownloadLine, RiLoader4Line } from 'react-icons/ri';
// @ts-ignore
import html2pdf from 'html2pdf.js'; // Importamos la librería (ignoramos error de tipos si no tienes @types)

import LicenciaImprimible from '../PDF/LicenciaImprimible';
import type { ComercioEstablecido } from '../../types';

interface LicenciaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ComercioEstablecido | null;
}

const LicenciaPreviewModal = ({ isOpen, onClose, data }: LicenciaPreviewModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. FUNCIÓN PARA IMPRIMIR (Diálogo del navegador)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Licencia_${data?.nro_licencia || 'documento'}`,
  });

  // 2. FUNCIÓN PARA DESCARGAR PDF DIRECTAMENTE
  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    setIsDownloading(true);

    const element = printRef.current;
    const opt = {
      margin:       0,
      filename:     `Licencia_${data?.nro_licencia || 'SGC'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Scale 2 mejora la calidad
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // A4 Horizontal
    };

    // Generar y guardar
    html2pdf().set(opt as any).from(element).save().then(() => {
        setIsDownloading(false);
    });
  };

  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white rounded-lg w-[95%] h-[90%] max-w-7xl mx-auto my-4 shadow-2xl outline-none border border-gray-700 flex flex-col"
      overlayClassName="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#27282F] rounded-t-lg shrink-0">
        <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
           🪪 Vista Previa de Licencia
        </h3>
        
        <div className="flex items-center gap-3">
            
            {/* BOTÓN 1: DESCARGAR PDF */}
            <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
                {isDownloading ? <RiLoader4Line className="animate-spin"/> : <RiDownloadLine size={20} />}
                {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </button>

            {/* BOTÓN 2: IMPRIMIR */}
            <button 
                onClick={() => handlePrint()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
                <RiPrinterLine size={20} /> Imprimir
            </button>
            
            <div className="h-8 w-[1px] bg-gray-600 mx-2"></div>

            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <RiCloseLine size={28} />
            </button>
        </div>
      </div>

      {/* CONTENIDO (PAPEL) */}
      <div className="flex-1 bg-[#525659] overflow-auto p-8 flex justify-center custom-scrollbar">
        <div className="shadow-2xl">
            {/* Aquí renderizamos tu diseño exacto */}
            <LicenciaImprimible ref={printRef} comercio={data} />
        </div>
      </div>
    </Modal>
  );
};

export default LicenciaPreviewModal;