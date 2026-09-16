export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TMDB_KEY = "84120436235fe71398e95a662f44db8b";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const LANG = {
  eng: "en", spa: "es", fre: "fr", fra: "fr", ger: "de", deu: "de",
  ita: "it", por: "pt", pob: "pt", ara: "ar", tur: "tr", rus: "ru",
  jpn: "ja", kor: "ko", chi: "zh", zho: "zh", cze: "cs", ces: "cs",
  dut: "nl", nld: "nl", pol: "pl", hun: "hu", rum: "ro", ron: "ro",
  gre: "el", ell: "el", hrv: "hr", srp: "sr", slv: "sl", swe: "sv",
  nor: "no", dan: "da", fin: "fi", ice: "is", heb: "he", per: "fa",
  hin: "hi", tha: "th", vie: "vi", ind: "id", ukr: "uk", bul: "bg",
  alb: "sq", slo: "sk", slk: "sk", lit: "lt", lav: "lv", est: "et",
  cat: "ca", baq: "eu", glg: "gl", mac: "mk", geo: "ka", arm: "hy",
};

function normLang(code) {
  const c = String(code || "").toLowerCase();
  if (LANG[c]) return LANG[c];
  if (c.length > 2) return c.slice(0, 2);
  return c || "und";
}

function bestByLang(tracks) {
  const by = new Map();
  for (const t of tracks) {
    if (!t?.url) continue;
    const lang = normLang(t.lang);
    const prev = by.get(lang);
    const score = Number(t.downloads || 0);
    if (!prev || score > Number(prev.downloads || 0)) {
      by.set(lang, { ...t, lang });
    }
  }
  return [...by.values()].sort((a, b) => {
    if (a.lang === "en") return -1;
    if (b.lang === "en") return 1;
    return a.lang.localeCompare(b.lang);
  });
}

async function imdbId(kind, id) {
  const res = await fetch(
    `https://api.themoviedb.org/3/${kind}/${id}/external_ids?api_key=${TMDB_KEY}`,
    { cache: "no-store" }
  );
  const data = await res.json();
  return data.imdb_id || null;
}

async function opensubtitlesRest(imdb, season, episode) {
  if (!imdb) return [];
  const num = String(imdb).replace(/^tt/i, "");
  let path = `https://rest.opensubtitles.org/search/imdbid-${num}`;
  if (season && episode) {
    path = `https://rest.opensubtitles.org/search/episode-${episode}/imdbid-${num}/season-${season}`;
  }
  const res = await fetch(path, {
    headers: { "X-User-Agent": "VLSub 0.10.2", "User-Agent": "VLSub 0.10.2" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => {
      let url = row.SubDownloadLink || row.SubtitlesLink || "";
      if (url) {
        url = url.replace("download/", "download/subencoding-utf8/").replace(/\.gz$/i, "");
      }
      return {
        label: row.LanguageName || row.SubLanguageID,
        lang: row.ISO639 || row.SubLanguageID,
        url,
        downloads: Number(row.SubDownloadsCnt || 0),
      };
    })
    .filter((t) => t.url);
}

async function wyzie(kind, id, season, episode) {
  const q = new URLSearchParams({ id: String(id), format: "srt,vtt" });
  if (kind === "tv" && season && episode) {
    q.set("season", String(season));
    q.set("episode", String(episode));
  }
  for (const host of ["https://sub.wyzie.io/search?", "https://subs.wyzie.ru/search?"]) {
    try {
      const res = await fetch(host + q.toString(), {
        headers: { "User-Agent": UA },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;
      return data
        .filter((r) => r?.url)
        .map((r) => ({
          label: r.display || r.language,
          lang: r.language,
          url: r.url,
          downloads: 0,
        }));
    } catch {
      /* next */
    }
  }
  return [];
}

async function stremio(imdb, kind, season, episode) {
  if (!imdb) return [];
  const type = kind === "tv" ? "series" : "movie";
  const sid = kind === "tv" ? `${imdb}:${season}:${episode}` : imdb;
  const urls = [
    `https://opensubtitles-v3.strem.io/subtitles/${type}/${sid}.json`,
    `https://embedsu.xyz/subtitles/${type}/${sid}.json`,
  ];
  const out = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const list = data.subtitles || data.streams || [];
      for (const r of list) {
        if (!r?.url) continue;
        out.push({
          label: r.lang || r.language || r.title,
          lang: r.lang || r.language,
          url: r.url,
          downloads: 0,
        });
      }
    } catch {
      /* next */
    }
  }
  return out;
}

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const kind = sp.get("kind") === "tv" ? "tv" : "movie";
  const id = sp.get("id");
  const season = sp.get("season");
  const episode = sp.get("episode");
  if (!id) return Response.json({ tracks: [] }, { status: 400 });

  const imdb = await imdbId(kind, id);
  const [os, wz, st] = await Promise.all([
    opensubtitlesRest(imdb, season, episode),
    wyzie(kind, id, season, episode),
    stremio(imdb, kind, season, episode),
  ]);
  const tracks = bestByLang([...os, ...wz, ...st]);
  return Response.json({ tracks, count: tracks.length });
}
