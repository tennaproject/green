/// <reference types="bun" />

const root = import.meta.dir;

const server = Bun.serve({
  port: Number(Bun.env.PORT || 4173),
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const file = Bun.file(root + (pathname === "/" ? "/index.html" : pathname));

    return await file.exists()
      ? new Response(file)
      : new Response("Not found", { status: 404 });
  },
});

console.log(`Preview URL: ${server.url}`);
