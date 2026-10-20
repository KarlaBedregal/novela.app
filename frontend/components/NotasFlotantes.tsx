"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Nota {
  id: string;
  texto: string;
  creadaEn: string;
}

const STORAGE_KEY = "inkverse_notas";
const POS_KEY     = "inkverse_notas_pos";

function cargarNotas(): Nota[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function guardarNotas(notas: Nota[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
}

export function NotasFlotantes() {
  const [abierto,      setAbierto]      = useState(false);
  const [notas,        setNotas]        = useState<Nota[]>([]);
  const [nueva,        setNueva]        = useState("");
  const [editandoId,   setEditandoId]   = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState("");
  // pos: coordenadas top-left absolutas; null = posición default (bottom-right CSS)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const dragRef      = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Cargar notas y posición guardada
  useEffect(() => {
    setNotas(cargarNotas());
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) setPos(JSON.parse(saved));
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 100);
  }, [abierto]);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const onMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.startPosX + dx;
    const newY = dragRef.current.startPosY + dy;
    const maxX = window.innerWidth  - 340;
    const maxY = window.innerHeight - 64;
    const clamped = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    };
    setPos(clamped);
  }, []);

  const onMouseUpDrag = useCallback(() => {
    if (dragRef.current) {
      // Persistir posición
      const el = containerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const p = { x: r.left, y: r.top };
        localStorage.setItem(POS_KEY, JSON.stringify(p));
      }
    }
    dragRef.current = null;
    document.removeEventListener("mousemove", onMouseMoveDrag);
    document.removeEventListener("mouseup",   onMouseUpDrag);
  }, [onMouseMoveDrag]);

  const onMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX:    e.clientX,
      startY:    e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
    };
    document.addEventListener("mousemove", onMouseMoveDrag);
    document.addEventListener("mouseup",   onMouseUpDrag);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMouseMoveDrag);
      document.removeEventListener("mouseup",   onMouseUpDrag);
    };
  }, [onMouseMoveDrag, onMouseUpDrag]);

  // ── Notas CRUD ─────────────────────────────────────────────────────────────

  const agregar = () => {
    const texto = nueva.trim();
    if (!texto) return;
    const nota: Nota = { id: Date.now().toString(), texto, creadaEn: new Date().toISOString() };
    const nuevasNotas = [nota, ...notas];
    setNotas(nuevasNotas);
    guardarNotas(nuevasNotas);
    setNueva("");
  };

  const borrar = (id: string) => {
    const filtradas = notas.filter(n => n.id !== id);
    setNotas(filtradas);
    guardarNotas(filtradas);
    if (editandoId === id) setEditandoId(null);
  };

  const iniciarEdicion = (nota: Nota) => {
    setEditandoId(nota.id);
    setTextoEdicion(nota.texto);
  };

  const guardarEdicion = (id: string) => {
    const texto = textoEdicion.trim();
    if (!texto) return;
    const actualizadas = notas.map(n => n.id === id ? { ...n, texto } : n);
    setNotas(actualizadas);
    guardarNotas(actualizadas);
    setEditandoId(null);
  };

  const cancelarEdicion = () => { setEditandoId(null); setTextoEdicion(""); };

  // ── Render ─────────────────────────────────────────────────────────────────

  const containerStyle = pos
    ? { left: pos.x, top: pos.y, bottom: "auto", right: "auto" }
    : {};

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`fixed z-50 flex flex-col items-end gap-3 ${!pos ? "bottom-6 right-6" : ""}`}
    >
      {/* Panel desplegable */}
      {abierto && (
        <div
          className="w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "440px" }}
        >
          {/* Header — zona de drag */}
          <div
            onMouseDown={onMouseDownDrag}
            className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-b border-gray-700 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">📝</span>
              <span className="text-sm font-semibold text-amber-300">Mis notas</span>
              {notas.length > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                  {notas.length}
                </span>
              )}
            </div>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setAbierto(false)}
              className="text-gray-500 hover:text-gray-200 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Input nueva nota */}
          <div className="px-3 py-2 border-b border-gray-800">
            <textarea
              ref={inputRef}
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); agregar(); }
              }}
              placeholder="Nueva nota... (Enter para guardar)"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              onClick={agregar}
              disabled={!nueva.trim()}
              className="mt-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold rounded-lg transition-colors"
            >
              Agregar nota
            </button>
          </div>

          {/* Lista de notas */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {notas.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-4">Sin notas aún</p>
            ) : (
              notas.map(nota => (
                <div
                  key={nota.id}
                  className="group relative bg-gray-800 rounded-lg px-3 py-2 border border-gray-700"
                >
                  {editandoId === nota.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        autoFocus
                        value={textoEdicion}
                        onChange={e => setTextoEdicion(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); guardarEdicion(nota.id); }
                          if (e.key === "Escape") cancelarEdicion();
                        }}
                        rows={3}
                        className="w-full bg-gray-700 border border-amber-500 rounded px-2 py-1 text-sm text-white resize-none focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarEdicion(nota.id)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="text-xs text-gray-500 hover:text-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap pr-12">{nota.texto}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(nota.creadaEn).toLocaleDateString("es-PE", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => iniciarEdicion(nota)}
                          className="text-amber-600 hover:text-amber-400 text-sm leading-none"
                          aria-label="Editar nota"
                          title="Editar"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => borrar(nota.id)}
                          className="text-gray-600 hover:text-red-400 text-sm leading-none ml-0.5"
                          aria-label="Borrar nota"
                          title="Borrar"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Botón flotante — también arrastrable cuando el panel está cerrado */}
      <button
        onMouseDown={!abierto ? onMouseDownDrag : undefined}
        onClick={() => setAbierto(o => !o)}
        className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 relative ${
          abierto
            ? "bg-amber-400 text-black scale-95 cursor-pointer"
            : "bg-amber-500 hover:bg-amber-400 text-black cursor-grab active:cursor-grabbing"
        }`}
        aria-label={abierto ? "Cerrar notas" : "Abrir notas"}
        title="Mis notas"
      >
        <span className="text-lg select-none">✏️</span>
        {!abierto && notas.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center font-bold select-none">
            {notas.length > 9 ? "9+" : notas.length}
          </span>
        )}
      </button>
    </div>
  );
}
