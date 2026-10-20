export interface Manuscrito {
  id: number;
  usuario_id: number;
  titulo: string;
  genero?: string;
  nivel_contenido: "general" | "maduro" | "adulto";
  estado: "borrador" | "procesando" | "procesado" | "publicado";
  encriptado: boolean;
  publicado: boolean;
  sinopsis?: string;
  portada_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Capitulo {
  id: number;
  manuscrito_id: number;
  numero: number;
  titulo?: string;
  version_actual: number;
  total_palabras?: number;
  estado_procesamiento: "pendiente" | "en_cola" | "procesando" | "completado" | "error";
  acceso_libre: boolean;
  created_at: string;
}

export interface ProgresoCapitulo {
  task_id: string;
  capitulo_id: number;
  estado: "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";
  progreso: number;  // 0-100
  mensaje: string;
  datos?: {
    nodos_nuevos?: number;
    relaciones_nuevas?: number;
    alertas_contradiccion?: number;
  };
}
