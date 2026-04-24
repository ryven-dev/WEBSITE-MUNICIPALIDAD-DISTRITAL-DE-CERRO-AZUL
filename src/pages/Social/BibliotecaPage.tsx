// src/pages/Social/BibliotecaPage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
    RiBookOpenLine, RiAddLine, RiSearchLine, 
    RiPencilLine, RiDeleteBinLine 
} from 'react-icons/ri';
import type { Libro } from '../../types';
import LibroForm from '../../components/Forms/LibroForm';
import toast from 'react-hot-toast';


const CLASIFICACIONES_INFO: Record<string, string> = {
    "Generalidades": "Computación, enciclopedias, bibliografía",
    "Filosofía y Psicología": "Ética, lógica, filosofía",
    "Religión": "Mitología, teología",
    "Ciencias Sociales": "Política, economía, derecho, educación",
    "Lenguas": "Idiomas, lingüística",
    "Matemáticas y Ciencias Naturales": "Física, química, biología",
    "Tecnología y Ciencias Aplicadas": "Medicina, ingeniería, agricultura",
    "Artes": "Música, juegos, deportes, diseño",
    "Literatura": "Poesía, teatro, novelas",
    "Historia y Geografía": "Viajes, biografías, historia mundial"
};

const BibliotecaPage = () => {
    // ESTADOS
    const [libros, setLibros] = useState<Libro[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLibro, setSelectedLibro] = useState<Libro | null>(null);

    /**
     * Función para cargar los libros desde Supabase
     */
    const fetchLibros = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('biblioteca_libros')
                .select('*')
                .order('codigo', { ascending: false });
            
            if (error) throw error;
            if (data) setLibros(data);
        } catch (error: any) {
            console.error('Error fetching libros:', error);
            toast.error('Error al cargar inventario de biblioteca');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchLibros();
    }, []);

    /**
     * Lógica de filtrado para el buscador
     */
    const filteredLibros = libros.filter(l => 
        l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.autor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.editorial?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /**
     * ESTILOS TIPO EXCEL (Bordes completos)
     */
    const headerStyle = "px-3 py-3 border border-gray-600 bg-[#27282F] text-gray-200 uppercase text-center font-bold tracking-wider text-[10px]";
    const cellStyle = "px-3 py-2 border border-gray-700 align-middle text-[11px]";

    return (
        <div className="p-4">
            {/* COMPONENTE MODAL PARA REGISTRO Y EDICIÓN */}
            <LibroForm 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSuccess={fetchLibros} 
                dataToEdit={selectedLibro} 
            />

            {/* BARRA SUPERIOR: Título, Estadísticas y Buscador */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <RiBookOpenLine size={24}/>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">Biblioteca Municipal</h1>
                        <p className="text-gray-500 text-[11px] mt-1 uppercase font-medium">Inventario de Libros y Textos</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
                    {/* Contador rápido */}
                    <div className="bg-[#1E1F25] text-gray-400 text-[10px] px-3 py-2 rounded border border-gray-700 flex items-center gap-2">
                        REGISTROS: <span className="text-white font-bold">{filteredLibros.length}</span>
                    </div>

                    {/* Buscador inteligente */}
                    <div className="relative w-full sm:w-64">
                        <RiSearchLine className="absolute left-2.5 top-2.5 text-gray-500" size={14}/>
                        <input 
                            type="text" 
                            placeholder="Buscar título, autor o código..." 
                            className="w-full bg-[#1E1F25] border border-gray-600 rounded py-1.5 pl-8 pr-4 text-white outline-none focus:border-blue-500 text-xs transition-all placeholder:text-gray-600"
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>

                    {/* Botón Registrar */}
                    <button 
                        onClick={() => { setSelectedLibro(null); setIsFormOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded flex items-center gap-2 font-bold transition-all text-xs shadow-lg shadow-blue-900/20"
                    >
                        <RiAddLine size={16}/> REGISTRAR
                    </button>
                </div>
            </div>

            {/* TABLA CON DISEÑO DE REJILLA (EXCEL STYLE) */}
            <div className="bg-[#1E1F25] border border-gray-600 rounded overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead>
                            <tr>
                                <th className={headerStyle}>CÓDIGO</th>
                                <th className={headerStyle}>TÍTULO DEL LIBRO</th>
                                <th className={headerStyle}>CLASIFICACIÓN</th>
                                <th className={headerStyle}>AUTOR</th>
                                <th className={headerStyle}>EDITORIAL</th>
                                <th className={headerStyle}>TOMO</th>
                                <th className={headerStyle}>VALOR REF.</th>
                                <th className={headerStyle}>REGISTRADO POR</th>
                                <th className={headerStyle}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            {loading ? (
                                 <tr>
                                    <td colSpan={9} className="text-center py-20 border border-gray-700">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Cargando Base de Datos...</span>
                                        </div>
                                    </td>
                                 </tr>
                            ) : filteredLibros.length > 0 ? filteredLibros.map((libro) => (
                                <tr key={libro.id} className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors group">
                                    
                                    {/* CÓDIGO CON ESTILO MONO */}
                                    <td className={`${cellStyle} text-center font-mono font-bold text-blue-400`}>
                                        {libro.codigo}
                                    </td>

                                    {/* TÍTULO EN MAYÚSCULAS */}
                                    <td className={`${cellStyle} font-bold text-white uppercase leading-tight min-w-[200px]`}>
                                        {libro.titulo}
                                    </td>

                                    {/* CLASIFICACIÓN CON DESCRIPCIÓN PEQUEÑA */}
                                    <td className={cellStyle}>
                                        <div className="flex flex-col">
                                            <span className="text-blue-200 font-bold leading-none">{libro.clasificacion}</span>
                                            <span className="text-[9px] text-gray-500 italic mt-1 leading-tight">
                                                {CLASIFICACIONES_INFO[libro.clasificacion || ""] || "Sin clasificación definida"}
                                            </span>
                                        </div>
                                    </td>

                                    {/* AUTOR */}
                                    <td className={cellStyle}>
                                        <span className="text-gray-200">{libro.autor || 'N/A'}</span>
                                    </td>

                                    {/* EDITORIAL */}
                                    <td className={cellStyle}>
                                        <span className="text-gray-400">{libro.editorial || 'N/A'}</span>
                                    </td>

                                    {/* TOMO */}
                                    <td className={`${cellStyle} text-center italic text-gray-500`}>
                                        {libro.tomo || '-'}
                                    </td>

                                    {/* VALOR REFERENCIAL (DERECHA) */}
                                    <td className={`${cellStyle} text-right font-mono text-green-400 font-bold`}>
                                        S/ {libro.valor_referencial ? libro.valor_referencial.toFixed(2) : '0.00'}
                                    </td>

                                    {/* USUARIO QUE REGISTRÓ */}
                                    <td className={cellStyle}>
                                        <div className="text-[10px] text-gray-500 uppercase font-medium truncate max-w-[100px]" title={libro.usuario_registro}>
                                            {libro.usuario_registro?.split('@')[0]}
                                        </div>
                                    </td>

                                    {/* BOTONES DE ACCIÓN */}
                                    <td className={cellStyle}>
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => { setSelectedLibro(libro); setIsFormOpen(true); }} 
                                                className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                title="Editar Registro"
                                            >
                                                <RiPencilLine size={16}/>
                                            </button>
                                            <button 
                                                className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                title="Eliminar Registro"
                                            >
                                                <RiDeleteBinLine size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-20 border border-gray-700 text-gray-500 uppercase text-xs font-bold tracking-widest">
                                        No se encontraron registros en la biblioteca
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BibliotecaPage;