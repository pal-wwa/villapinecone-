// Cloudflare Pages Function: /img/* isteklerini R2 bucket'indan servis eder.
// Neden: Turk operatorler r2.dev alan adini engelliyor; site alan adi uzerinden
// servis edince engel asilir + Cloudflare cache devreye girer.
// Gereksinim: Pages projesinde R2 binding — degisken adi: IMG, bucket: villa-pinecone

export async function onRequestGet({ params, env, request }) {
  const key = decodeURIComponent(Array.isArray(params.path) ? params.path.join("/") : params.path);
  if (!env.IMG) return new Response("R2 binding eksik (IMG)", { status: 500 });

  // Cloudflare edge cache — ayni fotograf ikinci kez R2'ye gitmez
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const obj = await env.IMG.get(key);
  if (!obj) return new Response("Bulunamadi: " + key, { status: 404 });

  const res = new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": obj.httpEtag,
    },
  });
  await cache.put(request, res.clone());
  return res;
}