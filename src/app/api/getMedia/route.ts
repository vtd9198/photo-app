import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storageId = searchParams.get("storageId");
  if (!storageId) return new Response("Missing storageId", { status: 400 });

  // Redirect to the actual Convex storage URL
  return Response.redirect(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`);
}
