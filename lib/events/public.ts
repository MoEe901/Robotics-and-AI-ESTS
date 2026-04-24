/** Google Maps search for a place name (opens exact search results). */
export function googleMapsSearchUrl(placeName: string): string {
  const q = placeName.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Prefer stored Maps URL; otherwise search by venue label. */
export function eventLocationHref(location?: string, mapsUrl?: string): string | null {
  const u = mapsUrl?.trim();
  if (u) {
    try {
      new URL(u);
      return u;
    } catch {
      /* fall through */
    }
  }
  const label = location?.trim();
  if (!label) return null;
  return googleMapsSearchUrl(label);
}

export function youtubeEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}
