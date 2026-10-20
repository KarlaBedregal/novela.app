import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotasFlotantes } from "@/components/NotasFlotantes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovelaApp",   // cambiar cuando se decida el nombre
  description: "Escribe y lee novelas con inteligencia artificial integrada",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        {children}
        <NotasFlotantes />
      </body>
    </html>
  );
}
