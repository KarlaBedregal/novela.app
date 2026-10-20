"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { NodoGrafo, AristaGrafo } from "@/types/grafo";

interface SuggestionsPendientes {
  nodos:   NodoGrafo[];
  aristas: AristaGrafo[];
}

export function useCanonReview(manuscritoId: number | null, token: string | null) {
  const [pendientes, setPendientes] = useState<SuggestionsPendientes>({ nodos: [], aristas: [] });
  const [cargando, setCargando]     = useState(false);

  const cargar = useCallback(async () => {
    if (!manuscritoId || !token) return;
    setCargando(true);
    try {
      const data = await api.get<SuggestionsPendientes>(
        `/canon/${manuscritoId}/suggestions`, token
      );
      setPendientes(data);
    } finally {
      setCargando(false);
    }
  }, [manuscritoId, token]);

  const aprobar = async (tipo: "nodo" | "arista", id: number, nota?: string) => {
    await api.post(`/canon/${manuscritoId}/estado`, {
      entidad_tipo: tipo,
      entidad_id: id,
      nuevo_estado: "canon",
      nota,
    }, token!);
    await cargar();
  };

  const rechazar = async (tipo: "nodo" | "arista", id: number, nota?: string) => {
    await api.post(`/canon/${manuscritoId}/estado`, {
      entidad_tipo: tipo,
      entidad_id: id,
      nuevo_estado: "ambiguous",
      nota,
    }, token!);
    await cargar();
  };

  useEffect(() => { cargar(); }, [cargar]);

  const total = pendientes.nodos.length + pendientes.aristas.length;
  return { pendientes, cargando, total, aprobar, rechazar, recargar: cargar };
}
