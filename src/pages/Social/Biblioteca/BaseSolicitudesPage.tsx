import { useEffect, useMemo, useState } from 'react';
import {
  RiArrowLeftLine,
  RiRefreshLine,
  RiSearchLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiFileList3Line,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import {
  aprobarSolicitudBase,
  obtenerSolicitudesBase,
  rechazarSolicitudBase,
  type BaseSolicitud,
} from './services/baseSolicitudesService';

const estadoColor: Record<string, string> = {
  pendiente_revision: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  aprobada: 'bg-green-500/20 text-green-300 border-green-500/30',
  rechazada: 'bg-red-500/20 text-red-300 border-red-500/30',
  cancelada: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  atendida: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const estadoTexto: Record<string, string> = {
  pendiente_revision: 'Pendiente de revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
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

export default function BaseSolicitudesPage() {
  const { session, userRole } = useAuth();

  const [solicitudes, setSolicitudes] = useState<BaseSolicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('pendiente_revision');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const usuarioRevision = session?.user?.email ?? 'usuario_sigem';

  const esOperador = userRole === 'admin';

  const cargarSolicitudes = async () => {
    setLoading(true);

    try {
      const data = await obtenerSolicitudesBase();
      setSolicitudes(data);
    } catch (error: any) {
      console.error(error);
      toast.error('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const solicitudesFiltradas = useMemo(() => {
    const texto = searchTerm.trim().toLowerCase();

    return solicitudes.filter((solicitud) => {
      const coincideEstado =
        estadoFiltro === 'todas' ||
        solicitud.estado_solicitud === estadoFiltro;

      const ciudadano = `${solicitud.ciudadano?.nombres ?? ''} ${solicitud.ciudadano?.apellidos ?? ''}`;
      const valoresBusqueda = [
        solicitud.codigo_solicitud,
        solicitud.ciudadano?.dni,
        ciudadano,
        solicitud.ciudadano?.correo,
        solicitud.libro?.titulo,
        solicitud.libro?.codigo,
      ]
        .join(' ')
        .toLowerCase();

      const coincideTexto = !texto || valoresBusqueda.includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [solicitudes, searchTerm, estadoFiltro]);

  const totalPendientes = solicitudes.filter(
    (s) => s.estado_solicitud === 'pendiente_revision'
  ).length;

  const totalAprobadas = solicitudes.filter(
    (s) => s.estado_solicitud === 'aprobada'
  ).length;

  const totalRechazadas = solicitudes.filter(
    (s) => s.estado_solicitud === 'rechazada'
  ).length;

  const totalCanceladas = solicitudes.filter(
    (s) => s.estado_solicitud === 'cancelada'
  ).length;

  const handleAprobar = async (solicitud: BaseSolicitud) => {
    const confirmar = window.confirm(
      `¿Confirmas aprobar la solicitud ${solicitud.codigo_solicitud}?\n\nEl libro quedará reservado por 2 días para recojo.`
    );

    if (!confirmar) return;

    try {
      setProcesandoId(solicitud.id);

      await aprobarSolicitudBase(solicitud, usuarioRevision);

      toast.success('Solicitud aprobada correctamente.');
      await cargarSolicitudes();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'No se pudo aprobar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (solicitud: BaseSolicitud) => {
    const motivo = window.prompt(
      `Motivo de rechazo para ${solicitud.codigo_solicitud}:`
    );

    if (motivo === null) return;

    try {
      setProcesandoId(solicitud.id);

      await rechazarSolicitudBase(solicitud.id, motivo, usuarioRevision);

      toast.success('Solicitud rechazada correctamente.');
      await cargarSolicitudes();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? 'No se pudo rechazar la solicitud.');
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

          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
            <RiFileList3Line size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Solicitudes de reserva
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              B.A.S.E. · Gestión de solicitudes ciudadanas
            </p>
          </div>
        </div>

        <button
          onClick={cargarSolicitudes}
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
              placeholder="Buscar por código, DNI, ciudadano, correo, libro o código de libro..."
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
              { value: 'atendida', label: 'Atendidas' },
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
                <th className="px-4 py-3 border border-gray-700">Código</th>
                <th className="px-4 py-3 border border-gray-700">Fecha</th>
                <th className="px-4 py-3 border border-gray-700">Ciudadano</th>
                <th className="px-4 py-3 border border-gray-700">DNI</th>
                <th className="px-4 py-3 border border-gray-700">Contacto</th>
                <th className="px-4 py-3 border border-gray-700">Libro</th>
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
                        Cargando solicitudes...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 border border-gray-700 text-gray-500 uppercase font-bold tracking-widest">
                    No se encontraron solicitudes
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((solicitud) => {
                  const ciudadanoNombre = `${solicitud.ciudadano?.nombres ?? ''} ${solicitud.ciudadano?.apellidos ?? ''}`.trim();
                  const estadoClass =
                    estadoColor[solicitud.estado_solicitud] ??
                    'bg-gray-500/20 text-gray-300 border-gray-500/30';

                  const puedeGestionar =
                    esOperador &&
                    solicitud.estado_solicitud === 'pendiente_revision';

                  return (
                    <tr
                      key={solicitud.id}
                      className="hover:bg-[#2a2b33] even:bg-[#1c1d24] transition-colors"
                    >
                      <td className="px-4 py-3 border border-gray-700 font-mono text-blue-400 font-bold whitespace-nowrap">
                        {solicitud.codigo_solicitud}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 whitespace-nowrap">
                        <div>{formatearFecha(solicitud.fecha_solicitud)}</div>
                        <div className="text-gray-500 text-[10px]">
                          {formatearFechaHora(solicitud.fecha_solicitud)}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[180px]">
                        <div className="font-bold text-white">
                          {ciudadanoNombre || 'Sin ciudadano'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 font-mono">
                        {solicitud.ciudadano?.dni ?? '-'}
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[190px]">
                        <div className="text-gray-200">
                          {solicitud.ciudadano?.correo ?? '-'}
                        </div>
                        <div className="text-gray-500">
                          {solicitud.ciudadano?.telefono ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700 min-w-[220px]">
                        <div className="font-bold text-white">
                          {solicitud.libro?.titulo ?? 'Sin libro'}
                        </div>
                        <div className="text-gray-500">
                          {solicitud.libro?.autor ?? 'Autor no registrado'} · {solicitud.libro?.codigo ?? '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        <span className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${estadoClass}`}>
                          {estadoTexto[solicitud.estado_solicitud] ?? solicitud.estado_solicitud}
                        </span>

                        {solicitud.fecha_limite_recojo && (
                          <div className="text-gray-500 text-[10px] mt-1">
                            Límite recojo: {formatearFecha(solicitud.fecha_limite_recojo)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 border border-gray-700">
                        {puedeGestionar ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAprobar(solicitud)}
                              disabled={procesandoId === solicitud.id}
                              className="p-2 text-green-400 hover:bg-green-400/10 rounded transition-colors disabled:opacity-50"
                              title="Aprobar solicitud"
                            >
                              <RiCheckboxCircleLine size={18} />
                            </button>

                            <button
                              onClick={() => handleRechazar(solicitud)}
                              disabled={procesandoId === solicitud.id}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                              title="Rechazar solicitud"
                            >
                              <RiCloseCircleLine size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 text-[11px]">
                            Sin acciones
                          </div>
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
        Mostrando {solicitudesFiltradas.length} solicitudes.
      </div>
    </div>
  );
}