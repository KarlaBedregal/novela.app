"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PerfilForm {
  nombre: string;
  bio: string;
  avatar_url: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ConfiguracionPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Perfil
  const [perfil, setPerfil] = useState<PerfilForm>({ nombre: "", bio: "", avatar_url: "" });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  // Password
  const [pwActual, setPwActual] = useState("");
  const [pwNuevo, setPwNuevo] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [guardandoPw, setGuardandoPw] = useState(false);
  const [exitoPw, setExitoPw] = useState(false);
  const [errorPw, setErrorPw] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("No autorizado");
        return r.json();
      })
      .then((u) => {
        setPerfil({
          nombre: u.nombre ?? "",
          bio: u.bio ?? "",
          avatar_url: u.avatar_url ?? "",
        });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setGuardandoPerfil(true);
    setErrorPerfil(null);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: perfil.nombre || undefined,
          bio: perfil.bio || undefined,
          avatar_url: perfil.avatar_url || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Error al guardar");
      }
      setExito(true);
      setTimeout(() => setExito(false), 2000);
    } catch (err: unknown) {
      setErrorPerfil(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErrorPw(null);

    if (pwNuevo !== pwConfirm) {
      setErrorPw("Las contraseñas nuevas no coinciden");
      return;
    }
    if (pwNuevo.length < 8) {
      setErrorPw("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    setGuardandoPw(true);
    try {
      const res = await fetch(`${API}/auth/cambiar-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_actual: pwActual,
          password_nuevo: pwNuevo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Error al cambiar contraseña");
      }
      setExitoPw(true);
      setPwActual("");
      setPwNuevo("");
      setPwConfirm("");
      setTimeout(() => setExitoPw(false), 2000);
    } catch (err: unknown) {
      setErrorPw(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardandoPw(false);
    }
  }

  if (!token) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-violet-400">novela.app</span>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Mi dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold">Configuración de cuenta</h1>

        {/* Sección 1: Perfil público */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Perfil público</h2>
          <form onSubmit={guardarPerfil} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre</label>
              <input
                type="text"
                value={perfil.nombre}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Tu nombre de autor"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Bio{" "}
                <span className="text-gray-600">
                  ({perfil.bio.length}/500)
                </span>
              </label>
              <textarea
                value={perfil.bio}
                onChange={(e) =>
                  setPerfil({ ...perfil, bio: e.target.value.slice(0, 500) })
                }
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                placeholder="Cuéntanos algo sobre ti..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                URL de avatar{" "}
                <span className="text-gray-600">(opcional)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={perfil.avatar_url}
                  onChange={(e) =>
                    setPerfil({ ...perfil, avatar_url: e.target.value })
                  }
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="https://example.com/avatar.jpg"
                />
                {perfil.avatar_url && (
                  <img
                    src={perfil.avatar_url}
                    alt="Avatar preview"
                    className="w-10 h-10 rounded-full object-cover border border-gray-700 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>

            {errorPerfil && (
              <p className="text-red-400 text-sm">{errorPerfil}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={guardandoPerfil}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition-colors"
              >
                {guardandoPerfil ? "Guardando..." : "Guardar perfil"}
              </button>
              {exito && (
                <span className="text-green-400 text-sm">Guardado ✓</span>
              )}
            </div>
          </form>
        </section>

        {/* Sección 2: Seguridad */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">Seguridad</h2>
          <form onSubmit={cambiarPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                value={pwActual}
                onChange={(e) => setPwActual(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={pwNuevo}
                onChange={(e) => setPwNuevo(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Repetir contraseña"
              />
            </div>

            {errorPw && (
              <p className="text-red-400 text-sm">{errorPw}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={guardandoPw}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition-colors"
              >
                {guardandoPw ? "Cambiando..." : "Cambiar contraseña"}
              </button>
              {exitoPw && (
                <span className="text-green-400 text-sm">Contraseña actualizada ✓</span>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
