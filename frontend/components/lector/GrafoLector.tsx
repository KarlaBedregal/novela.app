"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Nodo {
  id: number | string;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
}

interface Arista {
  id: number | string;
  nodo_origen_id: number | string;
  nodo_destino_id: number | string;
  tipo_relacion?: string | null;
  descripcion?: string | null;
}

interface GrafoCompleto {
  nodos: Nodo[];
  aristas: Arista[];
}

interface Props {
  manuscritoId: number;
  capActual: number;
  token?: string | null;
}

export function GrafoLector({ manuscritoId, capActual, token }: Props) {
  const [grafo, setGrafo] = useState<GrafoCompleto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ cap_max: String(capActual) });

    api.get<GrafoCompleto>(
      `/grafo/${manuscritoId}/lector?${params}`,
      token ?? undefined,
    )
      .then(setGrafo)
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar el grafo"))
      .finally(() => setCargando(false));
  }, [manuscritoId, capActual, token]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-red-400 text-sm">{error}</div>
    );
  }

  const personajes = grafo?.nodos.filter((n) => n.tipo === "personaje") ?? [];

  if (personajes.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 text-sm">El grafo se irá revelando conforme leas</p>
      </div>
    );
  }

  // Construir mapa de nombres por id para mostrar relaciones
  const nombrePorId = new Map<string | number, string>(
    grafo!.nodos.map((n) => [n.id, n.nombre]),
  );

  // Relaciones que involucran solo personajes ya revelados
  const idPersonajes = new Set(personajes.map((p) => p.id));
  const relaciones = (grafo?.aristas ?? []).filter(
    (a) => idPersonajes.has(a.nodo_origen_id) && idPersonajes.has(a.nodo_destino_id),
  );

  // Agrupar relaciones por personaje origen
  const relPorPersonaje = new Map<string | number, Arista[]>();
  for (const rel of relaciones) {
    if (!relPorPersonaje.has(rel.nodo_origen_id)) {
      relPorPersonaje.set(rel.nodo_origen_id, []);
    }
    relPorPersonaje.get(rel.nodo_origen_id)!.push(rel);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-white font-semibold text-sm">
          Personajes descubiertos hasta el capítulo {capActual}
        </h3>
        <span className="bg-violet-900/60 text-violet-300 border border-violet-800 text-xs px-2 py-0.5 rounded-full font-medium">
          {personajes.length}
        </span>
      </div>

      {/* Lista de personajes */}
      <div className="flex flex-col gap-4">
        {personajes.map((p) => {
          const rels = relPorPersonaje.get(p.id) ?? [];
          return (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <div className="mb-1">
                <span className="text-white font-medium text-sm">{p.nombre}</span>
              </div>
              {p.descripcion && (
                <p className="text-gray-400 text-xs leading-relaxed mb-2">{p.descripcion}</p>
              )}
              {rels.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {rels.map((r) => (
                    <div key={r.id} className="text-xs text-gray-500">
                      <span className="text-gray-400">{r.tipo_relacion ?? "→"}</span>{" "}
                      <span className="text-gray-300">{nombrePorId.get(r.nodo_destino_id) ?? "?"}</span>
                      {r.descripcion && (
                        <span className="text-gray-600"> · {r.descripcion}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
