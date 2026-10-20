import { api } from "./api";
import type { Capitulo } from "@/types/capitulo";

export interface VersionCapitulo {
  id: number;
  numero_version: number;
  total_palabras: number | null;
  created_at: string | null;
  tiene_texto: boolean;
  nota: string | null;
}

export interface RestaurarResult {
  ok: boolean;
  mensaje: string;
  version_actual: number;
  total_palabras: number;
}

export async function listarCapitulos(manuscritoId: number, token: string): Promise<Capitulo[]> {
  return api.get<Capitulo[]>(`/manuscritos/${manuscritoId}/capitulos`, token);
}

export async function crearCapitulo(
  manuscritoId: number,
  datos: { numero: number; titulo?: string; texto: string },
  token: string
): Promise<Capitulo> {
  return api.post<Capitulo>(`/manuscritos/${manuscritoId}/capitulos`, datos, token);
}

export async function reintentarCapitulo(
  manuscritoId: number,
  capituloId: number,
  token: string
): Promise<import("@/types/capitulo").Capitulo> {
  return api.post(`/manuscritos/${manuscritoId}/capitulos/${capituloId}/reintentar`, {}, token);
}

export async function obtenerCapitulo(
  manuscritoId: number,
  capituloId: number,
  token: string,
): Promise<Capitulo> {
  return api.get<Capitulo>(`/manuscritos/${manuscritoId}/capitulos/${capituloId}`, token);
}

export async function actualizarCapitulo(
  manuscritoId: number,
  capituloId: number,
  datos: { titulo?: string; texto?: string },
  token: string,
): Promise<Capitulo> {
  return api.patch<Capitulo>(
    `/manuscritos/${manuscritoId}/capitulos/${capituloId}`,
    datos,
    token,
  );
}

export async function listarVersiones(
  manuscritoId: number,
  capituloId: number,
  token: string,
): Promise<VersionCapitulo[]> {
  return api.get<VersionCapitulo[]>(
    `/manuscritos/${manuscritoId}/capitulos/${capituloId}/versiones`,
    token,
  );
}

export async function restaurarVersion(
  manuscritoId: number,
  capituloId: number,
  numeroVersion: number,
  token: string,
): Promise<RestaurarResult> {
  return api.post<RestaurarResult>(
    `/manuscritos/${manuscritoId}/capitulos/${capituloId}/versiones/${numeroVersion}/restaurar`,
    {},
    token,
  );
}

export async function procesarCapitulo(
  manuscritoId: number,
  capituloId: number,
  token: string
): Promise<{ capitulo_id: number; task_id: string; mensaje: string }> {
  return api.post(`/manuscritos/${manuscritoId}/capitulos/${capituloId}/procesar`, {}, token);
}
