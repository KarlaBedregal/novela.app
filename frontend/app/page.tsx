import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Tu novela, entendida.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Escribe con una IA que recuerda cada personaje, cada relación y cada
          giro de tu historia. Tus lectores la viven en una experiencia inmersiva.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/registro"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
          >
            Empieza a escribir →
          </Link>
          <Link
            href="/explorar"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
          >
            Explorar novelas
          </Link>
        </div>
      </section>

      {/* Propuesta de valor escritor */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon="🧠"
          titulo="Grafo de tu universo"
          desc="La IA extrae automáticamente personajes, lugares y relaciones de tus capítulos."
        />
        <FeatureCard
          icon="🔍"
          titulo="Tú decides el canon"
          desc="Revisa cada sugerencia. La IA propone, tú confirmas. Nunca pierde el control."
        />
        <FeatureCard
          icon="📖"
          titulo="Lectores inmersivos"
          desc="Tus lectores ven el grafo revelarse mientras leen, sin spoilers."
        />
      </section>
    </main>
  );
}

function FeatureCard({ icon, titulo, desc }: { icon: string; titulo: string; desc: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-2">{titulo}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
