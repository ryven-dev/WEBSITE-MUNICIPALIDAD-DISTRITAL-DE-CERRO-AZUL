import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine,
  RiBarChart2Line,
  RiDownload2Line,
  RiRefreshLine,
} from 'react-icons/ri';
import {
  obtenerReportesBase,
  type BaseReportesData,
} from './services/baseReportesService';

function contarPorCampo<T extends Record<string, any>>(items: T[], campo: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = String(item[campo] ?? 'Sin registrar');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function obtenerFechaActualISO() {
  return new Date().toISOString().split('T')[0];
}

function obtenerPrimerDiaDelMesISO() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return primerDia.toISOString().split('T')[0];
}

function estadoSolicitudTexto(estado: string) {
  const map: Record<string, string> = {
    pendiente_revision: 'Pendientes',
    aprobada: 'Aprobadas',
    rechazada: 'Rechazadas',
    cancelada: 'Canceladas',
    atendida: 'Atendidas',
  };

  return map[estado] ?? estado;
}

function estadoPrestamoTexto(estado: string) {
  const map: Record<string, string> = {
    activo: 'Activos',
    renovado: 'Renovados',
    devolucion_atrasada: 'Devolución atrasada',
    finalizado: 'Finalizados',
    finalizado_con_incidencia: 'Finalizados con incidencia',
  };

  return map[estado] ?? estado;
}

function estadoIncidenciaTexto(estado: string) {
  const map: Record<string, string> = {
    pendiente: 'Pendientes',
    regularizada: 'Regularizadas',
    anulada: 'Anuladas',
  };

  return map[estado] ?? estado;
}

function tipoIncidenciaTexto(tipo: string) {
  const map: Record<string, string> = {
    deterioro: 'Deterioro',
    maltrato: 'Maltrato',
    perdida: 'Pérdida',
    devolucion_fuera_plazo: 'Devolución fuera de plazo',
    otro: 'Otro',
  };

  return map[tipo] ?? tipo;
}

function estadoLibroTexto(estado: string) {
  const map: Record<string, string> = {
    disponible: 'Disponibles',
    reservado: 'Reservados',
    en_prestamo: 'En préstamo',
    no_disponible: 'No disponibles',
  };

  return map[estado] ?? estado;
}

function convertirObjetoATabla(objeto: Record<string, number>, traducir?: (key: string) => string) {
  return Object.entries(objeto).map(([key, value]) => ({
    label: traducir ? traducir(key) : key,
    value,
  }));
}

function descargarCSV(nombreArchivo: string, contenido: string) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  link.click();

  URL.revokeObjectURL(url);
}

export default function BaseReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(obtenerPrimerDiaDelMesISO());
  const [fechaFin, setFechaFin] = useState(obtenerFechaActualISO());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BaseReportesData>({
    solicitudes: [],
    prestamos: [],
    incidencias: [],
    libros: [],
  });

  const cargarReportes = async () => {
    setLoading(true);

    try {
      const result = await obtenerReportesBase({
        fechaInicio,
        fechaFin,
      });

      setData(result);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const resumen = useMemo(() => {
    const solicitudesPorEstado = contarPorCampo(data.solicitudes, 'estado_solicitud');
    const prestamosPorEstado = contarPorCampo(data.prestamos, 'estado_prestamo');
    const incidenciasPorEstado = contarPorCampo(data.incidencias, 'estado_incidencia');
    const incidenciasPorTipo = contarPorCampo(data.incidencias, 'tipo_incidencia');
    const librosPorEstado = contarPorCampo(data.libros, 'estado');
    const librosPorClasificacion = contarPorCampo(data.libros, 'clasificacion');

    return {
      solicitudesPorEstado,
      prestamosPorEstado,
      incidenciasPorEstado,
      incidenciasPorTipo,
      librosPorEstado,
      librosPorClasificacion,
      totalSolicitudes: data.solicitudes.length,
      totalPrestamos: data.prestamos.length,
      totalIncidencias: data.incidencias.length,
      totalLibros: data.libros.length,
      solicitudesPendientes: solicitudesPorEstado.pendiente_revision ?? 0,
      prestamosActivos:
        (prestamosPorEstado.activo ?? 0) + (prestamosPorEstado.renovado ?? 0),
      incidenciasPendientes: incidenciasPorEstado.pendiente ?? 0,
      librosDisponibles: librosPorEstado.disponible ?? 0,
    };
  }, [data]);

  const exportarCSV = () => {
    const filas = [
      ['Reporte', 'Indicador', 'Total'],
      ['Solicitudes', 'Total', resumen.totalSolicitudes],
      ['Solicitudes', 'Pendientes', resumen.solicitudesPorEstado.pendiente_revision ?? 0],
      ['Solicitudes', 'Aprobadas', resumen.solicitudesPorEstado.aprobada ?? 0],
      ['Solicitudes', 'Rechazadas', resumen.solicitudesPorEstado.rechazada ?? 0],
      ['Solicitudes', 'Canceladas', resumen.solicitudesPorEstado.cancelada ?? 0],
      ['Solicitudes', 'Atendidas', resumen.solicitudesPorEstado.atendida ?? 0],
      ['Préstamos', 'Total', resumen.totalPrestamos],
      ['Préstamos', 'Activos', resumen.prestamosPorEstado.activo ?? 0],
      ['Préstamos', 'Renovados', resumen.prestamosPorEstado.renovado ?? 0],
      ['Préstamos', 'Finalizados', resumen.prestamosPorEstado.finalizado ?? 0],
      [
        'Préstamos',
        'Finalizados con incidencia',
        resumen.prestamosPorEstado.finalizado_con_incidencia ?? 0,
      ],
      ['Incidencias', 'Total', resumen.totalIncidencias],
      ['Incidencias', 'Pendientes', resumen.incidenciasPorEstado.pendiente ?? 0],
      ['Incidencias', 'Regularizadas', resumen.incidenciasPorEstado.regularizada ?? 0],
      ['Incidencias', 'Anuladas', resumen.incidenciasPorEstado.anulada ?? 0],
      ['Libros', 'Total', resumen.totalLibros],
      ['Libros', 'Disponibles', resumen.librosPorEstado.disponible ?? 0],
      ['Libros', 'Reservados', resumen.librosPorEstado.reservado ?? 0],
      ['Libros', 'En préstamo', resumen.librosPorEstado.en_prestamo ?? 0],
      ['Libros', 'No disponibles', resumen.librosPorEstado.no_disponible ?? 0],
    ];

    const csv = filas.map((fila) => fila.join(',')).join('\n');
    descargarCSV(`reporte-base-${fechaInicio}-a-${fechaFin}.csv`, csv);
  };

  const TablaResumen = ({
    titulo,
    filas,
  }: {
    titulo: string;
    filas: { label: string; value: number }[];
  }) => (
    <div className="bg-[#1E1F25] border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-white font-bold text-sm">{titulo}</h2>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#27282F] text-gray-300 uppercase text-[10px]">
            <th className="px-4 py-3 border border-gray-700">Indicador</th>
            <th className="px-4 py-3 border border-gray-700 text-right">Total</th>
          </tr>
        </thead>

        <tbody className="text-gray-300 text-xs">
          {filas.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                className="px-4 py-8 border border-gray-700 text-center text-gray-500 uppercase font-bold tracking-widest"
              >
                Sin datos
              </td>
            </tr>
          ) : (
            filas.map((fila) => (
              <tr key={fila.label} className="hover:bg-[#2a2b33] even:bg-[#1c1d24]">
                <td className="px-4 py-3 border border-gray-700 font-bold text-white">
                  {fila.label}
                </td>
                <td className="px-4 py-3 border border-gray-700 text-right font-mono text-blue-300">
                  {fila.value}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

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

          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <RiBarChart2Line size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Reportes
            </h1>
            <p className="text-gray-500 text-xs uppercase font-medium mt-1">
              B.A.S.E. · Estadísticas generales del sistema
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={cargarReportes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors w-fit"
          >
            <RiRefreshLine size={16} />
            Actualizar
          </button>

          <button
            onClick={exportarCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors w-fit"
          >
            <RiDownload2Line size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-bold block mb-2">
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-bold block mb-2">
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-[#13141a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarReportes}
              className="w-full bg-[#27282F] hover:bg-[#343642] text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1E1F25] border border-gray-700 rounded-xl py-20 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 uppercase font-bold tracking-widest text-xs">
            Cargando reportes...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-2">Solicitudes</p>
              <p className="text-2xl font-bold text-white">{resumen.totalSolicitudes}</p>
              <p className="text-amber-400 text-xs mt-1">
                Pendientes: {resumen.solicitudesPendientes}
              </p>
            </div>

            <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-2">Préstamos</p>
              <p className="text-2xl font-bold text-white">{resumen.totalPrestamos}</p>
              <p className="text-green-400 text-xs mt-1">
                Activos/Renovados: {resumen.prestamosActivos}
              </p>
            </div>

            <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-2">Incidencias</p>
              <p className="text-2xl font-bold text-white">{resumen.totalIncidencias}</p>
              <p className="text-blue-400 text-xs mt-1">
                Pendientes: {resumen.incidenciasPendientes}
              </p>
            </div>

            <div className="bg-[#1E1F25] border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-2">Libros registrados</p>
              <p className="text-2xl font-bold text-white">{resumen.totalLibros}</p>
              <p className="text-green-400 text-xs mt-1">
                Disponibles: {resumen.librosDisponibles}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <TablaResumen
              titulo="Solicitudes por estado"
              filas={convertirObjetoATabla(
                resumen.solicitudesPorEstado,
                estadoSolicitudTexto
              )}
            />

            <TablaResumen
              titulo="Préstamos por estado"
              filas={convertirObjetoATabla(
                resumen.prestamosPorEstado,
                estadoPrestamoTexto
              )}
            />

            <TablaResumen
              titulo="Incidencias por estado"
              filas={convertirObjetoATabla(
                resumen.incidenciasPorEstado,
                estadoIncidenciaTexto
              )}
            />

            <TablaResumen
              titulo="Incidencias por tipo"
              filas={convertirObjetoATabla(
                resumen.incidenciasPorTipo,
                tipoIncidenciaTexto
              )}
            />

            <TablaResumen
              titulo="Libros por estado actual"
              filas={convertirObjetoATabla(
                resumen.librosPorEstado,
                estadoLibroTexto
              )}
            />

            <TablaResumen
              titulo="Libros por clasificación"
              filas={convertirObjetoATabla(resumen.librosPorClasificacion)}
            />
          </div>
        </>
      )}
    </div>
  );
}