"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface CapituloItem {
  id: number;
  numero: number;
  titulo: string | null;
  total_palabras: number | null;
  acceso_libre: boolean;
}

interface NovelaDetalle {
  id: number;
  titulo: string;
  sinopsis: string | null;
  genero: string | null;
  nivel_contenido: string;
  autor_nombre: string;
  autor_id: number;
  total_capitulos: number;
  capitulos: CapituloItem[];
}

interface ProgresoLocal {
  capitulo: number;
  ts: number;
}

const COLORES_GENERO: Record<string, string> = {
  romance:  "bg-pink-900/60 text-pink-300 border border-pink-800",
  fantasia: "bg-violet-900/60 text-violet-300 border border-violet-800",
  thriller: "bg-red-900/60 text-red-300 border border-red-800",
  misterio: "bg-blue-900/60 text-blue-300 border border-blue-800",
  scifi:    "bg-cyan-900/60 text-cyan-300 border border-cyan-800",
  aventura: "bg-amber-900/60 text-amber-300 border border-amber-800",
};

function GeneroChip({ genero }: { genero: string | null }) {
  if (!genero) return null;
  const clase = COLORES_GENERO[genero] ?? "bg-gray-800 text-gray-300 border border-gray-700";
  return (
    <span className={`text-sm px-3 py-1 rounded-full font-medium ${clase}`}>
      {genero.charAt(0).toUpperCase() + genero.slice(1)}
    </span>
  );
}

export default function NovelaPage() {
  const { id } = useParams<{ id: string }>();
  const [novela, setNovela] = useState<NovelaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<ProgresoLocal | null>(null);

  useEffect(() => {
    // Cargar datos de la novela
    api.get<NovelaDetalle>(`/lector/novela/${id}`)
      .then(setNovela)
      .catch((e) => setError(e.message ?? "Error al cargar la novela"))
      .finally(() => setCargando(false));

    // Cargar progreso local
    const raw = localStorage.getItem(`lector_progreso_${id}`);
    if (raw) {
      try {
        setProgreso(JSON.parse(raw) as ProgresoLocal);
      } catch {
        // ignorar JSON inválido
      }
    }
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !novela) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error ?? "Novela no encontrada"}</p>
          <Link href="/explorar" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const totalPalabras = novela.capitulos.reduce(
    (acc, c) => acc + (c.total_palabras ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <Link href="/explorar" className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block transition-colors">
          ← Explorar
        </Link>

        {/* Cabecera */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <GeneroChip genero={novela.genero} />
            {novela.nivel_contenido !== "general" && (
              <span className="text-xs text-amber-500 bg-amber-950/50 border border-amber-900 px-2 py-1 rounded-full">
                {novela.nivel_contenido}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-2 leading-tight">{novela.titulo}</h1>
          <p className="text-gray-400 text-sm mb-4">
            por{" "}
            <Link href={`/autor/${novela.autor_id}`} className="text-violet-400 hover:underline font-medium">
              {novela.autor_nombre}
            </Link>
          </p>

          {/* Métricas */}
          <div className="flex gap-6 text-sm text-gray-400 mb-6">
            <span>{novela.total_capitulos} capítulos</span>
            {totalPalabras > 0 && (
              <span>~{totalPalabras.toLocaleString("es")} palabras</span>
            )}
          </div>

          {/* Sinopsis */}
          {novela.sinopsis && (
            <p className="text-gray-300 leading-relaxed text-base border-l-2 border-gray-700 pl-4">
              {novela.sinopsis}
            </p>
          )}
        </div>

        {/* Continuar leyendo */}
        {progreso && (
          <div className="mb-8 bg-violet-950/40 border border-violet-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-violet-300 text-sm font-medium">Continuar leyendo</p>
              <p className="text-white font-semibold">Capítulo {progreso.capitulo}</p>
            </div>
            <Link
              href={`/novela/${id}/leer/${progreso.capitulo}`}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors shrink-0"
            >
              Continuar →
            </Link>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 mb-8">
          {novela.capitulos.length > 0 && !progreso && (
            <Link
              href={`/novela/${id}/leer/${novela.capitulos[0].numero}`}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Comenzar a leer
            </Link>
          )}
          <Link
            href={`/novela/${id}/grafo`}
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Ver grafo de personajes
          </Link>
        </div>

        {/* Lista de capítulos */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Capítulos disponibles
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({novela.capitulos.length} gratis de {novela.total_capitulos})
            </span>
          </h2>

          {novela.capitulos.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay capítulos disponibles aún.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {novela.capitulos.map((cap) => (
                <div
                  key={cap.id}
                  className="flex items-center justify-between py-4 gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <span className="text-gray-500 text-sm tabular-nums">Cap. {cap.numero}</span>
                      {cap.acceso_libre && (
                        <span className="text-xs text-green-400 bg-green-950/50 border border-green-900 px-2 py-0.5 rounded-full">
                          Gratis
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium truncate">
                      {cap.titulo ?? `Capítulo ${cap.numero}`}
                    </p>
                    {cap.total_palabras != null && (
                      <p className="text-gray-600 text-xs mt-0.5">{cap.total_palabras.toLocaleString("es")} palabras</p>
                    )}
                  </div>
                  <Link
                    href={`/novela/${id}/leer/${cap.numero}`}
                    className="shrink-0 text-sm text-violet-400 hover:text-violet-300 border border-gray-700 hover:border-violet-700 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Leer
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
