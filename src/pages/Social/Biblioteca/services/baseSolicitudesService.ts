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

export interface BaseSolicitud {
  id: string;
  codigo_solicitud: string;
  fecha_solicitud: string;
  fecha_recojo_solicitada: string | null;
  estado_solicitud: string;
  compromiso_aceptado: boolean;
  fecha_aprobacion: string | null;
  fecha_limite_recojo: string | null;
  motivo_rechazo: string | null;
  observaciones: string | null;
  usuario_revision: string | null;
  ciudadano: BaseCiudadano | null;
  libro: BaseLibro | null;
}

function sumarDias(fecha: Date, dias: number) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
}

export async function obtenerSolicitudesBase(): Promise<BaseSolicitud[]> {
  const { data, error } = await supabase
    .from('biblioteca_solicitudes')
    .select(`
      id,
      codigo_solicitud,
      fecha_solicitud,
      fecha_recojo_solicitada,
      estado_solicitud,
      compromiso_aceptado,
      fecha_aprobacion,
      fecha_limite_recojo,
      motivo_rechazo,
      observaciones,
      usuario_revision,
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
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    console.error('Error al obtener solicitudes B.A.S.E.:', error);
    throw error;
  }

  return (data ?? []) as unknown as BaseSolicitud[];
}

export async function aprobarSolicitudBase(
  solicitud: BaseSolicitud,
  usuarioRevision: string
) {
  if (!solicitud.libro?.id) {
    throw new Error('No se encontró el libro asociado a la solicitud.');
  }

  if (solicitud.estado_solicitud !== 'pendiente_revision') {
    throw new Error('Solo se pueden aprobar solicitudes pendientes.');
  }

  const ahora = new Date();
  const fechaLimiteRecojo = sumarDias(ahora, 2);

  const { error: errorSolicitud } = await supabase
    .from('biblioteca_solicitudes')
    .update({
      estado_solicitud: 'aprobada',
      fecha_aprobacion: ahora.toISOString(),
      fecha_limite_recojo: fechaLimiteRecojo.toISOString(),
      usuario_revision: usuarioRevision,
      observaciones: 'Solicitud aprobada. El libro queda reservado por 2 días para recojo.',
    })
    .eq('id', solicitud.id);

  if (errorSolicitud) {
    console.error('Error al aprobar solicitud:', errorSolicitud);
    throw errorSolicitud;
  }

  const { error: errorLibro } = await supabase
    .from('biblioteca_libros')
    .update({
      estado: 'reservado',
    })
    .eq('id', solicitud.libro.id);

  if (errorLibro) {
    console.error('Error al reservar libro:', errorLibro);
    throw errorLibro;
  }
}

export async function rechazarSolicitudBase(
  solicitudId: string,
  motivo: string,
  usuarioRevision: string
) {
  const motivoLimpio = motivo.trim();

  if (!motivoLimpio) {
    throw new Error('Debes ingresar un motivo de rechazo.');
  }

  const { error } = await supabase
    .from('biblioteca_solicitudes')
    .update({
      estado_solicitud: 'rechazada',
      motivo_rechazo: motivoLimpio,
      usuario_revision: usuarioRevision,
      observaciones: 'Solicitud rechazada por el personal encargado.',
    })
    .eq('id', solicitudId)
    .eq('estado_solicitud', 'pendiente_revision');

  if (error) {
    console.error('Error al rechazar solicitud:', error);
    throw error;
  }
}