// src/pages/Social/BibliotecaPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  RiBookOpenLine, RiAddLine, RiSearchLine,
  RiPencilLine, RiDeleteBinLine,
  RiRefreshLine, RiFilter3Line,
} from 'react-icons/ri';
import type { Libro } from '../../types';
import LibroForm from '../../components/Forms/LibroForm';
import toast from 'react-hot-toast';

type EstadoLibro = 'disponible' | 'reservado' | 'en_prestamo' | 'no_disponible';

type LibroConEstado = Libro & {
  id: string;
  estado?: EstadoLibro | string | null;
  codigo?: string | null;
  titulo: string;
  autor?: string | null;
  editorial?: string | null;
  tomo?: string | null;
  valor_referencial?: number | string | null;
  usuario_registro?: string | null;
  clasificacion?: string | null;
  observaciones?: string | null;
};

const CLASIFICACIONES_INFO: Record<string, string> = {
  Generalidades: 'Computación, enciclopedias, bibliografía',
  'Filosofía y Psicología': 'Ética, lógica, filosofía',
  Religión: 'Mitología, teología',
  'Ciencias Sociales': 'Política, economía, derecho, educación',
  Lenguas: 'Idiomas, lingüística',
  'Matemáticas y Ciencias Naturales': 'Física, química, biología',
  'Tecnología y Ciencias Aplicadas': 'Medicina, ingeniería, agricultura',
  Artes: 'Música, juegos, deportes, diseño',
  Literatura: 'Poesía, teatro, novelas',
  'Historia y Geografía': 'Viajes, biografías, historia mundial',
};

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  en_prestamo: 'En préstamo',
  no_disponible: 'No disponible',
};

const ESTADO_BADGES: Record<string, string> = {
  disponible: 'bg-green-500/15 text-green-300 border-green-500/30',
  reservado: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  en_prestamo: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  no_disponible: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'reservado', label: 'Reservados' },
  { value: 'en_prestamo', label: 'En préstamo' },
  { value: 'no_disponible', label: 'No disponibles' },
];

function obtenerEstadoLibro(libro: LibroConEstado) {
  return libro.estado || 'disponible';
}

function formatearValor(valor: number | string | null | undefined) {
  const numero = Number(valor ?? 0);

  if (Number.isNaN(numero)) {
    return '0.00';
  }

  return numero.toFixed(2);
}

function formatearRegistradoPor(usuario: string | null | undefined) {
  const valor = (usuario ?? '').trim();

  if (!valor) return 'Sistema';

  const nombreSinDominio = valor.includes('@') ? valor.split('@')[0] : valor;

  return nombreSinDominio
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(' ');
}

const BibliotecaPage = () => {
  const [libros, setLibros] = useState<LibroConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLibro, setSelectedLibro] = useState<Libro | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLibros = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('biblioteca_libros')
        .select('*')
        .order('codigo', { ascending: false });

      if (error) throw error;

      setLibros((data ?? []) as LibroConEstado[]);
    } catch (error: any) {
      console.error('Error fetching libros:', error);
      toast.error('Error al cargar inventario de biblioteca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibros();
  }, []);

  const filteredLibros = libros.filter((libro) => {
    const texto = searchTerm.trim().toLowerCase();
    const estado = obtenerEstadoLibro(libro);

    const coincideEstado = estadoFiltro === 'todos' || estado === estadoFiltro;

    const valoresBusqueda = [
      libro.codigo,
      libro.titulo,
      libro.autor,
      libro.editorial,
      libro.clasificacion,
      libro.usuario_registro,
      ESTADO_LABELS[estado] ?? estado,
    ]
      .join(' ')
      .toLowerCase();

    const coincideTexto = !texto || valoresBusqueda.includes(texto);

    return coincideTexto && coincideEstado;
  });

  const totalDisponibles = libros.filter((l) => obtenerEstadoLibro(l) === 'disponible').length;
  const totalReservados = libros.filter((l) => obtenerEstadoLibro(l) === 'reservado').length;
  const totalPrestamo = libros.filter((l) => obtenerEstadoLibro(l) === 'en_prestamo').length;
  const totalNoDisponibles = libros.filter(
    (l) => obtenerEstadoLibro(l) === 'no_disponible'
  ).length;

  const handleEdit = (libro: LibroConEstado) => {
    setSelectedLibro(libro as Libro);
    setIsFormOpen(true);
  };

  const handleDelete = async (libro: LibroConEstado) => {
    const estado = obtenerEstadoLibro(libro);

    if (estado === 'reservado' || estado === 'en_prestamo') {
      toast.error('No se puede eliminar un libro reservado o en préstamo.');
      return;
    }

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el libro "${libro.titulo}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setDeletingId(libro.id);

      const { error } = await supabase
        .from('biblioteca_libros')
        .delete()
        .eq('id', libro.id);

      if (error) throw error;

      toast.success('Libro eliminado correctamente.');
      await fetchLibros();
    } catch (error: any) {
      console.error('Error deleting libro:', error);
      toast.error(
        error?.message ??
          'No se pudo eliminar el libro. Puede estar relacionado con solicitudes o préstamos.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const headerStyle =
    'px-3 py-3 border border-gray-600 bg-[#27282F] text-gray-200 uppercase text-center font-bold tracking-wider text-[10px]';

  const cellStyle = 'px-3 py-2 border border-gray-700 align-middle text-[11px]';

  return (
    <div className="p-4">
      <LibroForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedLibro(null);
        }}
        onSuccess={fetchLibros}
        dataToEdit={selectedLibro}
      />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <RiBookOpenLine size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              Biblioteca Municipal
            </h1>
            <p className="text-gray-500 text-[11px] mt-1 uppercase font-medium">
              Inventario de libros y textos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-start xl:justify-end">
          <div className="bg-[#1E1F25] text-gray-400 text-[10px] px-3 py-2 rounded border border-gray-700 flex items-center gap-2">
            REGISTROS:
            <span className="text-white font-bold">{filteredLibros.length}</span>
          </div>

          <button
            onClick={fetchLibros}
            className="bg-[#1E1F25] hover:bg-[#27282F] text-gray-300 px-3 py-2 rounded border border-gray-700 flex items-center gap-2 font-bold transition-all text-xs"
          >
            <RiRefreshLine size={14} />
            Actualizar
          </button>

          <div className="relative w-full sm:w-64">
            <RiSearchLine className="absolute left-2.5 top-2.5 text-gray-500" size={14} />

            <input
              type="text"
              placeholder="Buscar título, autor o código..."
              className="w-full bg-[#1E1F25] border border-gray-600 rounded py-2 pl-8 pr-4 text-white outline-none focus:border-blue-500 text-xs transition-all placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <RiFilter3Line className="absolute left-2.5 top-2.5 text-gray-500" size={14} />

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full bg-[#1E1F25] border border-gray-600 rounded py-2 pl-8 pr-4 text-white outline-none focus:border-blue-500 text-xs transition-all"
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedLibro(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition-all text-xs shadow-lg shadow-blue-900/20"
          >
            <RiAddLine size={16} />
            REGISTRAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Disponibles</p>
          <p className="text-2xl font-bold text-green-400">{totalDisponibles}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Reservados</p>
          <p className="text-2xl font-bold text-amber-400">{totalReservados}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">En préstamo</p>
          <p className="text-2xl font-bold text-blue-400">{totalPrestamo}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">No disponibles</p>
          <p className="text-2xl font-bold text-red-400">{totalNoDisponibles}</p>
        </div>
      </div>

      <div className="bg-[#1E1F25] border border-gray-600 rounded overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className={headerStyle}>Código</th>
                <th className={headerStyle}>Título del libro</th>
                <th className={headerStyle}>Clasificación</th>
                <th className={headerStyle}>Autor</th>
                <th className={headerStyle}>Editorial</th>
                <th className={headerStyle}>Tomo</th>
                <th className={headerStyle}>Valor ref.</th>
                <th className={headerStyle}>Estado</th>
                <th className={headerStyle}>Registrado por</th>
                <th className={headerStyle}>Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-20 border border-gray-700">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                        Cargando base de datos...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredLibros.length > 0 ? (
                filteredLibros.map((libro) => {
                  const estado = obtenerEstadoLibro(libro);
                  const estadoLabel = ESTADO_LABELS[estado] ?? estado;
                  const estadoClass =
                    ESTADO_BADGES[estado] ??
                    'bg-gray-500/15 text-gray-300 border-gray-500/30';

                  return (
                    <tr
                      key={libro.id}
                      className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors group"
                    >
                      <td className={`${cellStyle} text-center font-mono font-bold text-blue-400`}>
                        {libro.codigo || '-'}
                      </td>

                      <td className={`${cellStyle} font-bold text-white uppercase leading-tight min-w-[200px]`}>
                        {libro.titulo}
                      </td>

                      <td className={cellStyle}>
                        <div className="flex flex-col">
                          <span className="text-blue-200 font-bold leading-none">
                            {libro.clasificacion || 'Sin clasificación'}
                          </span>
                          <span className="text-[9px] text-gray-500 italic mt-1 leading-tight">
                            {CLASIFICACIONES_INFO[libro.clasificacion || ''] ||
                              'Sin clasificación definida'}
                          </span>
                        </div>
                      </td>

                      <td className={cellStyle}>
                        <span className="text-gray-200">{libro.autor || 'N/A'}</span>
                      </td>

                      <td className={cellStyle}>
                        <span className="text-gray-400">{libro.editorial || 'N/A'}</span>
                      </td>

                      <td className={`${cellStyle} text-center italic text-gray-500`}>
                        {libro.tomo || '-'}
                      </td>

                      <td className={`${cellStyle} text-right font-mono text-green-400 font-bold`}>
                        S/ {formatearValor(libro.valor_referencial)}
                      </td>

                      <td className={`${cellStyle} text-center`}>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${estadoClass}`}
                        >
                          {estadoLabel}
                        </span>
                      </td>

                      <td className={`${cellStyle} text-center text-gray-500 uppercase`}>
                        {formatearRegistradoPor(libro.usuario_registro)}
                      </td>

                      <td className={`${cellStyle} text-center`}>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(libro)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Editar libro"
                          >
                            <RiPencilLine size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(libro)}
                            disabled={deletingId === libro.id}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                            title="Eliminar libro"
                          >
                            <RiDeleteBinLine size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-16 border border-gray-700 text-gray-500 uppercase font-bold tracking-widest text-xs"
                  >
                    No se encontraron libros registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Mostrando {filteredLibros.length} de {libros.length} libros registrados.
      </div>
    </div>
  );
};

export default BibliotecaPage;