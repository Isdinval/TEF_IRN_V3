import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";

// Verifie le statut HTTP d'une liste d'URLs externes citees dans les guides (liens sources,
// references officielles...). Doit tourner cote serveur : la plupart des sites externes ne
// renvoient pas d'en-tetes CORS permettant un fetch direct depuis le navigateur de l'admin.
// Le client (GuidesLinkRotView) envoie les URLs par lots (chunks) plutot qu'en une seule requete,
// pour rester sous la limite de duree d'une fonction Vercel - voir maxDuration ci-dessous.

export const maxDuration = 20;

const MAX_URLS_PER_REQUEST = 20;
const PER_URL_TIMEOUT_MS = 7000;

interface LinkCheckResult {
  url: string;
  ok: boolean;
  status: number | null;
  error: string | null;
}

async function checkUrl(url: string): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PER_URL_TIMEOUT_MS);
  try {
    // HEAD d'abord (plus leger) ; certains serveurs le refusent (405/501) sans que le lien soit
    // casse pour autant - on retente alors en GET avant de conclure.
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { url, ok: res.status < 400, status: res.status, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur réseau";
    return { url, ok: false, status: null, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const urls: unknown = body?.urls;
  if (!Array.isArray(urls) || urls.some((u) => typeof u !== "string")) {
    return NextResponse.json({ error: "Paramètre 'urls' invalide (tableau de chaînes attendu)." }, { status: 400 });
  }
  if (urls.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (urls.length > MAX_URLS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Trop d'URLs en une requête (max ${MAX_URLS_PER_REQUEST}) - le client doit découper par lots.` },
      { status: 400 }
    );
  }

  const results = await Promise.all((urls as string[]).map(checkUrl));
  return NextResponse.json({ results });
}
