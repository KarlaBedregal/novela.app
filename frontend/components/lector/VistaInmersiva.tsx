"use client";
import { useState, useEffect } from "react";

interface TemaVisual {
  fondo:        string;
  texto:        string;
  fuente:       string;
  acento:       string;
  nombre:       string;
}

const TEMAS: Record<string, TemaVisual> = {
  romance: {
    nombre: "Romance",
    fondo:   "#1a0a0f",
    texto:   "#f5e6d3",
    fuente:  "'Georgia', serif",
    acento:  "#c2185b",
  },
  fantasia: {
    nombre: "Fantasía",
    fondo:   "#0d1117",
    texto:   "#d1d5db",
    fuente:  "'Palatino Linotype', serif",
    acento:  "#7c3aed",
  },
  thriller: {
    nombre: "Thriller",
    fondo:   "#0a0a0a",
    texto:   "#e5e7eb",
    fuente:  "'Arial', sans-serif",
    acento:  "#dc2626",
  },
  clasico: {
    nombre: "Clásico",
    fondo:   "#fdf6e3",
    texto:   "#2d2d2d",
    fuente:  "'Times New Roman', serif",
    acento:  "#8b4513",
  },
};

interface Props {
  texto:        string;
  titulo?:      string;
  genero?:      string;
  temaOverride?: string;
  onProgreso?: (parrafo: number) => void;
}

export function VistaInmersiva({ texto, titulo, genero, temaOverride, onProgreso }: Props) {
  const [temaKey, setTemaKey] = useState(temaOverride ?? genero ?? "clasico");
  const tema = TEMAS[temaKey] ?? TEMAS.clasico;

  const parrafos = texto.split(/\n+/).filter(Boolean);

  return (
    <div
      className="min-h-screen transition-colors duration-700"
      style={{ backgroundColor: tema.fondo, color: tema.texto, fontFamily: tema.fuente }}
    >
      {/* Selector de tema */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        {Object.entries(TEMAS).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setTemaKey(key)}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: t.fondo,
              borderColor: temaKey === key ? t.acento : "transparent",
            }}
            title={t.nombre}
          />
        ))}
      </div>

      {/* Contenido */}
      <article className="max-w-[65ch] mx-auto px-6 py-16">
        {titulo && (
          <h1
            className="text-3xl font-bold mb-12 text-center"
            style={{ color: tema.acento }}
          >
            {titulo}
          </h1>
        )}

        <div className="space-y-6 leading-relaxed text-lg">
          {parrafos.map((parrafo, i) => (
            <p
              key={i}
              className="text-justify"
              data-parrafo={i}
              onMouseEnter={() => onProgreso?.(i)}
            >
              {parrafo}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
