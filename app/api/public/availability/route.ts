import type { NextRequest } from "next/server";
import { getAvailableSlots } from "@/lib/booking";
import { corsHeaders, forbiddenOriginResponse, getAllowedOrigin } from "@/lib/embed";

export async function GET(request: NextRequest) {
  const origin = await getAllowedOrigin(request);
  if (!origin) return forbiddenOriginResponse();

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const slots = await getAvailableSlots(date);

  return Response.json({ slots }, { headers: corsHeaders(origin) });
}
