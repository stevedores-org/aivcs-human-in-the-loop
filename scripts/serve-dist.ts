// Production static file server for the Vite-built SPA.
// Used as the OCI container entrypoint (see dockworker.toml). Avoids pulling
// vite preview (needs build-time config + node_modules) into the runtime image.

const port = Number(process.env.PORT ?? 3000);
const distRoot = new URL("../dist/", import.meta.url);

function resolvePath(pathname: string): URL {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  return new URL(`.${normalized}`, distRoot);
}

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    let file = Bun.file(resolvePath(url.pathname));
    if (!(await file.exists()) && !url.pathname.includes(".")) {
      file = Bun.file(resolvePath("/index.html"));
    }
    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(file);
  },
});

console.log(`aivcs-human-in-the-loop listening on :${port}`);
