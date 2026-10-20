"use client";
import { useEffect, useState } from "react";
import { useProcesamientoWS } from "@/hooks/useProcesamientoWS";

interface Props {
  taskId: string | null;
  onCompletado?: (datos: Record<string, unknown>) => void;
}

export function ProcesamientoProgress({ taskId, onCompletado }: Props) {
  const { progreso, completado } = useProcesamientoWS(taskId);
  const [visible, setVisible] = useState(true);

  // Mantener visible 5s tras completar, luego llamar onCompletado
  useEffect(() => {
    if (!completado) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onCompletado?.(progreso?.datos ?? {});
    }, 5000);
    return () => clearTimeout(timer);
  }, [completado]); // eslint-disable-line

  if (!taskId || !visible) return null;

  const pct     = progreso?.progreso ?? 0;
  const datos   = progreso?.datos ?? {};
  const esRepro = datos.tipo === "reproceso";

  const resumenTexto = (() => {
    if (!completado) return null;
    if (esRepro) {
      const rel  = Number(datos.relaciones_nuevas ?? 0);
      const eli  = Number(datos.aristas_eliminadas ?? 0);
      return `Re-procesado — ${rel} relación${rel !== 1 ? "es" : ""} actualizada${rel !== 1 ? "s" : ""}, ${eli} arista${eli !== 1 ? "s" : ""} eliminada${eli !== 1 ? "s" : ""}`;
    }
    const nodos = Number(datos.nodos_nuevos ?? 0);
    const rel   = Number(datos.relaciones_nuevas ?? 0);
    return `Procesado — ${nodos} personaje${nodos !== 1 ? "s" : ""} nuevo${nodos !== 1 ? "s" : ""}, ${rel} relación${rel !== 1 ? "es" : ""}`;
  })();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-300 text-sm font-medium">
          {progreso?.mensaje ?? "Procesando capítulo..."}
        </p>
        <span className="text-gray-400 text-sm">{pct}%</span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${completado ? "bg-green-500" : "bg-violet-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {completado && resumenTexto && (
        <p className="mt-3 text-sm text-green-400">{resumenTexto}</p>
      )}

      {!completado && datos.alertas_contradiccion !== undefined && Number(datos.alertas_contradiccion) > 0 && (
        <span className="mt-2 block text-sm text-red-400">
          ⚠ {Number(datos.alertas_contradiccion)} contradicción(es)
        </span>
      )}
    </div>
  );
}
