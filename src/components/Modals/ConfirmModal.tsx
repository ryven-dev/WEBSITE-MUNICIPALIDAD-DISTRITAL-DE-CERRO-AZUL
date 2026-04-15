// src/components/Modals/ConfirmModal.tsx
import Modal from 'react-modal';
import { RiAlertLine, RiCloseLine } from 'react-icons/ri';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar Acción", 
  message = "¿Estás seguro de que quieres continuar?",
  isLoading = false 
}: ConfirmModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white p-8 rounded-lg max-w-md w-full mx-auto my-16 shadow-lg outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <RiCloseLine size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="text-yellow-400">
          <RiAlertLine size={32} />
        </div>
        <p className="text-gray-300">{message}</p>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          onClick={onConfirm} 
          disabled={isLoading} 
          className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 transition-colors"
        >
          {isLoading ? 'Eliminando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;