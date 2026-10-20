"use client";
import { useParams } from "next/navigation";
import { CanonPanel } from "@/components/escritor/CanonPanel";

export default function CanonPage() {
  const { id } = useParams<{ id: string }>();
  const token  = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Revisión del canon</h1>
        <p className="text-gray-400 mt-1">
          La IA extrajo estas entidades y relaciones de tu texto.
          Confirma las correctas, corrige las erróneas.
        </p>
      </div>
      <CanonPanel manuscritoId={parseInt(id)} token={token} />
    </div>
  );
}
