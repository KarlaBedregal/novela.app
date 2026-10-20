"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { GrafoCanvas } from "@/components/grafo/GrafoCanvas";
import { api } from "@/lib/api";
import type { GrafoCompleto, NodoGrafo } from "@/types/grafo";

function GrafoContent() {
  const { id }       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const capMax       = parseInt(searchParams.get("capitulo") ?? "999");
  const manuscritoId = parseInt(id);

  const [grafo,    setGrafo]    = useState<GrafoCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params = new URLSearchParams();
    if (!isNaN(capMax) && capMax < 999) params.set("cap_max", String(capMax));
    const qs = params.toString() ? `?${params}` : "";

    api.get<GrafoCompleto>(
      `/grafo/${manuscritoId}/lector${qs}`,
      token ?? undefined,
    )
      .then(setGrafo)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar el grafo"))
      .finally(() => setCargando(false));
  }, [manuscritoId, capMax]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!grafo) return null;

  const personajes = grafo.nodos.filter((n: NodoGrafo) => n.tipo === "personaje");
  const lugares    = grafo.nodos.filter((n: NodoGrafo) => n.tipo === "lugar");

  return (
    <div className="relative w-full h-screen bg-gray-950">
      <div className="absolute top-0 left-0 right-0 z-20 bg-gray-900/95 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">
            Grafo de personajes
            {capMax < 999 && (
              <span className="ml-2 text-amber-400">hasta capítulo {capMax}</span>
            )}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Solo relaciones confirmadas · Spoilers posteriores ocultos
          </p>
        </div>
        <div className="flex gap-3">
          <Stat label="Personajes" value={personajes.length} />
          <Stat label="Lugares"    value={lugares.length} />
          <Stat label="Relaciones" value={grafo.aristas.length} />
        </div>
      </div>

      {grafo.nodos.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Sin personajes confirmados aún</p>
            <p className="text-gray-700 text-sm mt-1">
              El autor debe revisar y confirmar las sugerencias de la IA
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-16 h-full">
          <GrafoCanvas grafo={grafo} modo="lector" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-1.5 text-center">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-bold">{value}</p>
    </div>
  );
}

export default function GrafoLectorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GrafoContent />
    </Suspense>
  );
}
