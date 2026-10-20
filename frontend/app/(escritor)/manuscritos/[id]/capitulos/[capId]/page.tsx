"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { procesarCapitulo, reintentarCapitulo } from "@/lib/capitulos";
import { HistorialVersiones } from "@/components/escritor/HistorialVersiones";
import { ProcesamientoProgress } from "@/components/escritor/ProcesamientoProgress";
import type { Capitulo } from "@/types/capitulo";

const ESTADO_LABEL: Record<string, string> = {
  pendiente:   "Pendiente",
  en_cola:     "En cola",
  procesando:  "Procesando...",
  completado:  "Completado",
  error:       "Error",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  "text-gray-400 bg-gray-800",
  en_cola:    "text-yellow-400 bg-yellow-900/30",
  procesando: "text-blue-400 bg-blue-900/30",
  completado: "text-green-400 bg-green-900/30",
  error:      "text-red-400 bg-red-900/30",
};

export default function CapituloPage() {
  const { id, capId } = useParams<{ id: string; capId: string }>();
  const router = useRouter();
  const manuscritoId = parseInt(id);
  const capituloId   = parseInt(capId);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [capitulo,         setCapitulo]         = useState<Capitulo | null>(null);
  const [cargando,         setCargando]         = useState(true);
  const [editandoTexto,    setEditandoTexto]    = useState(false);
  const [texto,            setTexto]            = useState("");
  const [titulo,           setTitulo]           = useState("");
  const [guardando,        setGuardando]        = useState(false);
  const [taskId,           setTaskId]           = useState<string | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Capitulo>(
        `/manuscritos/${manuscritoId}/capitulos/${capituloId}`,
        token,
      );
      setCapitulo(data);
      setTexto(data.texto_plano ?? "");
      setTitulo(data.titulo ?? "");
    } catch {
      setError("No se pudo cargar el capítulo");
    } finally {
      setCargando(false);
    }
  }, [manuscritoId, capituloId, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Polling mientras procesa
  useEffect(() => {
    if (!capitulo) return;
    if (!["en_cola", "procesando"].includes(capitulo.estado_procesamiento)) return;
    const interval = setInterval(cargar, 3000);
    return () => clearInterval(interval);
  }, [capitulo?.estado_procesamiento, cargar]);

  const guardarEdicion = async () => {
    if (!token || !capitulo) return;
    setGuardando(true);
    setError(null);
    try {
      const updated = await api.patch<Capitulo>(
        `/manuscritos/${manuscritoId}/capitulos/${capituloId}`,
        { texto, titulo: titulo || undefined },
        token,
      );
      setCapitulo(updated);
      setEditandoTexto(false);
    } catch {
      setError("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const lanzarProcesamiento = async () => {
    if (!token || !capitulo) return;
    try {
      const res = await procesarCapitulo(manuscritoId, capituloId, token);
      setTaskId(res.task_id);
      setCapitulo(prev => prev ? { ...prev, estado_procesamiento: "en_cola" } : prev);
    } catch {
      setError("Error al lanzar procesamiento");
    }
  };

  const reintentar = async () => {
    if (!token) return;
    try {
      const updated = await reintentarCapitulo(manuscritoId, capituloId, token);
      setCapitulo(updated);
    } catch {
      setError("Error al reintentar");
    }
  };

  const handleRestaurar = () => {
    cargar();
    setMostrarHistorial(false);
  };

  if (cargando) {
    return (
      <div className="p-8 text-gray-400">Cargando capítulo...</div>
    );
  }

  if (error && !capitulo) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  if (!capitulo) return null;

  const puedeEditar   = !["en_cola", "procesando"].includes(capitulo.estado_procesamiento);
  const puedeProcesar = capitulo.estado_procesamiento === "pendiente";
  const tieneError    = capitulo.estado_procesamiento === "error";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/manuscritos/${manuscritoId}`}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          ← Capítulos
        </Link>
        <span className="text-gray-600">/</span>
        <h1 className="text-xl font-semibold text-white">
          Capítulo {capitulo.numero}
          {capitulo.titulo && (
            <span className="text-gray-400 font-normal ml-2">— {capitulo.titulo}</span>
          )}
        </h1>
        <span
          className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLOR[capitulo.estado_procesamiento]}`}
        >
          {ESTADO_LABEL[capitulo.estado_procesamiento]}
        </span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Progreso de procesamiento */}
      {taskId && ["en_cola", "procesando"].includes(capitulo.estado_procesamiento) && (
        <ProcesamientoProgress
          taskId={taskId}
          onCompletado={() => { setTaskId(null); cargar(); }}
        />
      )}

      {/* Metadatos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500">Palabras</p>
          <p className="text-lg font-semibold text-white">
            {capitulo.total_palabras?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500">Versión</p>
          <p className="text-lg font-semibold text-white">v{capitulo.version_actual}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500">Creado</p>
          <p className="text-sm font-medium text-white">
            {new Date(capitulo.created_at).toLocaleDateString("es-PE", {
              day: "2-digit", month: "short",
            })}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-xs text-gray-500">Actualizado</p>
          <p className="text-sm font-medium text-white">
            {capitulo.updated_at
              ? new Date(capitulo.updated_at).toLocaleDateString("es-PE", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        {puedeEditar && (
          <button
            onClick={() => {
              setTexto(capitulo.texto_plano ?? "");
              setTitulo(capitulo.titulo ?? "");
              setEditandoTexto(true);
            }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
          >
            Editar capítulo
          </button>
        )}
        {puedeProcesar && (
          <button
            onClick={lanzarProcesamiento}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Procesar con IA
          </button>
        )}
        {tieneError && (
          <button
            onClick={reintentar}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        )}
        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            mostrarHistorial
              ? "bg-gray-700 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {mostrarHistorial ? "Ocultar historial" : "Historial de versiones"}
        </button>
      </div>

      {/* Panel de historial */}
      {mostrarHistorial && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">
            Historial de versiones
          </h2>
          <HistorialVersiones
            manuscritoId={manuscritoId}
            capituloId={capituloId}
            token={token}
            versionActual={capitulo.version_actual}
            onRestaurar={handleRestaurar}
          />
        </div>
      )}

      {/* Editor inline */}
      {editandoTexto && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Editar capítulo</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Título (opcional)</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del capítulo"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Texto</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={20}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-y font-mono leading-relaxed"
              placeholder="Texto del capítulo..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={guardarEdicion}
              disabled={guardando}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setEditandoTexto(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Vista previa del texto (cuando no está editando) */}
      {!editandoTexto && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <p className="text-xs text-gray-500 mb-4">Vista previa del texto</p>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-serif max-h-[500px] overflow-y-auto">
            {capitulo.texto_plano
              ? capitulo.texto_plano
              : <span className="text-gray-500 italic">Sin texto aún.</span>
            }
          </div>
        </div>
      )}
    </div>
  );
}
