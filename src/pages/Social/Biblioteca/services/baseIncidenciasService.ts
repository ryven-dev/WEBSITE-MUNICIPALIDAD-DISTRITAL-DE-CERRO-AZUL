import { supabase } from '../../../../supabaseClient';

export interface BaseCiudadano {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
}

export interface BaseLibro {
  id: string;
  codigo: string | null;
  titulo: string;
  autor: string | null;
  estado: string | null;
}

export interface BasePrestamoIncidencia {
  id: string;
  estado_prestamo: string;
  fecha_prestamo: string;
  fecha_maxima_devolucion: string;
  fecha_devolucion: string | null;
  solicitud: {
    codigo_solicitud: string;
  } | null;
}

export interface BaseIncidencia {
  id: string;
  prestamo_id: string | null;
  ciudadano_id: string | null;
  libro_id: string | null;

  tipo_incidencia: string;
  descripcion: string;
  estado_incidencia: string;

  fecha_incidencia: string;
  fecha_regularizacion: string | null;

  observacion_regularizacion: string | null;

  usuario_registro: string | null;
  usuario_regularizacion: string | null;

  prestamo: BasePrestamoIncidencia | null;
  ciudadano: BaseCiudadano | null;
  libro: BaseLibro | null;
}

export async function obtenerIncidenciasBase(): Promise<BaseIncidencia[]> {
  const { data, error } = await supabase
    .from('biblioteca_incidencias')
    .select(`
      id,
      prestamo_id,
      ciudadano_id,
      libro_id,
      tipo_incidencia,
      descripcion,
      estado_incidencia,
      fecha_incidencia,
      fecha_regularizacion,
      observacion_regularizacion,
      usuario_registro,
      usuario_regularizacion,
      prestamo:biblioteca_prestamos (
        id,
        estado_prestamo,
        fecha_prestamo,
        fecha_maxima_devolucion,
        fecha_devolucion,
        solicitud:biblioteca_solicitudes (
          codigo_solicitud
        )
      ),
      ciudadano:biblioteca_ciudadanos (
        id,
        dni,
        nombres,
        apellidos,
        correo,
        telefono
      ),
      libro:biblioteca_libros (
        id,
        codigo,
        titulo,
        autor,
        estado
      )
    `)
    .order('fecha_incidencia', { ascending: false });

  if (error) {
    console.error('Error al obtener incidencias B.A.S.E.:', error);
    throw error;
  }

  return (data ?? []) as unknown as BaseIncidencia[];
}

export async function regularizarIncidenciaBase(params: {
  incidencia: BaseIncidencia;
  observacion: string;
  usuarioRegularizacion: string;
  marcarLibroDisponible: boolean;
}) {
  const { incidencia, observacion, usuarioRegularizacion, marcarLibroDisponible } = params;

  if (incidencia.estado_incidencia !== 'pendiente') {
    throw new Error('Solo se pueden regularizar incidencias pendientes.');
  }

  const observacionLimpia = observacion.trim();

  if (!observacionLimpia) {
    throw new Error('Debes registrar una observación de regularización.');
  }

  const fechaRegularizacion = new Date().toISOString();

  const { error: errorIncidencia } = await supabase
    .from('biblioteca_incidencias')
    .update({
      estado_incidencia: 'regularizada',
      fecha_regularizacion: fechaRegularizacion,
      observacion_regularizacion: observacionLimpia,
      usuario_regularizacion: usuarioRegularizacion,
    })
    .eq('id', incidencia.id)
    .eq('estado_incidencia', 'pendiente');

  if (errorIncidencia) {
    console.error('Error al regularizar incidencia:', errorIncidencia);
    throw errorIncidencia;
  }

  if (marcarLibroDisponible && incidencia.libro_id) {
    const { error: errorLibro } = await supabase
      .from('biblioteca_libros')
      .update({
        estado: 'disponible',
        observaciones: `Libro habilitado nuevamente. Incidencia regularizada: ${observacionLimpia}`,
      })
      .eq('id', incidencia.libro_id);

    if (errorLibro) {
      console.error('Error al actualizar libro después de regularizar:', errorLibro);
      throw errorLibro;
    }
  }
}

export async function anularIncidenciaBase(params: {
  incidencia: BaseIncidencia;
  observacion: string;
  usuarioRegularizacion: string;
}) {
  const { incidencia, observacion, usuarioRegularizacion } = params;

  if (incidencia.estado_incidencia !== 'pendiente') {
    throw new Error('Solo se pueden anular incidencias pendientes.');
  }

  const observacionLimpia = observacion.trim();

  if (!observacionLimpia) {
    throw new Error('Debes registrar el motivo de anulación.');
  }

  const { error } = await supabase
    .from('biblioteca_incidencias')
    .update({
      estado_incidencia: 'anulada',
      fecha_regularizacion: new Date().toISOString(),
      observacion_regularizacion: observacionLimpia,
      usuario_regularizacion: usuarioRegularizacion,
    })
    .eq('id', incidencia.id)
    .eq('estado_incidencia', 'pendiente');

  if (error) {
    console.error('Error al anular incidencia:', error);
    throw error;
  }
}