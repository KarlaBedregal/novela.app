import type { AristaGrafo, NodoGrafo } from "@/types/grafo";
import { ESTADO_COLORES, ESTADO_LABELS } from "@/types/grafo";
import { historialeDeRelacion } from "@/lib/grafo";

interface Props {
  aristaId:        number;
  todasLasAristas: AristaGrafo[];
  nodos:           NodoGrafo[];
  capActual?:      number;
  onCerrar:        () => void;
}

export function AristaTimeline({ aristaId, todasLasAristas, nodos, capActual, onCerrar }: Props) {
  const historial    = historialeDeRelacion(todasLasAristas, aristaId);
  const nodoNombre   = (id: number) => nodos.find((n) => n.id === id)?.nombre ?? `#${id}`;

  // Determina qué entrada del historial es la vigente en capActual
  const esVigente = (a: AristaGrafo) => {
    if (capActual === undefined) return false;
    const inicio = a.cap_inicio ?? 1;
    const fin    = a.cap_fin ?? Infinity;
    return capActual >= inicio && capActual <= fin;
  };

  if (historial.length === 0) return null;

  const primera = historial[0];
  const origen  = nodoNombre(primera.nodo_origen_id);
  const destino = nodoNombre(primera.nodo_destino_id);

  return (
    <div className="w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h3 className="text-white font-semibold text-sm">
            {origen} — {destino}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {historial.length} fase{historial.length !== 1 ? "s" : ""} en la historia
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Timeline */}
      <div className="px-4 py-4 max-h-96 overflow-y-auto">
        <div className="relative">
          {/* línea vertical continua */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-700" />

          {historial.map((arista, i) => {
            const vigente    = esVigente(arista);
            const terminada  = arista.cap_fin !== undefined && arista.cap_fin !== null;
            const esUltima   = i === historial.length - 1;

            return (
              <div key={arista.id} className="relative pl-6 mb-4 last:mb-0">
                {/* punto en la línea */}
                <div
                  className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    vigente
                      ? "border-white scale-125"
                      : "border-gray-700"
                  }`}
                  style={{ backgroundColor: ESTADO_COLORES[arista.estado] }}
                />

                <div className={`rounded-lg p-3 border transition-colors ${
                  vigente
                    ? "bg-gray-800 border-violet-500/50"
                    : "bg-gray-800/50 border-gray-700/50"
                }`}>
                  {/* Capítulo y tipo */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-violet-400 text-xs font-mono">
                      Cap. {arista.cap_inicio ?? "?"}
                      {terminada ? ` – ${arista.cap_fin}` : esUltima ? " – presente" : ""}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: ESTADO_COLORES[arista.estado] + "22",
                        color:           ESTADO_COLORES[arista.estado],
                      }}
                    >
                      {ESTADO_LABELS[arista.estado]}
                    </span>
                  </div>

                  {/* Tipo de relación */}
                  <p className="text-white text-sm font-medium">
                    {arista.tipo_relacion.replace(/_/g, " ")}
                  </p>

                  {/* Descripción */}
                  {arista.descripcion && (
                    <p className="text-gray-400 text-xs mt-1">{arista.descripcion}</p>
                  )}

                  {/* Fragmento fuente */}
                  {arista.fuente_texto && (
                    <p className="text-gray-500 text-xs mt-1.5 italic border-l-2 border-gray-600 pl-2">
                      "{arista.fuente_texto.slice(0, 100)}{arista.fuente_texto.length > 100 ? "…" : ""}"
                    </p>
                  )}

                  {/* Relación terminada */}
                  {terminada && (
                    <p className="text-gray-600 text-xs mt-1.5">
                      Relación terminada en cap. {arista.cap_fin}
                    </p>
                  )}

                  {/* Indicador de estado actual */}
                  {vigente && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-violet-400 text-xs">Estado en cap. {capActual}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
