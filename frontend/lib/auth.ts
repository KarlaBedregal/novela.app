import { api } from "./api";
import type { Usuario } from "@/types/usuario";

export async function login(email: string, password: string): Promise<{ token: string; usuario: Usuario }> {
  const res = await api.post<{ access_token: string; usuario: Usuario }>("/auth/login", { email, password });
  return { token: res.access_token, usuario: res.usuario };
}

export async function registro(email: string, nombre: string, password: string) {
  const res = await api.post<{ access_token: string; usuario: Usuario }>("/auth/registro", { email, nombre, password });
  return { token: res.access_token, usuario: res.usuario };
}

export function guardarToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("token", token);
}

export function obtenerToken(): string | null {
  if (typeof window !== "undefined") return localStorage.getItem("token");
  return null;
}

export function cerrarSesion() {
  if (typeof window !== "undefined") localStorage.removeItem("token");
}
