"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearManuscrito } from "@/lib/manuscritos";

const GENEROS = ["romance", "fantasia", "thriller", "ciencia ficcion", "drama", "misterio", "historica", "otro"];

export default function NuevoManuscritoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: "",
    genero: "",
    nivel_contenido: "general",
    sinopsis: "",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const m = await crearManuscrito(
        { ...form, genero: form.genero || undefined, sinopsis: form.sinopsis || undefined },
        token
      );
      router.push(`/manuscritos/${m.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear manuscrito");
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
          ← Volver
        </Link>
        <h1 className="text-lg font-semibold">Nuevo manuscrito</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Título *</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
              placeholder="El nombre de tu novela"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Género</label>
            <select
              value={form.genero}
              onChange={(e) => setForm({ ...form, genero: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Sin especificar</option>
              {GENEROS.map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Nivel de contenido</label>
            <div className="flex gap-3">
              {(["general", "maduro", "adulto"] as const).map((nivel) => (
                <button
                  key={nivel}
                  type="button"
                  onClick={() => setForm({ ...form, nivel_contenido: nivel })}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    form.nivel_contenido === nivel
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Sinopsis <span className="text-gray-600">(opcional)</span></label>
            <textarea
              rows={4}
              value={form.sinopsis}
              onChange={(e) => setForm({ ...form, sinopsis: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
              placeholder="De qué trata tu historia..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {cargando ? "Creando..." : "Crear manuscrito"}
          </button>
        </form>
      </div>
    </main>
  );
}
