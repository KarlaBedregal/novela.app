"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { GrafoCompleto } from "@/types/grafo";

export function useGrafo(manuscritoId: number | null, token: string | null) {
  const [grafo, setGrafo]       = useState<GrafoCompleto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const cargar = async (soloCañon = false) => {
    if (!manuscritoId || !token) return;
    setCargando(true);
    setError(null);
    try {
      const params = soloCañon ? "?solo_canon=true" : "";
      const data = await api.get<GrafoCompleto>(
        `/grafo/${manuscritoId}${params}`, token
      );
      setGrafo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el grafo");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [manuscritoId, token]);  // eslint-disable-line

  return { grafo, cargando, error, recargar: cargar };
}
