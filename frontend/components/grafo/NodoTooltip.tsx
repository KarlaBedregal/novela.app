import type { NodoGrafo } from "@/types/grafo";
import { EstadoBadge } from "./EstadoBadge";

interface Props {
  nodo: NodoGrafo;
  onCerrar: () => void;
  onCambiarEstado?: (nodo: NodoGrafo) => void;
}

export function NodoTooltip({ nodo, onCerrar, onCambiarEstado }: Props) {
  return (
    <div className="absolute z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white font-semibold">{nodo.nombre}</p>
          <p className="text-gray-400 text-xs capitalize">{nodo.tipo}</p>
        </div>
        <button onClick={onCerrar} className="text-gray-500 hover:text-white text-lg leading-none">
          ×
        </button>
      </div>

      <EstadoBadge estado={nodo.estado} size="sm" />

      {nodo.descripcion && (
        <p className="text-gray-300 text-sm mt-2">{nodo.descripcion}</p>
      )}

      {/* Provenance: fragmento exacto del texto */}
      {nodo.fuente_primera_mencion && (
        <div className="mt-3 p-2 bg-gray-800 rounded-lg border-l-2 border-amber-500">
          <p className="text-gray-400 text-xs mb-1">Detectado en:</p>
          <p className="text-gray-300 text-xs italic">
            "...{nodo.fuente_primera_mencion.slice(0, 120)}..."
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Cap. {nodo.primer_cap_aparicion}–{nodo.ultimo_cap_aparicion ?? "?"}</span>
        <span>·</span>
        <span>Prioridad {nodo.prioridad}</span>
      </div>

      {onCambiarEstado && nodo.estado === "suggestion" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onCambiarEstado(nodo)}
            className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg"
          >
            Confirmar canon
          </button>
        </div>
      )}
    </div>
  );
}
