"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Version {
  id: number;
  numero_version: number;
  total_palabras: number | null;
  created_at: string | null;
  tiene_texto: boolean;
  nota: string | null;
}

interface Props {
  manuscritoId: number;
  capituloId: number;
  token: string | null;
  versionActual: number;
  onRestaurar?: () => void;
}

export function HistorialVersiones({
  manuscritoId,
  capituloId,
  token,
  versionActual,
  onRestaurar,
}: Props) {
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [cargando, setCargando] = useState(true);
  const [restaurando, setRestaurando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    if (!token) return;
    setCargando(true);
    api
      .get<Version[]>(
        `/manuscritos/${manuscritoId}/capitulos/${capituloId}/versiones`,
        token,
      )
      .then(setVersiones)
      .catch(() => setError("No se pudo cargar el historial"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, [manuscritoId, capituloId, token]); // eslint-disable-line

  const restaurar = async (numeroVersion: number) => {
    if (
      !token ||
      !confirm(
        `¿Restaurar a la versión ${numeroVersion}?\nLa versión actual se guardará automáticamente antes de restaurar.`,
      )
    )
      return;
    setRestaurando(numeroVersion);
    setError(null);
    try {
      await api.post(
        `/manuscritos/${manuscritoId}/capitulos/${capituloId}/versiones/${numeroVersion}/restaurar`,
        {},
        token,
      );
      cargar();
      onRestaurar?.();
    } catch {
      setError("Error al restaurar la versión");
    } finally {
      setRestaurando(null);
    }
  };

  if (cargando)
    return <p className="text-gray-500 text-sm py-2">Cargando historial...</p>;

  if (error)
    return <p className="text-red-400 text-sm py-2">{error}</p>;

  if (versiones.length === 0)
    return (
      <p className="text-gray-500 text-sm py-2">
        Sin versiones guardadas aún. Las versiones se crean al editar y guardar el capítulo.
      </p>
    );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">
        Versión actual:{" "}
        <span className="text-violet-400 font-medium">v{versionActual}</span>
      </p>
      {versiones.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="text-sm font-medium text-gray-200">
              v{v.numero_version}
            </span>
            {v.total_palabras != null && (
              <span className="text-xs text-gray-500">
                {v.total_palabras.toLocaleString()} palabras
              </span>
            )}
            {v.created_at && (
              <span className="text-xs text-gray-600">
                {new Date(v.created_at).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {v.nota && (
              <span className="text-xs text-amber-400/80 italic truncate max-w-[200px]">
                {v.nota}
              </span>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            {v.tiene_texto ? (
              <button
                onClick={() => restaurar(v.numero_version)}
                disabled={restaurando === v.numero_version}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
              >
                {restaurando === v.numero_version ? "Restaurando..." : "Restaurar"}
              </button>
            ) : (
              <span className="text-xs text-gray-600">Sin texto</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
