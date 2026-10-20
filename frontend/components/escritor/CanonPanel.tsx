"use client";
import { useCanonReview } from "@/hooks/useCanonReview";
import { CanonCard } from "./CanonCard";

interface Props {
  manuscritoId: number;
  token: string;
}

export function CanonPanel({ manuscritoId, token }: Props) {
  const { pendientes, cargando, total, aprobar, rechazar } = useCanonReview(manuscritoId, token);

  if (cargando) {
    return <div className="text-gray-400 text-sm p-4">Cargando sugerencias...</div>;
  }

  if (total === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p className="text-lg">✓ Sin sugerencias pendientes</p>
        <p className="text-sm mt-1">El grafo está al día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">
          Revisión del canon
        </h2>
        <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
          {total} pendiente{total !== 1 ? "s" : ""}
        </span>
      </div>

      {pendientes.nodos.length > 0 && (
        <section>
          <h3 className="text-gray-400 text-sm mb-2">Personajes / entidades</h3>
          <div className="space-y-3">
            {pendientes.nodos.map((nodo) => (
              <CanonCard
                key={nodo.id}
                entidad={nodo}
                tipo="nodo"
                onAprobar={() => aprobar("nodo", nodo.id)}
                onRechazar={() => rechazar("nodo", nodo.id)}
              />
            ))}
          </div>
        </section>
      )}

      {pendientes.aristas.length > 0 && (
        <section>
          <h3 className="text-gray-400 text-sm mb-2">Relaciones</h3>
          <div className="space-y-3">
            {pendientes.aristas.map((arista) => (
              <CanonCard
                key={arista.id}
                entidad={arista}
                tipo="arista"
                onAprobar={() => aprobar("arista", arista.id)}
                onRechazar={() => rechazar("arista", arista.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
