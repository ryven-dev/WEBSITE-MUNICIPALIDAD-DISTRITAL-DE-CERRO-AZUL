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

export interface BaseSolicitudAprobada {
  id: string;
  codigo_solicitud: string;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_limite_recojo: string | null;
  estado_solicitud: string;
  ciudadano_id: string;
  libro_id: string;
  ciudadano: BaseCiudadano | null;
  libro: BaseLibro | null;
}

export interface BasePrestamo {
  id: string;
  solicitud_id: string | null;
  ciudadano_id: string;
  libro_id: string;
  fecha_prestamo: string;
  fecha_maxima_devolucion: string;
  fecha_devolucion: string | null;
  estado_prestamo: string;
  estado_fisico_devolucion: string | null;
  observacion_devolucion: string | null;
  usuario_registro: string | null;
  solicitud: {
    codigo_solicitud: string;
  } | null;
  ciudadano: BaseCiudadano | null;
  libro: BaseLibro | null;
}

function sumarDias(fecha: Date, dias: number) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
}

function estaAtrasado(fechaMaxima: string) {
  return new Date(fechaMaxima).getTime() < new Date().getTime();
}

export async function obtenerSolicitudesAprobadasBase(): Promise<BaseSolicitudAprobada[]> {
  const { data, error } = await supabase
    .from('biblioteca_solicitudes')
    .select(`
      id,
      codigo_solicitud,
      fecha_solicitud,
      fecha_aprobacion,
      fecha_limite_recojo,
      estado_solicitud,
      ciudadano_id,
      libro_id,
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
    .eq('estado_solicitud', 'aprobada')
    .order('fecha_aprobacion', { ascending: false });

  if (error) {
    console.error('Error al obtener solicitudes aprobadas:', error);
    throw error;
  }

  return (data ?? []) as unknown as BaseSolicitudAprobada[];
}

export async function obtenerPrestamosBase(): Promise<BasePrestamo[]> {
  const { data, error } = await supabase
    .from('biblioteca_prestamos')
    .select(`
      id,
      solicitud_id,
      ciudadano_id,
      libro_id,
      fecha_prestamo,
      fecha_maxima_devolucion,
      fecha_devolucion,
      estado_prestamo,
      estado_fisico_devolucion,
      observacion_devolucion,
      usuario_registro,
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
    `)
    .order('fecha_prestamo', { ascending: false });

  if (error) {
    console.error('Error al obtener préstamos:', error);
    throw error;
  }

  return (data ?? []) as unknown as BasePrestamo[];
}

export async function registrarPrestamoDesdeSolicitudBase(
  solicitud: BaseSolicitudAprobada,
  usuarioRegistro: string
) {
  if (solicitud.estado_solicitud !== 'aprobada') {
    throw new Error('Solo se puede registrar préstamo de una solicitud aprobada.');
  }

  if (!solicitud.libro?.id) {
    throw new Error('No se encontró el libro asociado.');
  }

  if (solicitud.libro.estado !== 'reservado') {
    throw new Error('El libro debe estar en estado reservado para registrar el préstamo.');
  }

  const fechaPrestamo = new Date();
  const fechaMaximaDevolucion = sumarDias(fechaPrestamo, 7);

  const { error: errorPrestamo } = await supabase
    .from('biblioteca_prestamos')
    .insert({
      solicitud_id: solicitud.id,
      ciudadano_id: solicitud.ciudadano_id,
      libro_id: solicitud.libro_id,
      fecha_prestamo: fechaPrestamo.toISOString(),
      fecha_maxima_devolucion: fechaMaximaDevolucion.toISOString(),
      estado_prestamo: 'activo',
      usuario_registro: usuarioRegistro,
    });

  if (errorPrestamo) {
    console.error('Error al registrar préstamo:', errorPrestamo);
    throw errorPrestamo;
  }

  const { error: errorSolicitud } = await supabase
    .from('biblioteca_solicitudes')
    .update({
      estado_solicitud: 'atendida',
      observaciones: 'Solicitud atendida. El préstamo fue registrado correctamente.',
      usuario_revision: usuarioRegistro,
    })
    .eq('id', solicitud.id);

  if (errorSolicitud) {
    console.error('Error al actualizar solicitud:', errorSolicitud);
    throw errorSolicitud;
  }

  const { error: errorLibro } = await supabase
    .from('biblioteca_libros')
    .update({
      estado: 'en_prestamo',
    })
    .eq('id', solicitud.libro.id);

  if (errorLibro) {
    console.error('Error al actualizar libro:', errorLibro);
    throw errorLibro;
  }
}

export async function registrarDevolucionBase(params: {
  prestamo: BasePrestamo;
  estadoFisico: 'bueno' | 'deteriorado' | 'maltrato' | 'perdida';
  observacion: string;
  usuarioRegistro: string;
}) {
  const { prestamo, estadoFisico, observacion, usuarioRegistro } = params;

  if (prestamo.fecha_devolucion) {
    throw new Error('Este préstamo ya tiene devolución registrada.');
  }

  if (!['activo', 'renovado', 'devolucion_atrasada'].includes(prestamo.estado_prestamo)) {
    throw new Error('Solo se pueden devolver préstamos activos o renovados.');
  }

  if (estadoFisico !== 'bueno' && !observacion.trim()) {
    throw new Error('Debes registrar una observación cuando el libro no está en buen estado.');
  }

  const devolucionAtrasada = estaAtrasado(prestamo.fecha_maxima_devolucion);
  const generaIncidencia = devolucionAtrasada || estadoFisico !== 'bueno';

  const nuevoEstadoPrestamo = generaIncidencia
    ? 'finalizado_con_incidencia'
    : 'finalizado';

  const nuevoEstadoLibro = estadoFisico === 'bueno'
    ? 'disponible'
    : 'no_disponible';

  const fechaDevolucion = new Date();

  const { error: errorPrestamo } = await supabase
    .from('biblioteca_prestamos')
    .update({
      fecha_devolucion: fechaDevolucion.toISOString(),
      estado_prestamo: nuevoEstadoPrestamo,
      estado_fisico_devolucion: estadoFisico,
      observacion_devolucion: observacion.trim() || 'Devolución registrada correctamente.',
    })
    .eq('id', prestamo.id);

  if (errorPrestamo) {
    console.error('Error al registrar devolución:', errorPrestamo);
    throw errorPrestamo;
  }

  const { error: errorLibro } = await supabase
    .from('biblioteca_libros')
    .update({
      estado: nuevoEstadoLibro,
      observaciones:
        estadoFisico === 'bueno'
          ? 'Último estado registrado en devolución: bueno'
          : `Libro marcado como no disponible por devolución con estado: ${estadoFisico}`,
    })
    .eq('id', prestamo.libro_id);

  if (errorLibro) {
    console.error('Error al actualizar estado del libro:', errorLibro);
    throw errorLibro;
  }

  if (devolucionAtrasada) {
    const { error } = await supabase
      .from('biblioteca_incidencias')
      .insert({
        prestamo_id: prestamo.id,
        ciudadano_id: prestamo.ciudadano_id,
        libro_id: prestamo.libro_id,
        tipo_incidencia: 'devolucion_fuera_plazo',
        descripcion: 'Incidencia generada por devolución fuera de plazo.',
        estado_incidencia: 'pendiente',
        usuario_registro: usuarioRegistro,
      });

    if (error) {
      console.error('Error al registrar incidencia por atraso:', error);
      throw error;
    }
  }

  if (estadoFisico !== 'bueno') {
    const tipoIncidencia =
      estadoFisico === 'deteriorado'
        ? 'deterioro'
        : estadoFisico;

    const { error } = await supabase
      .from('biblioteca_incidencias')
      .insert({
        prestamo_id: prestamo.id,
        ciudadano_id: prestamo.ciudadano_id,
        libro_id: prestamo.libro_id,
        tipo_incidencia: tipoIncidencia,
        descripcion: observacion.trim(),
        estado_incidencia: 'pendiente',
        usuario_registro: usuarioRegistro,
      });

    if (error) {
      console.error('Error al registrar incidencia física:', error);
      throw error;
    }
  }
}