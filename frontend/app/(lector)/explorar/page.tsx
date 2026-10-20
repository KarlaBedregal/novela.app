"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface ManuscritoPublico {
  id: number;
  titulo: string;
  sinopsis: string | null;
  genero: string | null;
  nivel_contenido: string;
  capitulos_gratis?: number;
}

const COLORES_GENERO: Record<string, string> = {
  romance:   "bg-pink-900/60 text-pink-300 border border-pink-800",
  fantasia:  "bg-violet-900/60 text-violet-300 border border-violet-800",
  thriller:  "bg-red-900/60 text-red-300 border border-red-800",
  misterio:  "bg-blue-900/60 text-blue-300 border border-blue-800",
  scifi:     "bg-cyan-900/60 text-cyan-300 border border-cyan-800",
  aventura:  "bg-amber-900/60 text-amber-300 border border-amber-800",
};

function GeneroChip({ genero }: { genero: string | null }) {
  if (!genero) return null;
  const clase = COLORES_GENERO[genero] ?? "bg-gray-800 text-gray-300 border border-gray-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clase}`}>
      {genero.charAt(0).toUpperCase() + genero.slice(1)}
    </span>
  );
}

export default function ExplorarPage() {
  const [novelas, setNovelas] = useState<ManuscritoPublico[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<ManuscritoPublico[]>("/lector/explorar")
      .then(setNovelas)
      .catch(() => setNovelas([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Explorar novelas</h1>
        <p className="text-gray-400 mb-8">Descubre historias publicadas por la comunidad</p>

        {cargando && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && novelas.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No hay novelas publicadas aún</p>
            <p className="text-gray-700 text-sm mt-2">Vuelve pronto — los escritores están trabajando.</p>
          </div>
        )}

        {!cargando && novelas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {novelas.map((novela) => (
              <Link
                key={novela.id}
                href={`/novela/${novela.id}`}
                className="group block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-white font-semibold text-base group-hover:text-violet-300 transition-colors line-clamp-2 flex-1">
                    {novela.titulo}
                  </h2>
                  <GeneroChip genero={novela.genero} />
                </div>

                {/* Sinopsis */}
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4">
                  {novela.sinopsis
                    ? novela.sinopsis.slice(0, 120) + (novela.sinopsis.length > 120 ? "…" : "")
                    : "Sin sinopsis disponible."}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  {novela.nivel_contenido && novela.nivel_contenido !== "general" && (
                    <span className="text-xs text-amber-500 bg-amber-950/50 border border-amber-900 px-2 py-0.5 rounded-full">
                      {novela.nivel_contenido}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">Ver novela →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
