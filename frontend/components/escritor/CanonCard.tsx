"use client";
import type { NodoGrafo, AristaGrafo } from "@/types/grafo";
import { EstadoBadge } from "@/components/grafo/EstadoBadge";

type Entidad = (NodoGrafo | AristaGrafo) & { _tipo: "nodo" | "arista" };

interface Props {
  entidad: NodoGrafo | AristaGrafo;
  tipo: "nodo" | "arista";
  onAprobar: () => void;
  onRechazar: () => void;
  onCorregir?: () => void;
}

export function CanonCard({ entidad, tipo, onAprobar, onRechazar, onCorregir }: Props) {
  const nombre = tipo === "nodo"
    ? (entidad as NodoGrafo).nombre
    : `Relación: ${(entidad as AristaGrafo).tipo_relacion}`;

  const fuente = tipo === "nodo"
    ? (entidad as NodoGrafo).fuente_primera_mencion
    : (entidad as AristaGrafo).fuente_texto;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white font-medium">{nombre}</p>
          <p className="text-gray-500 text-xs capitalize">{tipo}</p>
        </div>
        <EstadoBadge estado={entidad.estado} size="sm" />
      </div>

      {/* Provenance — por qué la IA infirió esto */}
      {fuente && (
        <div className="bg-gray-800 rounded-lg p-2 mb-3 border-l-2 border-amber-600">
          <p className="text-gray-400 text-xs mb-1">El agente lo detectó en:</p>
          <p className="text-gray-300 text-xs italic">
            "...{fuente.slice(0, 150)}{fuente.length > 150 ? "..." : ""}"
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onAprobar}
          className="flex-1 py-1.5 bg-green-800 hover:bg-green-700 text-green-100 text-xs rounded-lg transition-colors"
        >
          ✓ Confirmar canon
        </button>
        {onCorregir && (
          <button
            onClick={onCorregir}
            className="flex-1 py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs rounded-lg transition-colors"
          >
            ✎ Corregir
          </button>
        )}
        <button
          onClick={onRechazar}
          className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
        >
          ✕ Descartar
        </button>
      </div>
    </div>
  );
}
