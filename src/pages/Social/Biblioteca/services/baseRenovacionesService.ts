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

export interface BasePrestamoRenovacion {
  id: string;
  estado_prestamo: string;
  fecha_prestamo: string;
  fecha_maxima_devolucion: string;
  fecha_devolucion: string | null;
  solicitud: {
    codigo_solicitud: string;
  } | null;
  ciudadano: BaseCiudadano | null;
  libro: BaseLibro | null;
}

export interface BaseRenovacion {
  id: string;
  prestamo_id: string;
  fecha_solicitud: string;
  fecha_anterior_devolucion: string;
  nueva_fecha_devolucion: string;
  estado_renovacion: string;
  motivo_rechazo: string | null;
  fecha_revision: string | null;
  usuario_revision: string | null;
  prestamo: BasePrestamoRenovacion | null;
}

export async function obtenerRenovacionesBase(): Promise<BaseRenovacion[]> {
  const { data, error } = await supabase
    .from('biblioteca_renovaciones')
    .select(`
      id,
      prestamo_id,
      fecha_solicitud,
      fecha_anterior_devolucion,
      nueva_fecha_devolucion,
      estado_renovacion,
      motivo_rechazo,
      fecha_revision,
      usuario_revision,
      prestamo:biblioteca_prestamos (
        id,
        estado_prestamo,
        fecha_prestamo,
        fecha_maxima_devolucion,
        fecha_devolucion,
        solicitud:biblioteca_solicitudes (
          codigo_solicitud
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
      )
    `)
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    console.error('Error al obtener renovaciones B.A.S.E.:', error);
    throw error;
  }

  return (data ?? []) as unknown as BaseRenovacion[];
}

export async function aprobarRenovacionBase(params: {
  renovacion: BaseRenovacion;
  usuarioRevision: string;
}) {
  const { renovacion, usuarioRevision } = params;

  if (renovacion.estado_renovacion !== 'pendiente_revision') {
    throw new Error('Solo se pueden aprobar renovaciones pendientes.');
  }

  if (!renovacion.prestamo_id) {
    throw new Error('No se encontró el préstamo asociado.');
  }

  const { error: errorRenovacion } = await supabase
    .from('biblioteca_renovaciones')
    .update({
      estado_renovacion: 'aprobada',
      fecha_revision: new Date().toISOString(),
      usuario_revision: usuarioRevision,
      motivo_rechazo: null,
    })
    .eq('id', renovacion.id)
    .eq('estado_renovacion', 'pendiente_revision');

  if (errorRenovacion) {
    console.error('Error al aprobar renovación:', errorRenovacion);
    throw errorRenovacion;
  }

  const { error: errorPrestamo } = await supabase
    .from('biblioteca_prestamos')
    .update({
      fecha_maxima_devolucion: renovacion.nueva_fecha_devolucion,
      estado_prestamo: 'renovado',
    })
    .eq('id', renovacion.prestamo_id)
    .is('fecha_devolucion', null);

  if (errorPrestamo) {
    console.error('Error al actualizar préstamo renovado:', errorPrestamo);
    throw errorPrestamo;
  }
}

export async function rechazarRenovacionBase(params: {
  renovacion: BaseRenovacion;
  motivo: string;
  usuarioRevision: string;
}) {
  const { renovacion, motivo, usuarioRevision } = params;

  if (renovacion.estado_renovacion !== 'pendiente_revision') {
    throw new Error('Solo se pueden rechazar renovaciones pendientes.');
  }

  const motivoLimpio = motivo.trim();

  if (!motivoLimpio) {
    throw new Error('Debes registrar el motivo del rechazo.');
  }

  const { error } = await supabase
    .from('biblioteca_renovaciones')
    .update({
      estado_renovacion: 'rechazada',
      motivo_rechazo: motivoLimpio,
      fecha_revision: new Date().toISOString(),
      usuario_revision: usuarioRevision,
    })
    .eq('id', renovacion.id)
    .eq('estado_renovacion', 'pendiente_revision');

  if (error) {
    console.error('Error al rechazar renovación:', error);
    throw error;
  }
}