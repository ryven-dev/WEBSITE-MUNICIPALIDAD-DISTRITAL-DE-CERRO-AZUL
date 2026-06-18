import { supabase } from '../../../../supabaseClient';

export interface BaseSolicitudReporte {
  id: string;
  estado_solicitud: string;
  fecha_solicitud: string;
}

export interface BasePrestamoReporte {
  id: string;
  estado_prestamo: string;
  fecha_prestamo: string;
  fecha_devolucion: string | null;
}

export interface BaseIncidenciaReporte {
  id: string;
  tipo_incidencia: string;
  estado_incidencia: string;
  fecha_incidencia: string;
}

export interface BaseLibroReporte {
  id: string;
  estado: string | null;
  clasificacion: string | null;
}

export interface BaseReportesData {
  solicitudes: BaseSolicitudReporte[];
  prestamos: BasePrestamoReporte[];
  incidencias: BaseIncidenciaReporte[];
  libros: BaseLibroReporte[];
}

function estaDentroDelRango(fecha: string, fechaInicio: string, fechaFin: string) {
  if (!fechaInicio && !fechaFin) return true;

  const fechaRegistro = new Date(fecha);

  if (fechaInicio) {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    if (fechaRegistro < inicio) return false;
  }

  if (fechaFin) {
    const fin = new Date(`${fechaFin}T23:59:59`);
    if (fechaRegistro > fin) return false;
  }

  return true;
}

export async function obtenerReportesBase(params: {
  fechaInicio: string;
  fechaFin: string;
}): Promise<BaseReportesData> {
  const { fechaInicio, fechaFin } = params;

  const [
    solicitudesResult,
    prestamosResult,
    incidenciasResult,
    librosResult,
  ] = await Promise.all([
    supabase
      .from('biblioteca_solicitudes')
      .select('id, estado_solicitud, fecha_solicitud')
      .order('fecha_solicitud', { ascending: false }),

    supabase
      .from('biblioteca_prestamos')
      .select('id, estado_prestamo, fecha_prestamo, fecha_devolucion')
      .order('fecha_prestamo', { ascending: false }),

    supabase
      .from('biblioteca_incidencias')
      .select('id, tipo_incidencia, estado_incidencia, fecha_incidencia')
      .order('fecha_incidencia', { ascending: false }),

    supabase
      .from('biblioteca_libros')
      .select('id, estado, clasificacion')
      .order('clasificacion', { ascending: true }),
  ]);

  if (solicitudesResult.error) {
    console.error('Error al obtener solicitudes para reportes:', solicitudesResult.error);
    throw solicitudesResult.error;
  }

  if (prestamosResult.error) {
    console.error('Error al obtener préstamos para reportes:', prestamosResult.error);
    throw prestamosResult.error;
  }

  if (incidenciasResult.error) {
    console.error('Error al obtener incidencias para reportes:', incidenciasResult.error);
    throw incidenciasResult.error;
  }

  if (librosResult.error) {
    console.error('Error al obtener libros para reportes:', librosResult.error);
    throw librosResult.error;
  }

  const solicitudes = ((solicitudesResult.data ?? []) as BaseSolicitudReporte[]).filter((item) =>
    estaDentroDelRango(item.fecha_solicitud, fechaInicio, fechaFin)
  );

  const prestamos = ((prestamosResult.data ?? []) as BasePrestamoReporte[]).filter((item) =>
    estaDentroDelRango(item.fecha_prestamo, fechaInicio, fechaFin)
  );

  const incidencias = ((incidenciasResult.data ?? []) as BaseIncidenciaReporte[]).filter((item) =>
    estaDentroDelRango(item.fecha_incidencia, fechaInicio, fechaFin)
  );

  const libros = (librosResult.data ?? []) as BaseLibroReporte[];

  return {
    solicitudes,
    prestamos,
    incidencias,
    libros,
  };
}