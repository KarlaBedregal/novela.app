export interface Capitulo {
  id: number;
  manuscrito_id: number;
  numero: number;
  titulo: string | null;
  texto_plano: string | null;
  version_actual: number;
  total_palabras: number | null;
  estado_procesamiento: "pendiente" | "en_cola" | "procesando" | "completado" | "error";
  acceso_libre: boolean;
  created_at: string;
  updated_at: string | null;
}
