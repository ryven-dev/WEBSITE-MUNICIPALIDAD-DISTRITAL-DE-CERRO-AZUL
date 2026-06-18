import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiAlertLine,
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiSearchLine,
} from 'react-icons/ri';
import { useAuth } from '../../../context/AuthContext';
import {
  anularIncidenciaBase,
  obtenerIncidenciasBase,
  regularizarIncidenciaBase,
  type BaseIncidencia,
} from './services/baseIncidenciasService';

const tipoTexto: Record<string, string> = {
  deterioro: 'Deterioro',
  maltrato: 'Maltrato',
  perdida: 'Pérdida',
  devolucion_fuera_plazo: 'Devolución fuera de plazo',
  otro: 'Otro',
};

const tipoColor: Record<string, string> = {
  deterioro: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  maltrato: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  perdida: 'bg-red-500/20 text-red-300 border-red-500/30',
  devolucion_fuera_plazo: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  otro: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const estadoTexto: Record<string, string> = {
  pendiente: 'Pendiente',
  regularizada: 'Regularizada',
  anulada: 'Anulada',
};

const estadoColor: Record<string, string> = {
  pendiente: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  regularizada: 'bg-green-500/20 text-green-300 border-green-500/30',
  anulada: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
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

type ModalAccion = 'regularizar' | 'anular' | null;

export default function BaseIncidenciasPage() {
  const { session, userRole } = useAuth();

  const [incidencias, setIncidencias] = useState<BaseIncidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [incidenciaSeleccionada, setIncidenciaSeleccionada] =
    useState<BaseIncidencia | null>(null);
  const [modalAccion, setModalAccion] = useState<ModalAccion>(null);
  const [observacion, setObservacion] = useState('');
  const [marcarLibroDisponible, setMarcarLibroDisponible] = useState(false);

  const usuarioRegularizacion = session?.user?.email ?? 'usuario_sigem';
  const esOperador = userRole === 'admin';

  const cargarIncidencias = async () => {
    setLoading(true);

    try {
      const data = await obtenerIncidenciasBase();
      setIncidencias(data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las incidencias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIncidencias();
  }, []);

  const incidenciasFiltradas = useMemo(() => {
    const texto = searchTerm.trim().toLowerCase();

    return incidencias.filter((incidencia) => {
      const ciudadano = `${incidencia.ciudadano?.nombres ?? ''} ${
        incidencia.ciudadano?.apellidos ?? ''
      }`;

      const valores = [
        incidencia.prestamo?.solicitud?.codigo_solicitud,
        incidencia.ciudadano?.dni,
        ciudadano,
        incidencia.libro?.titulo,
        incidencia.libro?.codigo,
        incidencia.tipo_incidencia,
        incidencia.descripcion,
        incidencia.estado_incidencia,
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto = !texto || valores.includes(texto);

      const coincideEstado =
        estadoFiltro === 'todas' || incidencia.estado_incidencia === estadoFiltro;

      return coincideTexto && coincideEstado;
    });
  }, [incidencias, searchTerm, estadoFiltro]);

  const totalPendientes = incidencias.filter(
    (i) => i.estado_incidencia === 'pendiente'
  ).length;

  const totalRegularizadas = incidencias.filter(
    (i) => i.estado_incidencia === 'regularizada'
  ).length;

  const totalAnuladas = incidencias.filter(
    (i) => i.estado_incidencia === 'anulada'
  ).length;

  const abrirModal = (incidencia: BaseIncidencia, accion: ModalAccion) => {
    setIncidenciaSeleccionada(incidencia);
    setModalAccion(accion);
    setObservacion('');
    setMarcarLibroDisponible(false);
  };

  const cerrarModal = () => {
    setIncidenciaSeleccionada(null);
    setModalAccion(null);
    setObservacion('');
    setMarcarLibroDisponible(false);
  };

  const confirmarAccion = async () => {
    if (!incidenciaSeleccionada || !modalAccion) return;

    try {
      setProcesandoId(incidenciaSeleccionada.id);

      if (modalAccion === 'regularizar') {
        await regularizarIncidenciaBase({
          incidencia: incidenciaSeleccionada,
          observacion,
          usuarioRegularizacion,
          marcarLibroDisponible,
        });

        toast.success('Incidencia regularizada correctamente.');
      }

      if (modalAccion === 'anular') {
        await anularIncidenciaBase({
          incidencia: incidenciaSeleccionada,
          observacion,
          usuarioRegularizacion,
        });

        toast.success('Incidencia anulada correctamente.');
      }

      cerrarModal();
      await cargarIncidencias();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'No se pudo procesar la incidencia.');
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

          <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
            <RiAlertLine size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Incidencias
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              B.A.S.E. · Registro y seguimiento de incidencias
            </p>
          </div>
        </div>

        <button
          onClick={cargarIncidencias}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors w-fit"
        >
          <RiRefreshLine size={16} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Total incidencias</p>
          <p className="text-2xl font-bold text-white">{incidencias.length}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Pendientes</p>
          <p className="text-2xl font-bold text-blue-400">{totalPendientes}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Regularizadas</p>
          <p className="text-2xl font-bold text-green-400">{totalRegularizadas}</p>
        </div>

        <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs mb-2">Anuladas</p>
          <p className="text-2xl font-bold text-gray-300">{totalAnuladas}</p>
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
              placeholder="Buscar por solicitud, DNI, ciudadano, libro, código o descripción..."
              className="w-full bg-[#13141a] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-white outline-none focus:border-blue-500 text-xs placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'todas', label: 'Todas' },
              { value: 'pendiente', label: 'Pendientes' },
              { value: 'regularizada', label: 'Regularizadas' },
              { value: 'anulada', label: 'Anuladas' },
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
                <th className="px-4 py-3 border border-gray-700">Fecha</th>
                <th className="px-4 py-3 border border-gray-700">Tipo</th>
                <th className="px-4 py-3 border border-gray-700">Libro</th>
                <th className="px-4 py-3 border border-gray-700">Ciudadano</th>
                <th className="px-4 py-3 border border-gray-700">Descripción</th>
                <th className="px-4 py-3 border border-gray-700">Estado</th>
                <th className="px-4 py-3 border border-gray-700 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-gray-300 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 border border-gray-700">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-500 uppercase font-bold tracking-widest">
                        Cargando incidencias...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : incidenciasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 border border-gray-700 text-gray-500 uppercase font-bold tracking-widest"
                  >
                    No se encontraron incidencias
                  </td>
                </tr>
              ) : (
                incidenciasFiltradas.map((incidencia) => {
                  const ciudadanoNombre = `${incidencia.ciudadano?.nombres ?? ''} ${
                    incidencia.ciudadano?.apellidos ?? ''
                  }`.trim();

                  const tipoClass =
                    tipoColor[incidencia.tipo_incidencia] ??
                    'bg-gray-500/20 text-gray-300 border-gray-500/30';

                  const estadoClass =
                    estadoColor[incidencia.estado_incidencia] ??
                    'bg-gray-500/20 text-gray-300 border-gray-500/30';

                  const puedeGestionar =
                    esOperador && incidencia.estado_incidencia === 'pendiente';

                  return (
                    <tr
                      key={incidencia.id}
                      className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors"
                    >
                      <td className="px-4 py-3 border border-gray-700 font-mono text-blue-400 font-bold whitespace-nowrap">
                        {incidencia.prestamo?.solicitud?.codigo_solicitud ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        <div>{formatearFecha(incidencia.fecha_incidencia)}</div>
                        <div className="text-gray-500 text-[10px]">
                          {formatearFechaHora(incidencia.fecha_incidencia)}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${tipoClass}`}
                        >
                          {tipoTexto[incidencia.tipo_incidencia] ??
                            incidencia.tipo_incidencia}
                        </span>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[220px]">
                        <div className="font-bold text-white">
                          {incidencia.libro?.titulo ?? 'Sin libro'}
                        </div>
                        <div className="text-gray-500">
                          {incidencia.libro?.autor ?? 'Autor no registrado'} ·{' '}
                          {incidencia.libro?.codigo ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[180px]">
                        <div className="font-bold text-white">
                          {ciudadanoNombre || 'Sin ciudadano'}
                        </div>
                        <div className="text-gray-500">
                          DNI: {incidencia.ciudadano?.dni ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[260px]">
                        <p className="text-gray-300 leading-relaxed">
                          {incidencia.descripcion}
                        </p>

                        {incidencia.observacion_regularizacion && (
                          <p className="text-gray-500 mt-2">
                            Regularización: {incidencia.observacion_regularizacion}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${estadoClass}`}
                        >
                          {estadoTexto[incidencia.estado_incidencia] ??
                            incidencia.estado_incidencia}
                        </span>

                        {incidencia.fecha_regularizacion && (
                          <div className="text-gray-500 text-[10px] mt-1">
                            {formatearFecha(incidencia.fecha_regularizacion)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 text-center">
                        {puedeGestionar ? (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirModal(incidencia, 'regularizar')}
                              disabled={procesandoId === incidencia.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                              title="Regularizar incidencia"
                            >
                              <RiCheckboxCircleLine size={14} />
                              Regularizar
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModal(incidencia, 'anular')}
                              disabled={procesandoId === incidencia.id}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                              title="Anular incidencia"
                            >
                              <RiCloseCircleLine size={14} />
                              Anular
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
        Mostrando {incidenciasFiltradas.length} incidencias.
      </div>

      {incidenciaSeleccionada && modalAccion && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1E1F25] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-white text-lg font-bold">
                {modalAccion === 'regularizar'
                  ? 'Regularizar incidencia'
                  : 'Anular incidencia'}
              </h2>

              <p className="text-gray-500 text-xs mt-1">
                B.A.S.E. · Control de incidencias bibliotecarias
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Tipo de incidencia</p>
                <p className="text-white font-bold">
                  {tipoTexto[incidenciaSeleccionada.tipo_incidencia] ??
                    incidenciaSeleccionada.tipo_incidencia}
                </p>
              </div>

              <div className="bg-[#13141a] border border-gray-700 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Libro</p>
                <p className="text-white font-bold">
                  {incidenciaSeleccionada.libro?.titulo ?? 'Sin título'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {incidenciaSeleccionada.libro?.autor ?? 'Autor no registrado'} ·{' '}
                  {incidenciaSeleccionada.libro?.codigo ?? '-'}
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-bold mb-2">
                  {modalAccion === 'regularizar'
                    ? 'Observación de regularización'
                    : 'Motivo de anulación'}
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={4}
                  placeholder={
                    modalAccion === 'regularizar'
                      ? 'Ej: El ciudadano repuso el material / se verificó reparación / se dejó constancia...'
                      : 'Ej: Incidencia registrada por error...'
                  }
                  className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
                />
              </div>

              {modalAccion === 'regularizar' && incidenciaSeleccionada.libro && (
                <label className="flex items-start gap-3 bg-[#13141a] border border-gray-700 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marcarLibroDisponible}
                    onChange={(e) => setMarcarLibroDisponible(e.target.checked)}
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-white text-xs font-bold">
                      Marcar libro como disponible
                    </span>
                    <span className="block text-gray-500 text-xs mt-1">
                      Úsalo solo si el material ya puede volver a prestarse.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div className="p-5 border-t border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={procesandoId === incidenciaSeleccionada.id}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAccion}
                disabled={procesandoId === incidenciaSeleccionada.id}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                  modalAccion === 'regularizar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {procesandoId === incidenciaSeleccionada.id
                  ? 'Procesando...'
                  : modalAccion === 'regularizar'
                    ? 'Confirmar regularización'
                    : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}