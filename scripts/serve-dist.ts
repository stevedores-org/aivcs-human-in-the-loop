// Local-only static server for testing the Vite build without Caddy installed.
// Production OCI images use Caddy (see Caddyfile) — same pattern as inertsynergies.com.

const port = Number(process.env.PORT ?? 3000);
const distRoot = new URL("../dist/", import.meta.url);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

function contentType(pathname: string): string | undefined {
  const dot = pathname.lastIndexOf(".");
  if (dot === -1) return undefined;
  return MIME[pathname.slice(dot)];
}

function isAssetPath(pathname: string): boolean {
  return pathname.startsWith("/assets/") || /\.[a-z0-9]+$/i.test(pathname);
}

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

    if (!(await file.exists())) {
      if (isAssetPath(url.pathname)) {
        return new Response("Not Found", { status: 404 });
      }
      file = Bun.file(resolvePath("/index.html"));
      if (!(await file.exists())) {
        return new Response("Not Found", { status: 404 });
      }
    }

    const type = contentType(url.pathname) ?? contentType("/index.html");
    return new Response(file, type ? { headers: { "Content-Type": type } } : undefined);
  },
});

console.log(`aivcs-human-in-the-loop (local) listening on :${port}`);
