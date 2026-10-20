"use client";
import { useState } from "react";
import { api } from "@/lib/api";

interface Props {
  manuscritoId: number;
  token: string;
  onAplicada?: () => void;
  onCerrar: () => void;
}

interface CorreccionResponse {
  resultado: "aplicada" | "no_encontrada" | "contradiccion" | "pendiente";
  mensaje: string;
  cambios?: Array<{ fragmento?: string }>;
}

const RESULTADO_CONFIG = {
  aplicada:      { color: "text-green-400",  bg: "bg-green-900/30 border-green-700/50",  icon: "✓" },
  no_encontrada: { color: "text-amber-400",  bg: "bg-amber-900/30 border-amber-700/50",  icon: "?" },
  contradiccion: { color: "text-red-400",    bg: "bg-red-900/30 border-red-700/50",      icon: "!" },
  pendiente:     { color: "text-violet-400", bg: "bg-violet-900/30 border-violet-700/50", icon: "…" },
};

export function CorreccionModal({ manuscritoId, token, onAplicada, onCerrar }: Props) {
  const [instruccion,    setInstruccion]    = useState("");
  const [capReferencia,  setCapReferencia]  = useState<string>("");
  const [cargando,       setCargando]       = useState(false);
  const [respuesta,      setRespuesta]      = useState<CorreccionResponse | null>(null);
  const [error,          setError]          = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruccion.trim()) return;
    setCargando(true);
    setError("");
    setRespuesta(null);
    try {
      const body: Record<string, unknown> = {
        manuscrito_id: manuscritoId,
        descripcion:   instruccion.trim(),
      };
      if (capReferencia) body.capitulo_referencia = parseInt(capReferencia);

      const res = await api.post<CorreccionResponse>(
        `/grafo/${manuscritoId}/correccion`,
        body,
        token,
      );
      setRespuesta(res);
      if (res.resultado === "aplicada") onAplicada?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar corrección");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white">Corregir el canon</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Describe un hecho de tu novela y la IA lo verificará en el texto
            </p>
          </div>
          <button onClick={onCerrar} className="text-gray-500 hover:text-white transition-colors text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <textarea
              value={instruccion}
              onChange={(e) => setInstruccion(e.target.value)}
              placeholder={`Ej: "Elena y Rodrigo son hermanos"\n"El castillo está en el norte, no en el sur"\n"Darian traicionó a Seraphine en el capítulo 3"`}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Capítulo de referencia (opcional)</label>
              <input
                type="number"
                min={1}
                value={capReferencia}
                onChange={(e) => setCapReferencia(e.target.value)}
                placeholder="Ej: 3"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={cargando || !instruccion.trim()}
              className="mt-5 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {cargando ? "Verificando..." : "Verificar"}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {respuesta && (() => {
            const cfg = RESULTADO_CONFIG[respuesta.resultado];
            return (
              <div className={`rounded-xl p-4 border ${cfg.bg}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-lg font-bold ${cfg.color}`}>{cfg.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${cfg.color}`}>
                      {respuesta.resultado === "aplicada"      && "Corrección aplicada"}
                      {respuesta.resultado === "no_encontrada" && "No encontrado en el texto"}
                      {respuesta.resultado === "contradiccion" && "Posible contradicción detectada"}
                      {respuesta.resultado === "pendiente"     && "Pendiente de revisión"}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">{respuesta.mensaje}</p>
                    {respuesta.cambios?.[0]?.fragmento && (
                      <div className="mt-2 bg-gray-800/60 rounded-lg p-2 border-l-2 border-amber-600">
                        <p className="text-gray-400 text-xs italic">
                          "...{respuesta.cambios[0].fragmento.slice(0, 200)}..."
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </form>
      </div>
    </div>
  );
}
