"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VistaInmersiva } from "@/components/lector/VistaInmersiva";
import { api } from "@/lib/api";

interface CapituloData {
  texto:   string;
  titulo?: string;
  numero:  number;
}

type ErrorEstado = "no_encontrado" | "requiere_login" | "pago" | "generico";

export default function LeerCapituloPage() {
  const { id, capId } = useParams<{ id: string; capId: string }>();
  const capNumero = parseInt(capId);

  const [capitulo, setCapitulo] = useState<CapituloData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorTipo, setErrorTipo] = useState<ErrorEstado | null>(null);
  const hayPrev = capNumero > 1;

  useEffect(() => {
    setCargando(true);
    setErrorTipo(null);
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    api.get<CapituloData>(
      `/lector/novela/${id}/capitulo/${capId}`,
      t ?? undefined,
    )
      .then((data) => {
        setCapitulo(data);
      })
      .catch((err: unknown) => {
        setCapitulo(null);
        const status = err instanceof Error && "status" in err
          ? (err as { status: number }).status
          : undefined;
        if (status === 401) {
          setErrorTipo("requiere_login");
        } else if (status === 402) {
          setErrorTipo("pago");
        } else if (status === 404) {
          setErrorTipo("no_encontrado");
        } else {
          setErrorTipo("generico");
        }
      })
      .finally(() => setCargando(false));
  }, [id, capId]);

  // Guardar progreso en localStorage cuando se carga el capítulo
  useEffect(() => {
    if (capitulo && typeof window !== "undefined") {
      localStorage.setItem(
        `lector_progreso_${id}`,
        JSON.stringify({ capitulo: capNumero, ts: Date.now() }),
      );
    }
  }, [capitulo, id, capNumero]);

  const handleProgreso = (parrafo: number) => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (t) {
      api.post(
        "/lector/progreso",
        {
          manuscrito_id:         parseInt(id),
          ultimo_capitulo_leido: capNumero,
          ultimo_parrafo_leido:  parrafo,
        },
        t,
      ).catch(() => {});
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!capitulo) {
    const mensajes: Record<ErrorEstado, { texto: string; accion?: React.ReactNode }> = {
      requiere_login: {
        texto: "Inicia sesión para leer este capítulo.",
        accion: (
          <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm underline">
            Iniciar sesión
          </Link>
        ),
      },
      pago: {
        texto: "Este capítulo es de pago.",
      },
      no_encontrado: {
        texto: "Capítulo no encontrado.",
      },
      generico: {
        texto: "No se pudo cargar el capítulo.",
      },
    };

    const estado = errorTipo ? mensajes[errorTipo] : mensajes.generico;

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-4">
        <p className="text-gray-400 text-lg">{estado.texto}</p>
        {estado.accion}
        <Link href={`/novela/${id}`} className="text-violet-400 hover:text-violet-300 text-sm">
          ← Volver a la portada
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Barra superior fija */}
      <div className="fixed top-14 left-0 right-0 z-40 h-10 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link
          href={`/novela/${id}`}
          className="text-gray-400 hover:text-white text-xs transition-colors shrink-0"
        >
          ← Portada
        </Link>

        <div className="flex-1 text-center">
          <span className="text-gray-300 text-xs truncate">
            Cap. {capNumero}{capitulo.titulo ? ` — ${capitulo.titulo}` : ""}
          </span>
        </div>

        <Link
          href={`/novela/${id}/grafo?capitulo=${capNumero}`}
          className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1 rounded-full transition-colors shrink-0"
        >
          Grafo
        </Link>
      </div>

      {/* Vista inmersiva con offset para la barra extra */}
      <div className="pt-10">
        <VistaInmersiva
          texto={capitulo.texto}
          titulo={capitulo.titulo}
          onProgreso={handleProgreso}
        />
      </div>

      {/* Navegación prev/next */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          {hayPrev ? (
            <Link
              href={`/novela/${id}/leer/${capNumero - 1}`}
              className="flex items-center gap-2 bg-gray-900/90 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              ← Cap. {capNumero - 1}
            </Link>
          ) : (
            <span />
          )}
        </div>

        <div className="pointer-events-auto">
          <Link
            href={`/novela/${id}/leer/${capNumero + 1}`}
            className="flex items-center gap-2 bg-gray-900/90 border border-gray-700 hover:border-violet-700 text-gray-300 hover:text-violet-300 text-sm px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
            onClick={() => {
              // Si el siguiente capítulo no existe, la página mostrará "no encontrado"
            }}
          >
            Cap. {capNumero + 1} →
          </Link>
        </div>
      </div>
    </div>
  );
}
