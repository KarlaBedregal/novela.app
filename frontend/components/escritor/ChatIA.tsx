"use client";
import { useState, useRef, useEffect } from "react";
import { api, ApiError } from "@/lib/api";

interface Mensaje {
  rol: "usuario" | "asistente";
  texto: string;
}

interface Props {
  manuscritoId: number;
  token: string;
  onCerrar: () => void;
}

export function ChatIA({ manuscritoId, token, onCerrar }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: "asistente",
      texto: "Hola, soy tu asistente de escritura. Puedes preguntarme sobre los personajes, relaciones o cualquier aspecto del universo de tu novela.",
    },
  ]);
  const [input, setInput]     = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const enviar = async () => {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;

    setInput("");
    setMensajes(prev => [...prev, { rol: "usuario", texto: pregunta }]);
    setCargando(true);

    try {
      const res = await api.post<{ respuesta: string }>(
        "/ia/preguntar",
        { manuscrito_id: manuscritoId, pregunta, modo: "escritor" },
        token,
      );
      setMensajes(prev => [...prev, { rol: "asistente", texto: res.respuesta }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error de conexión";
      setMensajes(prev => [...prev, { rol: "asistente", texto: `Error: ${msg}` }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-sm font-semibold text-white">Asistente IA</span>
        </div>
        <button
          onClick={onCerrar}
          className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
          aria-label="Cerrar chat"
        >
          ×
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.rol === "usuario"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-gray-800 text-gray-100 rounded-bl-sm"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {cargando && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-700 bg-gray-900/80">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tu universo narrativo..."
            rows={1}
            className="flex-1 resize-none bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors max-h-28 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            disabled={cargando}
          />
          <button
            onClick={enviar}
            disabled={cargando || !input.trim()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors"
            aria-label="Enviar"
          >
            <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>
    </div>
  );
}
