"use client";
import { useState, useEffect, useCallback } from "react";
import { login as apiLogin, registro as apiRegistro, guardarToken } from "@/lib/auth";
import type { Usuario, AuthState } from "@/types/usuario";

const TOKEN_KEY = "token";

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: null,
    cargando: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ usuario: null, token: null, cargando: false });
      return;
    }
    fetch("http://localhost:8000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((usuario: Usuario) =>
        setState({ usuario, token, cargando: false })
      )
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ usuario: null, token: null, cargando: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, usuario } = await apiLogin(email, password);
    guardarToken(token);
    setState({ usuario, token, cargando: false });
    return usuario;
  }, []);

  const registrar = useCallback(
    async (email: string, nombre: string, password: string) => {
      const { token, usuario } = await apiRegistro(email, nombre, password);
      guardarToken(token);
      setState({ usuario, token, cargando: false });
      return usuario;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ usuario: null, token: null, cargando: false });
  }, []);

  return { ...state, login, registrar, logout };
}
