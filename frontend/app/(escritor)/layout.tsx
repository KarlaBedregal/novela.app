export default function EscritorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* TODO: barra lateral del escritor */}
      <main>{children}</main>
    </div>
  );
}
