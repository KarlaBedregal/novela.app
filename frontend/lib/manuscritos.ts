import { api } from "./api";
import type { Manuscrito } from "@/types/manuscrito";

export async function listarManuscritos(token: string): Promise<Manuscrito[]> {
  return api.get<Manuscrito[]>("/manuscritos/", token);
}

export async function crearManuscrito(
  datos: { titulo: string; genero?: string; nivel_contenido?: string; sinopsis?: string },
  token: string
): Promise<Manuscrito> {
  return api.post<Manuscrito>("/manuscritos/", datos, token);
}

export async function obtenerManuscrito(id: number, token: string): Promise<Manuscrito> {
  return api.get<Manuscrito>(`/manuscritos/${id}`, token);
}

export async function eliminarManuscrito(id: number, token: string): Promise<void> {
  return api.delete(`/manuscritos/${id}`, token);
}
