"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GrafoCanvas } from "@/components/grafo/GrafoCanvas";
import { NodoTooltip } from "@/components/grafo/NodoTooltip";
import { AristaTimeline } from "@/components/grafo/AristaTimeline";
import { CorreccionModal } from "@/components/escritor/CorreccionModal";
import { ChatIA } from "@/components/escritor/ChatIA";
import { useGrafo } from "@/hooks/useGrafo";
import { listarCapitulos } from "@/lib/capitulos";
import type { NodoGrafo, AristaGrafo } from "@/types/grafo";
import type { Capitulo } from "@/types/capitulo";

export default function GrafoPage() {
  const { id } = useParams<{ id: string }>();
  const manuscritoId = parseInt(id);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { grafo, cargando, error, recargar } = useGrafo(manuscritoId, token);

  const [capitulos,          setCapitulos]          = useState<Capitulo[]>([]);
  const [nodoSeleccionado,   setNodoSeleccionado]   = useState<NodoGrafo | null>(null);
  const [aristaSeleccionada, setAristaSeleccionada] = useState<AristaGrafo | null>(null);
  const [mostrarCorrector,   setMostrarCorrector]   = useState(false);
  const [capActual,          setCapActual]           = useState<number | null>(null);
  const [mostrarChat,        setMostrarChat]         = useState(false);
  const prevMaxCap = useRef<number>(1);

  // Carga capítulos y polling cada 10 s para detectar nuevos procesados
  useEffect(() => {
    if (!token) return;
    const cargar = () =>
      listarCapitulos(manuscritoId, token).then(setCapitulos).catch(() => {});
    cargar();
    const interval = setInterval(cargar, 10_000);
    return () => clearInterval(interval);
  }, [manuscritoId, token]);

  // maxCap = máximo entre los datos del grafo y los capítulos completados reales
  const maxCapGrafo = grafo
    ? Math.max(
        ...grafo.nodos.map(n => n.ultimo_cap_aparicion ?? 0),
        ...grafo.aristas.map(a => a.cap_inicio ?? 0),
        1,
      )
    : 1;
  const maxCapCompletados = capitulos
    .filter(c => c.estado_procesamiento === "completado")
    .reduce((m, c) => Math.max(m, c.numero), 0);
  const maxCap = Math.max(maxCapGrafo, maxCapCompletados, 1);

  // Inicialización y auto-avance cuando llegan nuevos capítulos
  useEffect(() => {
    if (capActual === null) {
      // Primera vez: ir al máximo
      setCapActual(maxCap);
      prevMaxCap.current = maxCap;
    } else if (maxCap > prevMaxCap.current) {
      // Nuevo capítulo procesado: avanzar solo si el usuario estaba en el último
      if (capActual === prevMaxCap.current) {
        setCapActual(maxCap);
      }
      prevMaxCap.current = maxCap;
      // Recargar el grafo para incluir los nuevos nodos/aristas
      recargar();
    }
  }, [maxCap]); // eslint-disable-line

  if (cargando) return <div className="p-8 text-gray-400">Cargando grafo...</div>;
  if (error)    return <div className="p-8 text-red-400">{error}</div>;
  if (!grafo)   return null;

  const pendientes = grafo.nodos.filter(n => n.estado === "suggestion").length
    + grafo.aristas.filter(a => a.estado === "suggestion").length;

  const handleNodoClick   = (n: NodoGrafo)   => { setAristaSeleccionada(null); setNodoSeleccionado(n); };
  const handleAristaClick = (a: AristaGrafo) => { setNodoSeleccionado(null);   setAristaSeleccionada(a); };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">

      {/* Stats top-left */}
      <div className="absolute top-4 left-4 z-10 flex gap-3 flex-wrap">
        <Stat label="Personajes" value={grafo.nodos.filter(n => n.tipo === "personaje").length} />
        <Stat label="Lugares"    value={grafo.nodos.filter(n => n.tipo === "lugar").length} />
        <Stat label="Objetos"    value={grafo.nodos.filter(n => n.tipo === "objeto").length} />
        <Stat label="Relaciones" value={grafo.aristas.length} />
        <Stat label="Por revisar" value={pendientes} alerta />
      </div>

      {/* Acciones top-right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {pendientes > 0 && (
          <Link
            href={`/manuscritos/${manuscritoId}/canon`}
            className="px-3 py-1.5 bg-amber-700/80 hover:bg-amber-600 text-amber-100 text-xs font-semibold rounded-lg transition-colors"
          >
            Revisar {pendientes} sugerencia{pendientes !== 1 ? "s" : ""}
          </Link>
        )}
        <button
          onClick={() => setMostrarCorrector(true)}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
        >
          ✎ Corregir canon
        </button>
        <button
          onClick={() => setMostrarChat(v => !v)}
          className={`px-3 py-1.5 border text-xs font-semibold rounded-lg transition-colors ${
            mostrarChat
              ? "bg-violet-700 border-violet-500 text-white"
              : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          💬 Chat IA
        </button>
      </div>

      {/* Grafo */}
      <GrafoCanvas
        grafo={grafo}
        capActual={capActual ?? undefined}
        onNodoClick={handleNodoClick}
        onAristaClick={handleAristaClick}
      />

      {/* Panel lateral — tooltip nodo */}
      {nodoSeleccionado && (
        <div className="absolute top-20 right-4 z-20">
          <NodoTooltip
            nodo={nodoSeleccionado}
            onCerrar={() => setNodoSeleccionado(null)}
          />
        </div>
      )}

      {/* Panel lateral — timeline arista */}
      {aristaSeleccionada && (
        <div className="absolute top-20 right-4 z-20">
          <AristaTimeline
            aristaId={aristaSeleccionada.id}
            todasLasAristas={grafo.aristas}
            nodos={grafo.nodos}
            capActual={capActual ?? undefined}
            onCerrar={() => setAristaSeleccionada(null)}
          />
        </div>
      )}

      {/* Slider temporal — bottom */}
      {capActual !== null && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gray-950/90 backdrop-blur-sm border-t border-gray-800 px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Cap. 1</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-violet-400">
                  Capítulo {capActual}
                  {capActual === maxCap && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">— actual</span>
                  )}
                </span>
                <button
                  onClick={() => { recargar(); listarCapitulos(manuscritoId, token!).then(setCapitulos).catch(() => {}); }}
                  title="Recargar grafo"
                  className="text-gray-600 hover:text-gray-300 transition-colors text-sm leading-none"
                >
                  ↺
                </button>
              </div>
              <span className="text-xs text-gray-600">Cap. {maxCap}</span>
            </div>
            {maxCap > 1 ? (
              <input
                type="range"
                min={1}
                max={maxCap}
                value={capActual}
                onChange={e => {
                  setCapActual(Number(e.target.value));
                  setAristaSeleccionada(null);
                  setNodoSeleccionado(null);
                }}
                className="w-full accent-violet-500 cursor-pointer h-1.5"
              />
            ) : (
              <div className="w-full h-1.5 bg-gray-800 rounded-full" />
            )}
            <p className="text-xs text-gray-700 text-center mt-1.5">
              {maxCap > 1
                ? "Desliza para ver cómo evoluciona la historia"
                : "Procesa más capítulos para ver la evolución"}
            </p>
          </div>
        </div>
      )}

      {/* Panel de chat IA */}
      {mostrarChat && token && (
        <div className="absolute top-16 right-4 bottom-24 z-30 w-80">
          <ChatIA
            manuscritoId={manuscritoId}
            token={token}
            onCerrar={() => setMostrarChat(false)}
          />
        </div>
      )}

      {/* Modal corrector */}
      {mostrarCorrector && token && (
        <CorreccionModal
          manuscritoId={manuscritoId}
          token={token}
          onAplicada={() => { recargar(); }}
          onCerrar={() => setMostrarCorrector(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, alerta = false }: { label: string; value: number; alerta?: boolean }) {
  return (
    <div className={`bg-gray-900/80 backdrop-blur border rounded-lg px-3 py-1.5 ${
      alerta && value > 0 ? "border-amber-600" : "border-gray-700"
    }`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`font-bold text-lg ${alerta && value > 0 ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
