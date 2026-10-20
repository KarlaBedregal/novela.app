"use client";
import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ProgresoMessage = {
  task_id: string;
  estado: "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";
  progreso: number;
  mensaje: string;
  datos?: Record<string, unknown>;
  error?: boolean;
};

export function useProcesamientoWS(taskId: string | null) {
  const [progreso, setProgreso] = useState<ProgresoMessage | null>(null);
  const [completado, setCompletado] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/tareas/${taskId}`);
        if (!res.ok) return;
        const data: ProgresoMessage = await res.json();
        setProgreso(data);
        if (data.estado === "SUCCESS" || data.estado === "FAILURE") {
          setCompletado(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // ignorar errores de red temporales
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [taskId]);

  return { progreso, completado };
}
