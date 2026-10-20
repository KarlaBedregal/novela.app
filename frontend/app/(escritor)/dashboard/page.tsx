"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { listarManuscritos } from "@/lib/manuscritos";
import { api } from "@/lib/api";
import type { Manuscrito } from "@/types/manuscrito";

interface NovelaPublica {
  id: number;
  titulo: string;
  sinopsis: string | null;
  genero: string | null;
}

const COLORES_GENERO: Record<string, string> = {
  romance:  "text-pink-400",
  fantasia: "text-violet-400",
  thriller: "text-red-400",
  misterio: "text-blue-400",
  scifi:    "text-cyan-400",
  aventura: "text-amber-400",
};

export default function Dashboard() {
  const router = useRouter();
  const { usuario, token, cargando, logout } = useAuth();
  const [manuscritos,  setManuscritos]  = useState<Manuscrito[]>([]);
  const [novelas,      setNovelas]      = useState<NovelaPublica[]>([]);
  const [cargandoMs,   setCargandoMs]   = useState(true);

  useEffect(() => {
    if (!cargando && !token) { router.push("/login"); }
  }, [cargando, token, router]);

  useEffect(() => {
    if (!token) return;
    listarManuscritos(token)
      .then(setManuscritos)
      .finally(() => setCargandoMs(false));
  }, [token]);

  useEffect(() => {
    api.get<NovelaPublica[]>("/lector/explorar")
      .then((data) => setNovelas(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-violet-400">novela.app</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{usuario.nombre}</span>
          <Link href="/configuracion" className="text-sm text-gray-500 hover:text-white transition-colors">
            ⚙ Configuración
          </Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition-colors">
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Hola, {usuario.nombre}</h1>
          <p className="text-gray-500 text-sm">¿Qué quieres hacer hoy?</p>
        </div>

        {/* Accesos rápidos de lector */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leer</h2>
            <Link href="/explorar" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Ver todo →
            </Link>
          </div>

          {/* Accesos directos */}
          <div className="flex gap-3 mb-5">
            <Link
              href="/explorar"
              className="flex-1 bg-gray-900 border border-gray-800 hover:border-violet-700 rounded-xl px-5 py-4 transition-colors group"
            >
              <p className="text-violet-400 text-xl mb-1">📚</p>
              <p className="font-semibold text-sm">Explorar novelas</p>
              <p className="text-gray-500 text-xs mt-0.5">Descubre historias de la comunidad</p>
            </Link>
            <Link
              href="/biblioteca"
              className="flex-1 bg-gray-900 border border-gray-800 hover:border-violet-700 rounded-xl px-5 py-4 transition-colors group"
            >
              <p className="text-violet-400 text-xl mb-1">🔖</p>
              <p className="font-semibold text-sm">Mi biblioteca</p>
              <p className="text-gray-500 text-xs mt-0.5">Continúa donde lo dejaste</p>
            </Link>
          </div>

          {/* Novedades del catálogo */}
          {novelas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {novelas.map((n) => (
                <Link
                  key={n.id}
                  href={`/novela/${n.id}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-colors"
                >
                  {n.genero && (
                    <p className={`text-xs font-medium mb-1 ${COLORES_GENERO[n.genero] ?? "text-gray-500"}`}>
                      {n.genero.charAt(0).toUpperCase() + n.genero.slice(1)}
                    </p>
                  )}
                  <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">
                    {n.titulo}
                  </p>
                  {n.sinopsis && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {n.sinopsis}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sección escritor */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Mis manuscritos</h2>
            <Link
              href="/manuscritos/nuevo"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-sm transition-colors"
            >
              + Nuevo
            </Link>
          </div>

          {cargandoMs ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : manuscritos.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded-2xl p-10 text-center">
              <p className="text-gray-500 mb-1">Aún no tienes manuscritos.</p>
              <p className="text-gray-700 text-sm mb-5">Crea tu primera novela y empieza a escribir.</p>
              <Link
                href="/manuscritos/nuevo"
                className="inline-block px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-sm transition-colors"
              >
                Crear el primero
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manuscritos.map((m) => (
                <Link key={m.id} href={`/manuscritos/${m.id}`}>
                  <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 transition-colors cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
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
        </section>

      </div>
    </main>
  );
}
