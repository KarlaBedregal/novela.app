"use client";
import { useEffect, useRef } from "react";
import type { GrafoCompleto, NodoGrafo, AristaGrafo } from "@/types/grafo";
import { ESTADO_COLORES } from "@/types/grafo";

interface Props {
  grafo: GrafoCompleto;
  capActual?: number;
  onNodoClick?:  (nodo: NodoGrafo)   => void;
  onAristaClick?: (arista: AristaGrafo) => void;
  modo?: "escritor" | "lector";
}

export function GrafoCanvas({ grafo, capActual, onNodoClick, onAristaClick, modo = "escritor" }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const cyRef         = useRef<unknown>(null);
  const posicionesRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    import("cytoscape").then((cytoscape) => {
      if (!isMounted || !containerRef.current) return;

      // Destruir instancia anterior si existe
      if (cyRef.current) {
        (cyRef.current as any).destroy();
        cyRef.current = null;
      }

      const nodeSize = modo === "lector" ? 32 : 44;

      // ── Filtrar grafo según capActual ──────────────────────────────────────
      const nodosFiltrados = capActual !== undefined
        ? grafo.nodos.filter(n => (n.primer_cap_aparicion ?? 1) <= capActual)
        : grafo.nodos;

      const nodoIds = new Set(nodosFiltrados.map(n => n.id));

      const aristasFiltradas = grafo.aristas.filter(a =>
        nodoIds.has(a.nodo_origen_id) &&
        nodoIds.has(a.nodo_destino_id) &&
        (capActual === undefined || (a.cap_inicio ?? 1) <= capActual)
      );

      // ── Construir elementos Cytoscape ─────────────────────────────────────
      const nodoPorId = new Map(grafo.nodos.map(n => [n.id, n]));

      const elementos = [
        ...nodosFiltrados.map(n => ({
          data: {
            id:       `n${n.id}`,
            label:    n.nombre,
            tipo:     n.tipo,
            estado:   n.estado,
            color:    ESTADO_COLORES[n.estado],
            prioridad: n.prioridad,
            raw:      n,
          },
        })),
        ...aristasFiltradas.map(a => {
          const origen  = nodoPorId.get(a.nodo_origen_id);
          const destino = nodoPorId.get(a.nodo_destino_id);
          const tipoArista =
            origen?.tipo === "personaje" && destino?.tipo === "personaje" ? "per-per" :
            destino?.tipo === "lugar"    ? "per-loc" : "per-obj";
          const terminada = (
            capActual !== undefined &&
            a.cap_fin != null &&
            a.cap_fin < capActual
          ) ? 1 : 0;

          return {
            data: {
              id:      `a${a.id}`,
              source:  `n${a.nodo_origen_id}`,
              target:  `n${a.nodo_destino_id}`,
              label:   a.tipo_relacion,
              estado:  a.estado,
              color:   ESTADO_COLORES[a.estado],
              tipoArista,
              terminada,
              raw:     a,
            },
          };
        }),
      ];

      // ── Usar posiciones guardadas si existen ──────────────────────────────
      const tienePos = Object.keys(posicionesRef.current).length > 0;

      // @ts-ignore
      cyRef.current = cytoscape.default({
        container:           containerRef.current,
        elements:            elementos,
        userZoomingEnabled:  true,
        userPanningEnabled:  true,
        boxSelectionEnabled: false,
        style: [
          {
            selector: "node",
            style: {
              label:                "data(label)",
              "background-color":   "data(color)",
              color:                "#f9fafb",
              "text-valign":        "center",
              "text-halign":        "center",
              "font-size":          "11px",
              "font-weight":        "bold",
              "text-wrap":          "wrap",
              "text-max-width":     "80px",
              "text-outline-color": "#111827",
              "text-outline-width": 2,
              width:                nodeSize,
              height:               nodeSize,
              "border-width":       2,
              "border-color":       "data(color)",
              "border-opacity":     0.5,
            },
          },
          { selector: 'node[tipo = "personaje"]', style: { "background-color": "#7c3aed" } },
          { selector: 'node[tipo = "lugar"]',     style: { "background-color": "#0369a1", shape: "rectangle" as const } },
          { selector: 'node[tipo = "objeto"]',    style: { "background-color": "#0f766e", shape: "diamond"   as const } },
          { selector: 'node[prioridad = "C"]',    style: { opacity: 0.55, width: 24, height: 24, "font-size": "9px" } },
          {
            selector: "edge",
            style: {
              label:                     "data(label)",
              "line-color":              "data(color)",
              "target-arrow-color":      "data(color)",
              "target-arrow-shape":      "triangle" as const,
              "arrow-scale":             1.2,
              "curve-style":             "bezier"   as const,
              "control-point-step-size": 40,
              color:                     "#9ca3af",
              "font-size":               "9px",
              "text-rotation":           "autorotate" as const,
              "text-background-color":   "#111827",
              "text-background-opacity": 0.85,
              "text-background-padding": "3px",
              width:                     1.5,
            },
          },
          { selector: 'edge[tipoArista = "per-loc"]', style: { "line-style": "dashed" as const, width: 1, opacity: 0.7 } },
          { selector: 'edge[tipoArista = "per-obj"]', style: { "line-style": "dotted" as const, width: 1, opacity: 0.7 } },
          { selector: "edge[terminada = 1]",           style: { opacity: 0.25, "line-style": "dashed" as const } },
        ],
        layout: tienePos
          ? {
              name: "preset",
              positions: (node: any) =>
                posicionesRef.current[node.id()] ?? {
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                },
              animate: true,
              animationDuration: 300,
            }
          : {
              name:             "cose",
              padding:          60,
              nodeRepulsion:    10000,
              nodeOverlap:      30,
              idealEdgeLength:  140,
              edgeElasticity:   0.45,
              gravity:          0.25,
              animate:          true,
              animationDuration: 800,
              animationEasing:  "ease-out",
            },
      });

      const cy = cyRef.current as any;

      cy.on("layoutstop", () => {
        if (!isMounted) return;
        cy.nodes().forEach((node: any) => {
          posicionesRef.current[node.id()] = { ...node.position() };
        });
        cy.fit(undefined, 50);
      });

      cy.on("dragfree", "node", (evt: any) => {
        const node = evt.target;
        posicionesRef.current[node.id()] = { ...node.position() };
      });

      cy.on("tap", "node", (evt: any) => {
        onNodoClick?.(evt.target.data("raw") as NodoGrafo);
      });

      cy.on("tap", "edge", (evt: any) => {
        onAristaClick?.(evt.target.data("raw") as AristaGrafo);
      });
    });

    return () => {
      isMounted = false;
      if (cyRef.current) {
        (cyRef.current as any).destroy();
        cyRef.current = null;
      }
    };
  }, [grafo, capActual, modo]); // eslint-disable-line

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] rounded-lg bg-gray-950"
    />
  );
}
