import { useRef} from 'react';
import Modal from 'react-modal';
import { useReactToPrint } from 'react-to-print';
import { RiCloseLine, RiPrinterLine } from 'react-icons/ri';


import DiplomaDesign from '../PDF/DiplomaDesign';

interface DiplomaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nombre: string;
}

const DiplomaPreviewModal = ({ isOpen, onClose, nombre }: DiplomaPreviewModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${nombre.replace(/ /g, '_')}`,
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-[#1E1F25] text-white rounded-lg w-[95%] h-[90%] max-w-7xl mx-auto my-4 shadow-2xl outline-none border border-gray-700 flex flex-col"
      overlayClassName="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#27282F] rounded-t-lg shrink-0">
        <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">🎓 Diploma</h3>
        <div className="flex items-center gap-3">

            <button onClick={() => handlePrint()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <RiPrinterLine size={20} /> Imprimir
            </button>
            <div className="h-8 w-[1px] bg-gray-600 mx-2"></div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1"><RiCloseLine size={28} /></button>
        </div>
      </div>
      <div className="flex-1 bg-[#525659] overflow-auto p-8 flex justify-center custom-scrollbar">
         <div className="shadow-2xl bg-white origin-top transform scale-75 lg:scale-90"> 
             <DiplomaDesign ref={printRef} nombre={nombre} />
         </div>
      </div>
    </Modal>
  );
};

export default DiplomaPreviewModal;