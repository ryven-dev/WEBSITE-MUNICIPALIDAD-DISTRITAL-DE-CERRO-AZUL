import Modal from 'react-modal';
import { RiCloseLine, RiDownloadLine, RiExternalLinkLine } from 'react-icons/ri';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
}

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName }: FileViewerModalProps) => {
  if (!fileUrl) return null;

  // Detectar tipo de archivo
  const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white rounded-lg w-[95%] h-[90%] max-w-6xl mx-auto my-4 shadow-2xl outline-none border border-gray-700 flex flex-col"
      overlayClassName="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#27282F] rounded-t-lg">
        <h3 className="font-bold text-lg truncate pr-4 text-orange-400">
            📄 {fileName || 'Documento de Defensa Civil'}
        </h3>
        <div className="flex items-center gap-3">
            {/* Botón Descargar */}
            <a href={fileUrl} download className="text-gray-400 hover:text-white transition-colors" title="Descargar">
                <RiDownloadLine size={24} />
            </a>
            {/* Botón Abrir en nueva pestaña (por si acaso falla el visor) */}
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Abrir en pestaña nueva">
                <RiExternalLinkLine size={24} />
            </a>
            {/* Cerrar */}
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <RiCloseLine size={28} />
            </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 bg-[#1a1b20] relative overflow-hidden flex items-center justify-center p-2">
        {isPdf ? (
            <iframe 
                src={`${fileUrl}#toolbar=0`} 
                className="w-full h-full rounded border-none"
                title="Visor PDF"
            />
        ) : isImage ? (
            <img 
                src={fileUrl} 
                alt="Certificado" 
                className="max-w-full max-h-full object-contain rounded shadow-lg" 
            />
        ) : (
            <div className="text-center p-10">
                <p className="text-gray-400 text-lg mb-4">Este tipo de archivo no tiene vista previa directa.</p>
                <a 
                    href={fileUrl} 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                    <RiDownloadLine /> Descargar para ver
                </a>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default FileViewerModal;