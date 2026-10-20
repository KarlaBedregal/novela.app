import type { EstadoCanon } from "@/types/grafo";
import { ESTADO_COLORES, ESTADO_LABELS } from "@/types/grafo";

interface Props {
  estado: EstadoCanon;
  size?: "sm" | "md";
}

export function EstadoBadge({ estado, size = "md" }: Props) {
  const color  = ESTADO_COLORES[estado];
  const label  = ESTADO_LABELS[estado];
  const px     = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${px}`}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
}
