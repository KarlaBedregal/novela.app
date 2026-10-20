"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

interface EntradaBiblioteca {
  manuscrito_id: number;
  titulo: string;
  genero: string | null;
  ultimo_capitulo_leido: number | null;
  total_capitulos: number;
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
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clase}`}>
      {genero.charAt(0).toUpperCase() + genero.slice(1)}
    </span>
  );
}

function BarraProgreso({ actual, total }: { actual: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Capítulo {actual} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BibliotecaPage() {
  const [token, setToken] = useState<string | null>(null);
  const [biblioteca, setBiblioteca] = useState<EntradaBiblioteca[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setCargando(false);
      return;
    }

    api.get<EntradaBiblioteca[]>("/lector/mi-biblioteca", t)
      .then(setBiblioteca)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          setToken(null); // token inválido, tratar como no autenticado
        } else {
          setError(e instanceof Error ? e.message : "Error al cargar la biblioteca");
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Sin sesión
  if (!cargando && !token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">Tu biblioteca está vacía aquí</p>
          <p className="text-gray-400 text-sm mb-6">Inicia sesión para ver tu biblioteca de lectura</p>
          <Link
            href="/login"
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // Cargando
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Mi biblioteca</h1>
        <p className="text-gray-400 mb-8">Novelas que estás leyendo</p>

        {biblioteca.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
            <p className="text-gray-500 text-base mb-3">No has comenzado ninguna novela todavía</p>
            <Link
              href="/explorar"
              className="text-violet-400 hover:text-violet-300 text-sm underline underline-offset-4"
            >
              Explorar novelas →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {biblioteca.map((entrada) => {
              const capActual = entrada.ultimo_capitulo_leido ?? 1;
              return (
                <div
                  key={entrada.manuscrito_id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GeneroChip genero={entrada.genero} />
                      </div>
                      <h2 className="text-white font-semibold text-lg leading-snug mb-1 truncate">
                        {entrada.titulo}
                      </h2>
                      <BarraProgreso actual={capActual} total={entrada.total_capitulos} />
                    </div>
                    <Link
                      href={`/novela/${entrada.manuscrito_id}/leer/${capActual}`}
                      className="shrink-0 mt-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
