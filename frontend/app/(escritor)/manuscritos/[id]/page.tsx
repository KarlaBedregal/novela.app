"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { obtenerManuscrito } from "@/lib/manuscritos";
import { listarCapitulos, crearCapitulo, procesarCapitulo, reintentarCapitulo } from "@/lib/capitulos";
import type { Manuscrito } from "@/types/manuscrito";
import type { Capitulo } from "@/types/capitulo";

const ESTADO_COLORS: Record<string, string> = {
  pendiente:   "bg-gray-700 text-gray-400",
  en_cola:     "bg-yellow-500/20 text-yellow-400",
  procesando:  "bg-blue-500/20 text-blue-400",
  completado:  "bg-green-500/20 text-green-400",
  error:       "bg-red-500/20 text-red-400",
};

export default function ManuscritoDetallePage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = Number(params.id);

  const [manuscrito,  setManuscrito]   = useState<Manuscrito | null>(null);
  const [capitulos,   setCapitulos]    = useState<Capitulo[]>([]);
  const [cargando,    setCargando]     = useState(true);
  const [modalOpen,   setModalOpen]    = useState(false);
  const [procesando,  setProcesando]   = useState<Set<number>>(new Set());
  const [pollsRestantes, setPollsRestantes] = useState(40); // 40 × 3 s = 2 min máx

  const cargarDatos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const [m, caps] = await Promise.all([
        obtenerManuscrito(id, token),
        listarCapitulos(id, token),
      ]);
      setManuscrito(m);
      setCapitulos(caps);
    } catch {
      router.push("/manuscritos");
    } finally {
      setCargando(false);
    }
  }, [id, router]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Polling: refresca cada 3 s mientras haya capítulos en proceso, máx 2 min
  useEffect(() => {
    const enProceso = capitulos.some(
      (c) => c.estado_procesamiento === "en_cola" || c.estado_procesamiento === "procesando"
    );
    if (!enProceso || pollsRestantes <= 0) return;
    const interval = setInterval(() => {
      cargarDatos();
      setPollsRestantes((n) => n - 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [capitulos, cargarDatos, pollsRestantes]);

  const handleProcesar = async (cap: Capitulo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setProcesando((prev) => new Set(prev).add(cap.id));
    setPollsRestantes(40);
    try {
      await procesarCapitulo(id, cap.id, token);
      await cargarDatos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al encolar procesamiento");
    } finally {
      setProcesando((prev) => { const s = new Set(prev); s.delete(cap.id); return s; });
    }
  };

  const handleReintentar = async (cap: Capitulo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setProcesando((prev) => new Set(prev).add(cap.id));
    try {
      await reintentarCapitulo(id, cap.id, token);
      setPollsRestantes(40);
      await cargarDatos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al reintentar");
    } finally {
      setProcesando((prev) => { const s = new Set(prev); s.delete(cap.id); return s; });
    }
  };

  const handleToggleAcceso = async (cap: Capitulo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/manuscritos/${id}/capitulos/${cap.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ acceso_libre: !cap.acceso_libre }),
        },
      );
      if (!res.ok) throw new Error();
      const updated: Capitulo = await res.json();
      setCapitulos((prev) => prev.map((c) => (c.id === cap.id ? updated : c)));
    } catch {
      alert("No se pudo cambiar el acceso del capítulo");
    }
  };

  const handleReprocesar = async (cap: Capitulo) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setProcesando((prev) => new Set(prev).add(cap.id));
    setPollsRestantes(40);
    try {
      await reintentarCapitulo(id, cap.id, token);  // reset a pendiente
      await procesarCapitulo(id, cap.id, token);     // encolar inmediatamente
      await cargarDatos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al reprocesar");
    } finally {
      setProcesando((prev) => { const s = new Set(prev); s.delete(cap.id); return s; });
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!manuscrito) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/manuscritos" className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Manuscritos
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-400 truncate max-w-xs">{manuscrito.titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            manuscrito.estado === "procesado" ? "bg-blue-500/20 text-blue-400" :
            "bg-gray-700 text-gray-400"
          }`}>
            {manuscrito.estado}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{manuscrito.titulo}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            {manuscrito.genero && <span>{manuscrito.genero}</span>}
            {manuscrito.nivel_contenido && (
              <span className="capitalize">{manuscrito.nivel_contenido}</span>
            )}
            <span>
              {new Date(manuscrito.created_at).toLocaleDateString("es-ES", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
          {manuscrito.sinopsis && (
            <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{manuscrito.sinopsis}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Capítulos
            {capitulos.length > 0 && (
              <span className="ml-2 text-sm text-gray-600 font-normal">({capitulos.length})</span>
            )}
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition-colors"
          >
            + Agregar capítulo
          </button>
        </div>

        {capitulos.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-2xl p-12 text-center">
            <p className="text-gray-600 mb-2">Aún no hay capítulos.</p>
            <p className="text-gray-700 text-sm">Agrega el primer capítulo para comenzar el análisis.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {capitulos.map((cap) => (
              <div
                key={cap.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <span className="text-gray-600 text-sm w-8 shrink-0 text-center font-mono">
                  {String(cap.numero).padStart(2, "0")}
                </span>
                <Link
                  href={`/manuscritos/${id}/capitulos/${cap.id}`}
                  className="flex-1 min-w-0 hover:text-violet-300 transition-colors"
                >
                  <p className="text-white font-medium truncate group-hover:text-violet-300">
                    {cap.titulo || `Capítulo ${cap.numero}`}
                  </p>
                  {cap.total_palabras != null && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {cap.total_palabras.toLocaleString("es-ES")} palabras
                    </p>
                  )}
                </Link>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  ESTADO_COLORS[cap.estado_procesamiento] ?? "bg-gray-700 text-gray-400"
                }`}>
                  {cap.estado_procesamiento.replace("_", " ")}
                </span>
                <button
                  onClick={() => handleToggleAcceso(cap)}
                  title={cap.acceso_libre ? "Publicado — click para despublicar" : "No publicado — click para publicar"}
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    cap.acceso_libre
                      ? "bg-green-900/50 text-green-400 border border-green-800 hover:bg-green-900"
                      : "bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300"
                  }`}
                >
                  {cap.acceso_libre ? "Publicado" : "Privado"}
                </button>
                {cap.estado_procesamiento === "pendiente" ? (
                  <button
                    onClick={() => handleProcesar(cap)}
                    disabled={procesando.has(cap.id)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {procesando.has(cap.id) ? "..." : "Procesar"}
                  </button>
                ) : cap.estado_procesamiento === "completado" ? (
                  <button
                    onClick={() => handleReprocesar(cap)}
                    disabled={procesando.has(cap.id)}
                    title="Volver a analizar este capítulo"
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {procesando.has(cap.id) ? "..." : "↺"}
                  </button>
                ) : cap.estado_procesamiento === "error" || (cap.estado_procesamiento === "procesando" && pollsRestantes <= 0) ? (
                  <button
                    onClick={() => handleReintentar(cap)}
                    disabled={procesando.has(cap.id)}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {procesando.has(cap.id) ? "..." : "Reintentar"}
                  </button>
                ) : cap.estado_procesamiento === "en_cola" || cap.estado_procesamiento === "procesando" ? (
                  <div className="shrink-0 w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {capitulos.some((c) => c.estado_procesamiento === "completado") && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/manuscritos/${id}/grafo`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Ver grafo de personajes
            </Link>
            <Link
              href={`/manuscritos/${id}/canon`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-700/50 rounded-xl text-sm font-semibold text-amber-300 transition-colors"
            >
              Revisar sugerencias de la IA
            </Link>
          </div>
        )}
      </div>

      {modalOpen && (
        <NuevoCapituloModal
          manuscritoId={id}
          siguienteNumero={capitulos.length + 1}
          onClose={() => setModalOpen(false)}
          onCreado={() => { setModalOpen(false); cargarDatos(); }}
        />
      )}
    </main>
  );
}

function NuevoCapituloModal({
  manuscritoId,
  siguienteNumero,
  onClose,
  onCreado,
}: {
  manuscritoId: number;
  siguienteNumero: number;
  onClose: () => void;
  onCreado: () => void;
}) {
  const [tab, setTab] = useState<"escribir" | "importar">("escribir");

  // Tab "Escribir"
  const [form, setForm] = useState({ titulo: "", texto: "" });
  const [errorEscribir, setErrorEscribir] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Tab "Importar"
  const [archivo, setArchivo] = useState<File | null>(null);
  const [autoSplit, setAutoSplit] = useState(true);
  const [importando, setImportando] = useState(false);
  const [errorImportar, setErrorImportar] = useState("");
  const [resultadoImportar, setResultadoImportar] = useState<string>("");

  const handleSubmitEscribir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.texto.trim()) { setErrorEscribir("El texto es obligatorio."); return; }
    setErrorEscribir("");
    setGuardando(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await crearCapitulo(manuscritoId, {
        numero: siguienteNumero,
        titulo: form.titulo || undefined,
        texto:  form.texto,
      }, token);
      onCreado();
    } catch (err: unknown) {
      setErrorEscribir(err instanceof Error ? err.message : "Error al crear capítulo");
      setGuardando(false);
    }
  };

  const handleImportar = async () => {
    if (!archivo) { setErrorImportar("Selecciona un archivo."); return; }
    setErrorImportar("");
    setResultadoImportar("");
    setImportando(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("auto_split", String(autoSplit));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiUrl}/manuscritos/${manuscritoId}/capitulos/importar`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setResultadoImportar(`Se importaron ${data.total} capítulo${data.total !== 1 ? "s" : ""} correctamente.`);
      setTimeout(() => { onCreado(); }, 1200);
    } catch (err: unknown) {
      setErrorImportar(err instanceof Error ? err.message : "Error al importar");
      setImportando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Agregar capítulo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-6">
          <button
            type="button"
            onClick={() => setTab("escribir")}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === "escribir"
                ? "border-violet-500 text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Escribir
          </button>
          <button
            type="button"
            onClick={() => setTab("importar")}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === "importar"
                ? "border-violet-500 text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Importar archivo
          </button>
        </div>

        {/* Tab: Escribir */}
        {tab === "escribir" && (
          <form onSubmit={handleSubmitEscribir} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Título <span className="text-gray-600">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
                  placeholder="Ej: La llegada"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Texto del capítulo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.texto}
                  onChange={(e) => setForm({ ...form, texto: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none text-sm leading-relaxed"
                  rows={14}
                  placeholder="Pega aquí el texto de tu capítulo..."
                  required
                />
                {form.texto && (
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    {form.texto.trim().split(/\s+/).length.toLocaleString("es-ES")} palabras
                  </p>
                )}
              </div>
            </div>

            {errorEscribir && (
              <div className="px-6 pb-2">
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {errorEscribir}
                </p>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-700 hover:border-gray-500 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {guardando ? "Guardando..." : "Guardar capítulo"}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Importar archivo */}
        {tab === "importar" && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Archivo
                </label>
                <input
                  type="file"
                  accept=".txt,.docx,.pdf,.odt,.epub,.rtf"
                  onChange={(e) => {
                    setArchivo(e.target.files?.[0] ?? null);
                    setErrorImportar("");
                    setResultadoImportar("");
                  }}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-600 file:text-white hover:file:bg-violet-500 file:cursor-pointer cursor-pointer"
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  Formatos soportados: .txt, .docx, .pdf, .odt, .epub, .rtf
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="auto-split"
                  type="checkbox"
                  checked={autoSplit}
                  onChange={(e) => setAutoSplit(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                />
                <label htmlFor="auto-split" className="text-sm text-gray-300 cursor-pointer select-none">
                  Detectar capítulos automáticamente
                </label>
              </div>

              {autoSplit && (
                <p className="text-xs text-gray-600 bg-gray-800/50 rounded-xl px-4 py-3 leading-relaxed">
                  Se buscará&apos;n patrones como &quot;Capítulo N&quot;, &quot;Chapter N&quot;, &quot;Parte N&quot;
                  o separadores (—, ***, ====) para dividir el documento en múltiples capítulos.
                </p>
              )}

              {resultadoImportar && (
                <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
                  {resultadoImportar}
                </p>
              )}

              {errorImportar && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  {errorImportar}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-700 hover:border-gray-500 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportar}
                disabled={importando || !archivo}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {importando ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
