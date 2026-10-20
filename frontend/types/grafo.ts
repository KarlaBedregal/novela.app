export type EstadoCanon =
  | "suggestion"
  | "canon"
  | "draft"
  | "ambiguous"
  | "contradictory"
  | "superseded";

export type Prioridad = "S" | "A" | "B" | "C";
export type TipoNodo = "personaje" | "lugar" | "objeto" | "evento";

export interface NodoGrafo {
  id: number;
  manuscrito_id: number;
  tipo: TipoNodo;
  nombre: string;
  nombre_anonimizado?: string;
  descripcion?: string;
  primer_cap_aparicion?: number;
  ultimo_cap_aparicion?: number;
  metadatos?: Record<string, unknown>;
  estado: EstadoCanon;
  fuente_primera_mencion?: string;  // provenance: fragmento exacto del texto
  prioridad: Prioridad;
  prioridad_override: boolean;
  created_at: string;
}

export interface AristaGrafo {
  id: number;
  manuscrito_id: number;
  nodo_origen_id: number;
  nodo_destino_id: number;
  tipo_relacion: string;
  descripcion?: string;
  cap_inicio?: number;
  cap_fin?: number;
  estado: EstadoCanon;
  fuente_texto?: string;  // provenance
  supersedida_por_id?: number;
  prioridad: Prioridad;
  created_at: string;
}

export interface GrafoCompleto {
  manuscrito_id: number;
  nodos: NodoGrafo[];
  aristas: AristaGrafo[];
}

export interface CanonEvento {
  id: number;
  manuscrito_id: number;
  tipo_evento: string;
  entidad_tipo: "nodo" | "arista";
  entidad_id: number;
  estado_anterior?: EstadoCanon;
  estado_nuevo?: EstadoCanon;
  descripcion?: string;
  realizado_por: "ia" | "autor";
  created_at: string;
}

// Colores por estado para la UI
export const ESTADO_COLORES: Record<EstadoCanon, string> = {
  suggestion:    "#f59e0b",  // ámbar
  canon:         "#10b981",  // verde
  draft:         "#6366f1",  // violeta
  ambiguous:     "#8b5cf6",  // púrpura
  contradictory: "#ef4444",  // rojo
  superseded:    "#9ca3af",  // gris
};

// Labels en español para la UI
export const ESTADO_LABELS: Record<EstadoCanon, string> = {
  suggestion:    "Sugerencia IA",
  canon:         "Canon confirmado",
  draft:         "Planeado",
  ambiguous:     "Ambiguo",
  contradictory: "Contradicción",
  superseded:    "Reemplazado",
};
