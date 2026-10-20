"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LectorLayout({ children }: { children: React.ReactNode }) {
  const [tieneToken, setTieneToken] = useState(false);

  useEffect(() => {
    setTieneToken(!!localStorage.getItem("token"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar fija */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm flex items-center px-6">
        {/* Logo */}
        <Link href="/explorar" className="text-white font-bold text-lg tracking-tight mr-8 hover:text-violet-400 transition-colors">
          Inkverse
        </Link>

        {/* Links de navegación */}
        <div className="flex items-center gap-6 flex-1">
          <Link href="/explorar" className="text-gray-400 hover:text-white text-sm transition-colors">
            Explorar
          </Link>
          <Link href="/biblioteca" className="text-gray-400 hover:text-white text-sm transition-colors">
            Mi biblioteca
          </Link>
        </div>

        {/* Botón derecha */}
        <div>
          {tieneToken ? (
            <Link
              href="/dashboard"
              className="text-sm text-gray-300 hover:text-white border border-gray-700 rounded-lg px-4 py-1.5 transition-colors hover:border-gray-500"
            >
              Mi cuenta
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-1.5 transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>

      {/* Contenido con offset de navbar */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
}
