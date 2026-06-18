import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiSearchLine,
  RiRefreshLine as RiRenovacionIcon,
} from 'react-icons/ri';
import { useAuth } from '../../../context/AuthContext';
import {
  aprobarRenovacionBase,
  obtenerRenovacionesBase,
  rechazarRenovacionBase,
  type BaseRenovacion,
} from './services/baseRenovacionesService';

const estadoTexto: Record<string, string> = {
  pendiente_revision: 'Pendiente de revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

const estadoColor: Record<string, string> = {
  pendiente_revision: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  aprobada: 'bg-green-500/20 text-green-300 border-green-500/30',
  rechazada: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelada: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

function formatearFecha(fecha?: string | null) {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatearFechaHora(fecha?: string | null) {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcularDiasExtra(fechaAnterior: string, nuevaFecha: string) {
  const anterior = new Date(fechaAnterior).getTime();
  const nueva = new Date(nuevaFecha).getTime();
  const diff = nueva - anterior;
  const dias = Math.round(diff / (1000 * 60 * 60 * 24));

  if (dias <= 0) return 'Sin ampliación';
  return `+${dias} días`;
}

type ModalAccion = 'aprobar' | 'rechazar' | null;

export default function BaseRenovacionesPage() {
  const { session, userRole } = useAuth();

  const [renovaciones, setRenovaciones] = useState<BaseRenovacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [renovacionSeleccionada, setRenovacionSeleccionada] =
    useState<BaseRenovacion | null>(null);
  const [modalAccion, setModalAccion] = useState<ModalAccion>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const usuarioRevision = session?.user?.email ?? 'usuario_sigem';
  const esOperador = userRole === 'admin';

  const cargarRenovaciones = async () => {
    setLoading(true);

    try {
      const data = await obtenerRenovacionesBase();
      setRenovaciones(data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las renovaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRenovaciones();
  }, []);

  const renovacionesFiltradas = useMemo(() => {
    const texto = searchTerm.trim().toLowerCase();

    return renovaciones.filter((renovacion) => {
      const ciudadano = `${renovacion.prestamo?.ciudadano?.nombres ?? ''} ${
        renovacion.prestamo?.ciudadano?.apellidos ?? ''
      }`;

      const valores = [
        renovacion.prestamo?.solicitud?.codigo_solicitud,
        renovacion.prestamo?.ciudadano?.dni,
        ciudadano,
        renovacion.prestamo?.ciudadano?.correo,
        renovacion.prestamo?.libro?.titulo,
        renovacion.prestamo?.libro?.codigo,
        renovacion.estado_renovacion,
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto = !texto || valores.includes(texto);

      const coincideEstado =
        estadoFiltro === 'todas' || renovacion.estado_renovacion === estadoFiltro;

      return coincideTexto && coincideEstado;
    });
  }, [renovaciones, searchTerm, estadoFiltro]);

  const totalPendientes = renovaciones.filter(
    (r) => r.estado_renovacion === 'pendiente_revision'
  ).length;

  const totalAprobadas = renovaciones.filter(
    (r) => r.estado_renovacion === 'aprobada'
  ).length;

  const totalRechazadas = renovaciones.filter(
    (r) => r.estado_renovacion === 'rechazada'
  ).length;

  const totalCanceladas = renovaciones.filter(
    (r) => r.estado_renovacion === 'cancelada'
  ).length;

  const abrirModal = (renovacion: BaseRenovacion, accion: ModalAccion) => {
    setRenovacionSeleccionada(renovacion);
    setModalAccion(accion);
    setMotivoRechazo('');
  };

  const cerrarModal = () => {
    setRenovacionSeleccionada(null);
    setModalAccion(null);
    setMotivoRechazo('');
  };

  const confirmarAccion = async () => {
    if (!renovacionSeleccionada || !modalAccion) return;

    try {
      setProcesandoId(renovacionSeleccionada.id);

      if (modalAccion === 'aprobar') {
        await aprobarRenovacionBase({
          renovacion: renovacionSeleccionada,
          usuarioRevision,
        });

        toast.success('Renovación aprobada correctamente.');
      }

      if (modalAccion === 'rechazar') {
        await rechazarRenovacionBase({
          renovacion: renovacionSeleccionada,
          motivo: motivoRechazo,
          usuarioRevision,
        });

        toast.success('Renovación rechazada correctamente.');
      }

      cerrarModal();
      await cargarRenovaciones();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'No se pudo procesar la renovación.');
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

          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
            <RiRenovacionIcon size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Renovaciones
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              B.A.S.E. · Gestión de solicitudes de ampliación de préstamo
            </p>
          </div>
        </div>

        <button
          onClick={cargarRenovaciones}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors w-fit"
        >
          <RiRefreshLine size={16} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Pendientes</p>
          <p className="text-2xl font-bold text-amber-400">{totalPendientes}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Aprobadas</p>
          <p className="text-2xl font-bold text-green-400">{totalAprobadas}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Rechazadas</p>
          <p className="text-2xl font-bold text-red-400">{totalRechazadas}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Canceladas</p>
          <p className="text-2xl font-bold text-gray-300">{totalCanceladas}</p>
        </div>
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
              placeholder="Buscar por solicitud, DNI, ciudadano, correo, libro o código..."
              className="w-full bg-[#13141a] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-white outline-none focus:border-blue-500 text-xs placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'todas', label: 'Todas' },
              { value: 'pendiente_revision', label: 'Pendientes' },
              { value: 'aprobada', label: 'Aprobadas' },
              { value: 'rechazada', label: 'Rechazadas' },
              { value: 'cancelada', label: 'Canceladas' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setEstadoFiltro(item.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  estadoFiltro === item.value
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
                <th className="px-4 py-3 border border-gray-700">Fecha solicitud</th>
                <th className="px-4 py-3 border border-gray-700">Ciudadano</th>
                <th className="px-4 py-3 border border-gray-700">DNI</th>
                <th className="px-4 py-3 border border-gray-700">Libro</th>
                <th className="px-4 py-3 border border-gray-700">Fecha actual</th>
                <th className="px-4 py-3 border border-gray-700">Nueva fecha</th>
                <th className="px-4 py-3 border border-gray-700">Días extra</th>
                <th className="px-4 py-3 border border-gray-700">Estado</th>
                <th className="px-4 py-3 border border-gray-700 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-300 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 border border-gray-700">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-500 uppercase font-bold tracking-widest">
                        Cargando renovaciones...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : renovacionesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-16 border border-gray-700 text-gray-500 uppercase font-bold tracking-widest"
                  >
                    No se encontraron renovaciones
                  </td>
                </tr>
              ) : (
                renovacionesFiltradas.map((renovacion) => {
                  const ciudadanoNombre = `${renovacion.prestamo?.ciudadano?.nombres ?? ''} ${
                    renovacion.prestamo?.ciudadano?.apellidos ?? ''
                  }`.trim();

                  const estadoClass =
                    estadoColor[renovacion.estado_renovacion] ??
                    'bg-gray-500/20 text-gray-300 border-gray-500/30';

                  const puedeGestionar =
                    esOperador && renovacion.estado_renovacion === 'pendiente_revision';

                  return (
                    <tr
                      key={renovacion.id}
                      className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors"
                    >
                      <td className="px-4 py-3 border border-gray-700 font-mono text-blue-400 font-bold whitespace-nowrap">
                        {renovacion.prestamo?.solicitud?.codigo_solicitud ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        <div>{formatearFecha(renovacion.fecha_solicitud)}</div>
                        <div className="text-gray-500 text-[10px]">
                          {formatearFechaHora(renovacion.fecha_solicitud)}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 font-bold text-white min-w-[170px]">
                        {ciudadanoNombre || 'Sin ciudadano'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 font-mono">
                        {renovacion.prestamo?.ciudadano?.dni ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[220px]">
                        <div className="font-bold text-white">
                          {renovacion.prestamo?.libro?.titulo ?? 'Sin libro'}
                        </div>
                        <div className="text-gray-500">
                          {renovacion.prestamo?.libro?.autor ?? 'Autor no registrado'} ·{' '}
                          {renovacion.prestamo?.libro?.codigo ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        {formatearFecha(renovacion.fecha_anterior_devolucion)}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap text-green-300 font-bold">
                        {formatearFecha(renovacion.nueva_fecha_devolucion)}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap text-purple-300 font-bold">
                        {calcularDiasExtra(
                          renovacion.fecha_anterior_devolucion,
                          renovacion.nueva_fecha_devolucion
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${estadoClass}`}
                        >
                          {estadoTexto[renovacion.estado_renovacion] ??
                            renovacion.estado_renovacion}
                        </span>

                        {renovacion.fecha_revision && (
                          <div className="text-gray-500 text-[10px] mt-1">
                            Revisión: {formatearFecha(renovacion.fecha_revision)}
                          </div>
                        )}

                        {renovacion.motivo_rechazo && (
                          <div className="text-red-300 text-[10px] mt-1">
                            {renovacion.motivo_rechazo}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 text-center">
                        {puedeGestionar ? (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModal(renovacion, 'aprobar')}
                              disabled={procesandoId === renovacion.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                              title="Aprobar renovación"
                            >
                              <RiCheckboxCircleLine size={14} />
                              Aprobar
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModal(renovacion, 'rechazar')}
                              disabled={procesandoId === renovacion.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                              title="Rechazar renovación"
                            >
                              <RiCloseCircleLine size={14} />
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">
                            Sin acciones
                          </span>
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
        Mostrando {renovacionesFiltradas.length} renovaciones.
      </div>

      {renovacionSeleccionada && modalAccion && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1E1F25] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-white text-lg font-bold">
                {modalAccion === 'aprobar'
                  ? 'Aprobar renovación'
                  : 'Rechazar renovación'}
              </h2>

              <p className="text-gray-500 text-xs mt-1">
                B.A.S.E. · Control de ampliación de préstamo
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Libro</p>
                <p className="text-white font-bold">
                  {renovacionSeleccionada.prestamo?.libro?.titulo ?? 'Sin título'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {renovacionSeleccionada.prestamo?.libro?.autor ??
                    'Autor no registrado'}{' '}
                  · {renovacionSeleccionada.prestamo?.libro?.codigo ?? '-'}
                </p>
              </div>

              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Ciudadano</p>
                <p className="text-white font-bold">
                  {renovacionSeleccionada.prestamo?.ciudadano?.nombres}{' '}
                  {renovacionSeleccionada.prestamo?.ciudadano?.apellidos}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  DNI: {renovacionSeleccionada.prestamo?.ciudadano?.dni ?? '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Fecha actual</p>
                  <p className="text-white font-bold">
                    {formatearFecha(renovacionSeleccionada.fecha_anterior_devolucion)}
                  </p>
                </div>

                <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Nueva fecha</p>
                  <p className="text-green-300 font-bold">
                    {formatearFecha(renovacionSeleccionada.nueva_fecha_devolucion)}
                  </p>
                </div>
              </div>

              {modalAccion === 'rechazar' && (
                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-2">
                    Motivo del rechazo
                  </label>

                  <textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    rows={4}
                    placeholder="Ej: El préstamo ya fue renovado anteriormente / el libro tiene otra solicitud pendiente..."
                    className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
                  />
                </div>
              )}

              {modalAccion === 'aprobar' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                  <p className="text-green-300 text-xs">
                    Al aprobar, la fecha máxima de devolución del préstamo será actualizada
                    automáticamente y el préstamo pasará a estado renovado.
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={procesandoId === renovacionSeleccionada.id}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAccion}
                disabled={procesandoId === renovacionSeleccionada.id}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                  modalAccion === 'aprobar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {procesandoId === renovacionSeleccionada.id
                  ? 'Procesando...'
                  : modalAccion === 'aprobar'
                    ? 'Confirmar aprobación'
                    : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}