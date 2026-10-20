export type TierEscritor = "explorador" | "creador" | "estudio";
export type TierLector  = "lector" | "lector_premium";

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  subscription_tier?: TierEscritor | TierLector;
  created_at: string;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
}
