import type { NodoGrafo, AristaGrafo, GrafoCompleto, EstadoCanon } from "@/types/grafo";
import { ESTADO_COLORES } from "@/types/grafo";

// Convierte el grafo del backend al formato de elementos de Cytoscape.js
export function grafoCytoscape(grafo: GrafoCompleto) {
  const nodos = grafo.nodos.map((n) => ({
    data: {
      id:     `n${n.id}`,
      label:  n.nombre,
      tipo:   n.tipo,
      estado: n.estado,
      color:  ESTADO_COLORES[n.estado],
      prioridad: n.prioridad,
      fuente:    n.fuente_primera_mencion,
      raw:    n,
    },
  }));

  const nodoPorId = new Map(grafo.nodos.map((n) => [n.id, n]));

  const aristas = grafo.aristas.map((a) => {
    const origen  = nodoPorId.get(a.nodo_origen_id);
    const destino = nodoPorId.get(a.nodo_destino_id);
    const tipoArista =
      origen?.tipo === "personaje" && destino?.tipo === "personaje" ? "per-per" :
      destino?.tipo === "lugar"    ? "per-loc" : "per-obj";

    return {
      data: {
        id:         `a${a.id}`,
        source:     `n${a.nodo_origen_id}`,
        target:     `n${a.nodo_destino_id}`,
        label:      a.tipo_relacion,
        estado:     a.estado,
        color:      ESTADO_COLORES[a.estado],
        fuente:     a.fuente_texto,
        tipoArista,
        terminada:  0,   // se sobreescribe al filtrar por capActual
        raw:        a,
      },
    };
  });

  return [...nodos, ...aristas];
}

// Filtra el grafo para la vista del lector (fog-of-war)
export function grafoFogOfWar(grafo: GrafoCompleto, capMax: number): GrafoCompleto {
  const nodos = grafo.nodos.filter(
    (n) => (n.primer_cap_aparicion ?? 0) <= capMax
  );
  const nodoIds = new Set(nodos.map((n) => n.id));
  const aristas = grafo.aristas.filter(
    (a) =>
      nodoIds.has(a.nodo_origen_id) &&
      nodoIds.has(a.nodo_destino_id) &&
      (a.cap_inicio ?? 0) <= capMax &&
      a.estado === "canon",
  );
  return { manuscrito_id: grafo.manuscrito_id, nodos, aristas };
}

// Retorna el historial de supersesiones de una arista como cadena ordenada
export function historialeDeRelacion(aristas: AristaGrafo[], aristaId: number): AristaGrafo[] {
  const por_id = new Map(aristas.map((a) => [a.id, a]));
  const historial: AristaGrafo[] = [];
  let actual = por_id.get(aristaId);
  while (actual) {
    historial.unshift(actual);
    const antecesora = aristas.find((a) => a.supersedida_por_id === actual!.id);
    actual = antecesora;
  }
  return historial;
}

export type { EstadoCanon };
