// Vérifie l'image de partage de chaque URL du sitemap : og:image présent, HTTP 200, PNG, 1200×630, poids < 300 Ko.
// Usage : node scripts/og/check-og.mjs [https://llamakusi.com]
const base = (process.argv[2] || "https://llamakusi.com").replace(/\/$/, "");
const MAX = 300 * 1024;
const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let bad = 0;
for (const url of urls) {
  const html = await (await fetch(url)).text();
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)?.[1];
  let err = "";
  if (!og) err = "pas d'og:image";
  else {
    const r = await fetch(new URL(og, base));
    const buf = Buffer.from(await r.arrayBuffer());
    const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (r.status !== 200) err = `HTTP ${r.status}`;
    else if (!(r.headers.get("content-type") || "").includes("image/png")) err = `type ${r.headers.get("content-type")}`;
    else if (w !== 1200 || h !== 630) err = `taille ${w}×${h}`;
    else if (buf.length > MAX) err = `${Math.round(buf.length / 1024)} Ko (> 300 Ko)`;
  }
  if (err) bad++;
  console.log(err ? "KO " : "OK ", url, err);
}
console.log(`\n${urls.length - bad}/${urls.length} OK`);
process.exit(bad ? 1 : 0);
