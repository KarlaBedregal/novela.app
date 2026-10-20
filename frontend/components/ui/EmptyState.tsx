export function EmptyState({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-300 font-medium text-lg">{titulo}</p>
      {descripcion && <p className="text-gray-500 text-sm mt-1">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
