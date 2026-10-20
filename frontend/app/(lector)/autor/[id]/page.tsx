"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface NovelaResumen {
  id: number;
  titulo: string;
  genero: string | null;
  sinopsis: string | null;
}

interface PerfilAutor {
  id: number;
  nombre: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  novelas: NovelaResumen[];
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

function Iniciales({ nombre }: { nombre: string }) {
  const partes = nombre.trim().split(/\s+/);
  const iniciales = partes.length >= 2
    ? partes[0][0] + partes[partes.length - 1][0]
    : nombre.slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-violet-800 flex items-center justify-center text-white text-2xl font-bold select-none">
      {iniciales.toUpperCase()}
    </div>
  );
}

export default function AutorPage() {
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilAutor | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PerfilAutor>(`/auth/perfil/${id}`)
      .then(setPerfil)
      .catch((e) => setError(e.message ?? "Error al cargar el perfil"))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error ?? "Autor no encontrado"}</p>
          <Link href="/explorar" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const anioRegistro = new Date(perfil.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <Link
          href="/explorar"
          className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block transition-colors"
        >
          ← Explorar
        </Link>

        {/* Cabecera del autor */}
        <div className="flex items-start gap-6 mb-8">
          {perfil.avatar_url ? (
            <img
              src={perfil.avatar_url}
              alt={perfil.nombre}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="shrink-0">
              <Iniciales nombre={perfil.nombre} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{perfil.nombre}</h1>
            <p className="text-gray-500 text-sm mb-3">Escritor desde {anioRegistro}</p>
            {perfil.bio && (
              <p className="text-gray-300 leading-relaxed text-sm max-w-xl">{perfil.bio}</p>
            )}
          </div>
        </div>

        {/* Novelas publicadas */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Novelas publicadas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({perfil.novelas.length})
            </span>
          </h2>

          {perfil.novelas.length === 0 ? (
            <p className="text-gray-500 text-sm py-6">
              Este autor no tiene novelas publicadas aún.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {perfil.novelas.map((novela) => (
                <Link
                  key={novela.id}
                  href={`/novela/${novela.id}`}
                  className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-base leading-snug">
                      {novela.titulo}
                    </h3>
                    <GeneroChip genero={novela.genero} />
                  </div>
                  {novela.sinopsis && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {novela.sinopsis}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
