"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listarManuscritos } from "@/lib/manuscritos";
import type { Manuscrito } from "@/types/manuscrito";

export default function ManuscritosPage() {
  const router = useRouter();
  const [manuscritos, setManuscritos] = useState<Manuscrito[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    listarManuscritos(token)
      .then(setManuscritos)
      .catch(() => router.push("/login"))
      .finally(() => setCargando(false));
  }, [router]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mis manuscritos</h1>
        <Link
          href="/manuscritos/nuevo"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-colors"
        >
          + Nuevo
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {manuscritos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-6">Aún no tienes manuscritos.</p>
            <Link
              href="/manuscritos/nuevo"
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
            >
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manuscritos.map((m) => (
              <Link key={m.id} href={`/manuscritos/${m.id}`}>
                <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.estado === "publicado" ? "bg-green-500/20 text-green-400" :
                      m.estado === "procesado" ? "bg-blue-500/20 text-blue-400" :
                      "bg-gray-700 text-gray-400"
                    }`}>
                      {m.estado}
                    </span>
                    {m.genero && <span className="text-xs text-gray-600">{m.genero}</span>}
                  </div>
                  <h2 className="font-semibold text-white mb-2 line-clamp-2">{m.titulo}</h2>
                  {m.sinopsis && (
                    <p className="text-sm text-gray-500 line-clamp-3">{m.sinopsis}</p>
                  )}
                  <p className="text-xs text-gray-700 mt-4">
                    {new Date(m.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
