// src/components/Modals/QrModal.tsx
import Modal from 'react-modal';
import QRCode from 'react-qr-code';
import { RiCloseLine, RiPrinterLine } from 'react-icons/ri';
import type { Comercio } from '../../types';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  comercio: Comercio | null;
}

const QrModal = ({ isOpen, onClose, comercio }: QrModalProps) => {
  if (!comercio) return null;

  // Definimos qué información va a contener el QR.
  
  const qrValue = JSON.stringify({
    id: comercio.id,
    auto: comercio.numero_autorizacion,
    dni: comercio.dni,
    nombre: `${comercio.nombres} ${comercio.apellidos}`
  });

  const handlePrint = () => {
    window.print(); 
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white p-8 rounded-lg max-w-md w-full mx-auto my-16 shadow-lg outline-none print:shadow-none print:border-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 print:bg-white"
    >
      {/* Encabezado del Modal */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl font-bold">Código QR de Comercio</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <RiCloseLine size={24} />
        </button>
      </div>

      {/* Contenido del QR */}
      <div className="flex flex-col items-center justify-center space-y-4 print:w-full print:h-screen print:flex print:justify-center print:items-center">
        
        {/* Fondo blanco para el QR (necesario para que sea legible) */}
        <div className="bg-white p-4 rounded-lg">
          <QRCode 
            value={qrValue} 
            size={200} 
            level="H" // Nivel de corrección de errores Alto
          />
        </div>

        <div className="text-center print:mt-4">
          <p className="text-lg font-bold text-white print:text-black">{comercio.nombres} {comercio.apellidos}</p>
          <p className="text-gray-400 print:text-black">Aut: {comercio.numero_autorizacion}</p>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold 
            ${comercio.tipo_comercio === 'ESTÁTICO' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}
            print:border print:border-black print:text-black print:bg-transparent`
          }>
            {comercio.tipo_comercio}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mt-8 flex justify-center gap-4 print:hidden">
        <button 
          onClick={onClose} 
          className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
        >
          Cerrar
        </button>
        <button 
          onClick={handlePrint} 
          className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
        >
          <RiPrinterLine /> Imprimir
        </button>
      </div>
    </Modal>
  );
};

export default QrModal;