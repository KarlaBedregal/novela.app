import { NextRequest, NextResponse } from "next/server";

// Reenvía el webhook de Stripe al backend FastAPI
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagos/stripe/webhook`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": sig },
    body,
  });

  return NextResponse.json(await res.json(), { status: res.status });
}
