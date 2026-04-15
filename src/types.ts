// src/types.ts

// --- COMERCIOS AMBULATORIOS ---
export interface Comercio {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Datos de Identificación
  numero_autorizacion: string;
  numero_autorizacion_temporal?: string | null;
  correlativo?: number;
  qr_code_url: string | null;
  
  // NUEVO CAMPO AÑO (Esto soluciona el error rojo)
  anio?: string; 

  // Datos Personales
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  domicilio: string;

  // Datos del Negocio
  giro: string;
  tipo_comercio: 'ESTÁTICO' | 'MÓVIL';
  ubicacion: string;
  turno: string;
  horario: string;

  // Fechas
  fecha_expedicion: string;
  fecha_caducidad: string;
  
  // Auditoría
  usuario_registro?: string;
}

// --- COMERCIOS ESTABLECIDOS ---
export interface ComercioEstablecido {
  id: string;
  created_at?: string;
  nro_licencia: string;
  nro_expediente?: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  giro: string;
  categoria_horario?: string;
  direccion: string;
  zonificacion?: string;
  area_local?: number | null;
  aforo?: number | null;
  horario_atencion: string;
  fecha_emision?: string;
  fecha_vencimiento?: string | null;
  telefono?: string;
  representante_legal?: string;
  dni_representante?: string;
  certificado_url?: string | null;
  usuario_registro?: string;
  nro_resolucion?: string;
  fecha_resolucion?: string;
  anio?: string;
}
export interface Taller {
  id: string;
  nombre: string;
}

export interface AlumnoVacaciones {
  id: string;
  created_at?: string;
  nombre_completo_nino: string;
  edad: number;
  celular_nino?: string;
  nombre_apoderado: string;
  celular_apoderado: string;
  sabe_opcion: 'SABE COAR' | 'SABE BECA 18' | 'NINGUNO';
  usuario_registro?: string;
  
  // Para mostrar en la tabla (lo llenaremos manualmente al hacer el fetch)
  talleres_inscritos?: string[]; 
  talleres_ids?: string[];
}
export interface AlumnoVacaciones {
  // ... los campos anteriores
  polo_entregado?: boolean;
  foto_entrega_url?: string;
}
export interface Libro {
    id?: string;
    codigo: string;
    titulo: string;
    autor: string;
    editorial: string;
    tomo: string;
    clasificacion: string;
    valor_referencial: number;
    usuario_registro: string;
    created_at?: string;
}
export interface AlumnoBus {
    id?: string;
    codigo?: string;      // <--- AÑADE ESTA LÍNEA
    nombre_alumno: string;
    dni_alumno: string;
    edad: number;
    sexo: string;
    colegio: string;
    nombre_apoderado: string;
    telefono_apoderado: string;
    dni_apoderado: string;
    direccion: string;
    usuario_registro?: string;
    created_at?: string;
}