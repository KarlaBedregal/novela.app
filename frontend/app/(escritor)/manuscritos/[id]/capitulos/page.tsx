"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CapitulosRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/manuscritos/${id}`);
  }, [id, router]);

  return null;
}
