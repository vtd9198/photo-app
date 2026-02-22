import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    path: "/getMedia",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const { searchParams } = new URL(request.url);
        const storageId = searchParams.get("storageId");
        if (!storageId) {
            return new Response("Missing storageId", { status: 400 });
        }

        const blob = await ctx.storage.get(storageId as any);
        if (!blob) {
            return new Response("Media not found", { status: 404 });
        }

        const metadata = await ctx.storage.getMetadata(storageId as any);

        return new Response(blob, {
            headers: {
                "Content-Type": metadata?.contentType ?? "application/octet-stream",
                "Cross-Origin-Resource-Policy": "cross-origin",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    }),
});

export default http;
