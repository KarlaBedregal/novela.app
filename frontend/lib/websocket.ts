const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export type ProgresoMessage = {
  task_id: string;
  estado: "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";
  progreso: number;
  mensaje: string;
  datos?: Record<string, unknown>;
  error?: boolean;
};

export function conectarProgresoWS(
  taskId: string,
  onMessage: (msg: ProgresoMessage) => void,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS_URL}/ws/progreso/${taskId}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ProgresoMessage;
      onMessage(data);
    } catch {
      // ignorar mensajes malformados
    }
  };

  ws.onclose = () => onClose?.();
  ws.onerror = (e) => console.error("WebSocket error:", e);

  return ws;
}
