import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiRefreshLine,
  RiBookletLine,
  RiCheckboxCircleLine,
  RiSearchLine,
  RiInboxArchiveLine,
} from 'react-icons/ri';
import { useAuth } from '../../../context/AuthContext';
import {
  obtenerPrestamosBase,
  obtenerSolicitudesAprobadasBase,
  registrarDevolucionBase,
  registrarPrestamoDesdeSolicitudBase,
  type BasePrestamo,
  type BaseSolicitudAprobada,
} from './services/basePrestamosService';

function formatearFecha(fecha?: string | null) {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function calcularDiasRestantes(fechaMaxima: string, fechaDevolucion?: string | null) {
  if (fechaDevolucion) return 'Devuelto';

  const hoy = new Date();
  const limite = new Date(fechaMaxima);
  const diff = limite.getTime() - hoy.getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (dias < 0) return `${Math.abs(dias)} días atrasado`;
  if (dias === 0) return 'Vence hoy';
  return `${dias} días`;
}

function estaAtrasado(prestamo: BasePrestamo) {
  if (prestamo.fecha_devolucion) return false;

  return new Date(prestamo.fecha_maxima_devolucion).getTime() < new Date().getTime();
}

function estadoVisual(prestamo: BasePrestamo) {
  if (prestamo.estado_prestamo === 'finalizado') {
    return {
      label: 'Finalizado',
      className: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
  }

  if (prestamo.estado_prestamo === 'finalizado_con_incidencia') {
    return {
      label: 'Finalizado con incidencia',
      className: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    };
  }

  if (estaAtrasado(prestamo)) {
    return {
      label: 'Devolución atrasada',
      className: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
  }

  if (prestamo.estado_prestamo === 'renovado') {
    return {
      label: 'Renovado',
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
  }

  return {
    label: 'Activo',
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
}

export default function BasePrestamosPage() {
  const { session, userRole } = useAuth();

  const [solicitudesAprobadas, setSolicitudesAprobadas] = useState<BaseSolicitudAprobada[]>([]);
  const [prestamos, setPrestamos] = useState<BasePrestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [prestamoDevolucion, setPrestamoDevolucion] = useState<BasePrestamo | null>(null);
  const [estadoFisico, setEstadoFisico] = useState<
    'bueno' | 'deteriorado' | 'maltrato' | 'perdida'
  >('bueno');
  const [observacionDevolucion, setObservacionDevolucion] = useState(
    'Devolución registrada correctamente.'
  );

  const usuarioRegistro = session?.user?.email ?? 'usuario_sigem';
  const esOperador = userRole === 'admin';

  const cargarDatos = async () => {
    setLoading(true);

    try {
      const [solicitudesData, prestamosData] = await Promise.all([
        obtenerSolicitudesAprobadasBase(),
        obtenerPrestamosBase(),
      ]);

      setSolicitudesAprobadas(solicitudesData);
      setPrestamos(prestamosData);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los préstamos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const prestamosFiltrados = useMemo(() => {
    const texto = searchTerm.trim().toLowerCase();

    return prestamos.filter((prestamo) => {
      const ciudadano = `${prestamo.ciudadano?.nombres ?? ''} ${
        prestamo.ciudadano?.apellidos ?? ''
      }`;

      const valores = [
        prestamo.solicitud?.codigo_solicitud,
        prestamo.ciudadano?.dni,
        ciudadano,
        prestamo.libro?.titulo,
        prestamo.libro?.codigo,
        prestamo.estado_prestamo,
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto = !texto || valores.includes(texto);

      const coincideFiltro =
        filtro === 'todos' ||
        (filtro === 'activos' && !prestamo.fecha_devolucion && !estaAtrasado(prestamo)) ||
        (filtro === 'atrasados' && estaAtrasado(prestamo)) ||
        (filtro === 'finalizados' && !!prestamo.fecha_devolucion);

      return coincideTexto && coincideFiltro;
    });
  }, [prestamos, searchTerm, filtro]);

  const totalActivos = prestamos.filter((p) => !p.fecha_devolucion && !estaAtrasado(p)).length;
  const totalAtrasados = prestamos.filter((p) => estaAtrasado(p)).length;
  const totalFinalizados = prestamos.filter((p) => !!p.fecha_devolucion).length;

  const handleRegistrarPrestamo = async (solicitud: BaseSolicitudAprobada) => {
    const confirmar = window.confirm(
      `¿Registrar préstamo para la solicitud ${solicitud.codigo_solicitud}?\n\nEl libro pasará a estado "en préstamo" y la devolución será en 7 días.`
    );

    if (!confirmar) return;

    try {
      setProcesandoId(solicitud.id);

      await registrarPrestamoDesdeSolicitudBase(solicitud, usuarioRegistro);

      toast.success('Préstamo registrado correctamente.');
      await cargarDatos();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'No se pudo registrar el préstamo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirModalDevolucion = (prestamo: BasePrestamo) => {
    if (prestamo.fecha_devolucion) {
      toast.error('Este préstamo ya fue devuelto.');
      return;
    }

    setPrestamoDevolucion(prestamo);
    setEstadoFisico('bueno');
    setObservacionDevolucion('Devolución registrada correctamente.');
  };

  const cerrarModalDevolucion = () => {
    setPrestamoDevolucion(null);
    setEstadoFisico('bueno');
    setObservacionDevolucion('Devolución registrada correctamente.');
  };

  const confirmarDevolucion = async () => {
    if (!prestamoDevolucion) return;

    const observacionFinal =
      estadoFisico === 'bueno'
        ? observacionDevolucion.trim() || 'Devolución registrada correctamente.'
        : observacionDevolucion.trim();

    if (estadoFisico !== 'bueno' && !observacionFinal) {
      toast.error('Debes registrar una observación cuando el libro no está en buen estado.');
      return;
    }

    try {
      setProcesandoId(prestamoDevolucion.id);

      await registrarDevolucionBase({
        prestamo: prestamoDevolucion,
        estadoFisico,
        observacion: observacionFinal,
        usuarioRegistro,
      });

      toast.success('Devolución registrada correctamente.');

      cerrarModalDevolucion();
      await cargarDatos();
    } catch (error: any) {
      console.error('Error al registrar devolución:', error);
      toast.error(error?.message ?? 'No se pudo registrar la devolución.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/social/biblioteca"
            className="p-2 rounded-lg hover:bg-[#27282F] text-gray-400 hover:text-white transition-colors"
            title="Volver a B.A.S.E."
          >
            <RiArrowLeftLine size={22} />
          </Link>

          <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
            <RiBookletLine size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Préstamos y entregas
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              B.A.S.E. · Registro de préstamos, entregas y devoluciones
            </p>
          </div>
        </div>

        <button
          onClick={cargarDatos}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors w-fit"
        >
          <RiRefreshLine size={16} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Solicitudes aprobadas</p>
          <p className="text-2xl font-bold text-amber-400">{solicitudesAprobadas.length}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Préstamos activos</p>
          <p className="text-2xl font-bold text-green-400">{totalActivos}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Devoluciones atrasadas</p>
          <p className="text-2xl font-bold text-red-400">{totalAtrasados}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Finalizados</p>
          <p className="text-2xl font-bold text-gray-300">{totalFinalizados}</p>
        </div>
      </div>

      <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4 mb-5">
        <h2 className="text-white font-bold mb-3">
          Solicitudes aprobadas pendientes de entrega
        </h2>

        {loading ? (
          <p className="text-gray-500 text-xs py-4">Cargando solicitudes aprobadas...</p>
        ) : solicitudesAprobadas.length === 0 ? (
          <p className="text-gray-500 text-xs py-4">
            No hay solicitudes aprobadas pendientes de préstamo.
          </p>
        ) : (
          <div className="space-y-2">
            {solicitudesAprobadas.map((solicitud) => (
              <div
                key={solicitud.id}
                className="bg-[#13141a] border border-gray-700 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
              >
                <div>
                  <p className="text-blue-400 font-mono text-xs font-bold">
                    {solicitud.codigo_solicitud}
                  </p>

                  <p className="text-white font-bold mt-1">
                    {solicitud.libro?.titulo ?? 'Sin libro'}
                  </p>

                  <p className="text-gray-500 text-xs">
                    {solicitud.libro?.autor ?? 'Autor no registrado'} ·{' '}
                    {solicitud.libro?.codigo ?? '-'}
                  </p>

                  <p className="text-gray-400 text-xs mt-2">
                    Ciudadano: {solicitud.ciudadano?.nombres}{' '}
                    {solicitud.ciudadano?.apellidos} · DNI:{' '}
                    {solicitud.ciudadano?.dni}
                  </p>
                </div>

                {esOperador ? (
                  <button
                    type="button"
                    onClick={() => handleRegistrarPrestamo(solicitud)}
                    disabled={procesandoId === solicitud.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors disabled:opacity-50 w-fit"
                  >
                    <RiCheckboxCircleLine size={16} />
                    {procesandoId === solicitud.id ? 'Registrando...' : 'Registrar préstamo'}
                  </button>
                ) : (
                  <span className="text-gray-500 text-xs">Sin permisos de operación</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <RiSearchLine
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={16}
            />

            <input
              type="text"
              placeholder="Buscar por código, DNI, ciudadano, libro o estado..."
              className="w-full bg-[#13141a] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-white outline-none focus:border-blue-500 text-xs placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'activos', label: 'Activos' },
              { value: 'atrasados', label: 'Atrasados' },
              { value: 'finalizados', label: 'Finalizados' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFiltro(item.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  filtro === item.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#27282F] text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1E1F25] border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#27282F] text-gray-300 uppercase text-[10px]">
                <th className="px-4 py-3 border border-gray-700">Solicitud</th>
                <th className="px-4 py-3 border border-gray-700">Ciudadano</th>
                <th className="px-4 py-3 border border-gray-700">DNI</th>
                <th className="px-4 py-3 border border-gray-700">Libro</th>
                <th className="px-4 py-3 border border-gray-700">Fecha préstamo</th>
                <th className="px-4 py-3 border border-gray-700">Fecha devolución</th>
                <th className="px-4 py-3 border border-gray-700">Días restantes</th>
                <th className="px-4 py-3 border border-gray-700">Estado</th>
                <th className="px-4 py-3 border border-gray-700 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-300 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 border border-gray-700">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-500 uppercase font-bold tracking-widest">
                        Cargando préstamos...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : prestamosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-16 border border-gray-700 text-gray-500 uppercase font-bold tracking-widest"
                  >
                    No se encontraron préstamos
                  </td>
                </tr>
              ) : (
                prestamosFiltrados.map((prestamo) => {
                  const estado = estadoVisual(prestamo);
                  const ciudadanoNombre = `${prestamo.ciudadano?.nombres ?? ''} ${
                    prestamo.ciudadano?.apellidos ?? ''
                  }`.trim();
                  const puedeDevolver = esOperador && !prestamo.fecha_devolucion;

                  return (
                    <tr
                      key={prestamo.id}
                      className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors"
                    >
                      <td className="px-4 py-3 border border-gray-700 font-mono text-blue-400 font-bold whitespace-nowrap">
                        {prestamo.solicitud?.codigo_solicitud ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 font-bold text-white min-w-[160px]">
                        {ciudadanoNombre || 'Sin ciudadano'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 font-mono">
                        {prestamo.ciudadano?.dni ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[220px]">
                        <div className="font-bold text-white">
                          {prestamo.libro?.titulo ?? 'Sin libro'}
                        </div>
                        <div className="text-gray-500">
                          {prestamo.libro?.autor ?? 'Autor no registrado'} ·{' '}
                          {prestamo.libro?.codigo ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        {formatearFecha(prestamo.fecha_prestamo)}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        {formatearFecha(prestamo.fecha_maxima_devolucion)}
                      </td>

                      <td
                        className={`px-4 py-3 border border-gray-700 whitespace-nowrap ${
                          estaAtrasado(prestamo) ? 'text-red-400 font-bold' : 'text-gray-300'
                        }`}
                      >
                        {calcularDiasRestantes(
                          prestamo.fecha_maxima_devolucion,
                          prestamo.fecha_devolucion
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 text-center">
                        {puedeDevolver ? (
                          <button
                            type="button"
                            onClick={() => abrirModalDevolucion(prestamo)}
                            disabled={procesandoId === prestamo.id}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Registrar devolución"
                          >
                            <RiInboxArchiveLine size={15} />
                            {procesandoId === prestamo.id
                              ? 'Procesando...'
                              : 'Registrar devolución'}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Mostrando {prestamosFiltrados.length} préstamos.
      </div>

      {prestamoDevolucion && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1E1F25] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-white text-lg font-bold">Registrar devolución</h2>

              <p className="text-gray-500 text-xs mt-1">
                B.A.S.E. · Control de entrega y estado físico del libro
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Libro</p>
                <p className="text-white font-bold">
                  {prestamoDevolucion.libro?.titulo ?? 'Sin título'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {prestamoDevolucion.libro?.autor ?? 'Autor no registrado'} ·{' '}
                  {prestamoDevolucion.libro?.codigo ?? '-'}
                </p>
              </div>

              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Ciudadano</p>
                <p className="text-white font-bold">
                  {prestamoDevolucion.ciudadano?.nombres}{' '}
                  {prestamoDevolucion.ciudadano?.apellidos}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  DNI: {prestamoDevolucion.ciudadano?.dni ?? '-'}
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-bold mb-2">
                  Estado físico del libro
                </label>

                <select
                  value={estadoFisico}
                  onChange={(e) => {
                    const value = e.target.value as
                      | 'bueno'
                      | 'deteriorado'
                      | 'maltrato'
                      | 'perdida';

                    setEstadoFisico(value);

                    if (value === 'bueno') {
                      setObservacionDevolucion('Devolución registrada correctamente.');
                    } else {
                      setObservacionDevolucion('');
                    }
                  }}
                  className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="bueno">Bueno</option>
                  <option value="deteriorado">Deteriorado</option>
                  <option value="maltrato">Maltrato</option>
                  <option value="perdida">Pérdida</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-bold mb-2">
                  Observación
                </label>

                <textarea
                  value={observacionDevolucion}
                  onChange={(e) => setObservacionDevolucion(e.target.value)}
                  rows={4}
                  placeholder="Describe el estado del libro o alguna observación de la devolución..."
                  className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
                />
              </div>

              {estadoFisico !== 'bueno' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-orange-300 text-xs">
                    Esta devolución generará una incidencia porque el libro no está en buen
                    estado.
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModalDevolucion}
                disabled={procesandoId === prestamoDevolucion.id}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarDevolucion}
                disabled={procesandoId === prestamoDevolucion.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {procesandoId === prestamoDevolucion.id
                  ? 'Registrando...'
                  : 'Confirmar devolución'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}