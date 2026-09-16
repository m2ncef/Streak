export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function proxyUrl(abs) {
  return `/api/hls-proxy?url=${encodeURIComponent(abs)}`;
}

function rewriteUri(raw, base) {
  try {
    return proxyUrl(new URL(raw, base).href);
  } catch {
    return raw;
  }
}

function rewritePlaylist(text, sourceUrl) {
  const base = new URL(sourceUrl);
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line) return line;
      if (line.startsWith("#")) {
        return line.replace(/URI=("([^"]+)"|'([^']+)'|([^,\s]+))/g, (full, _a, d, s, u) => {
          const val = d || s || u;
          const q = d != null ? '"' : s != null ? "'" : "";
          return `URI=${q}${rewriteUri(val, base)}${q}`;
        });
      }
      return rewriteUri(line, base);
    })
    .join("\n");
}

function parseRange(header, size) {
  if (!header) return null;
  const m = /bytes=(\d+)-(\d*)/i.exec(header);
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : size - 1;
  if (!Number.isFinite(start) || start < 0 || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

function sniffMime(buf, ct) {
  if (buf[0] === 0x47) return "video/mp2t";
  const box = buf.length > 8 ? buf.subarray(4, 8).toString("ascii") : "";
  if (box === "ftyp" || box === "moof" || box === "sidx" || box === "styp") {
    return "video/mp4";
  }
  if (buf.length === 16) return "application/octet-stream";
  if (ct && !ct.includes("text/html") && !ct.includes("application/json")) return ct;
  return "application/octet-stream";
}

async function fetchUpstream(url, extra = {}) {
  const referers = [
    extra.referer,
    "https://cloudorchestranova.com/",
    "https://vidsrcme.ru/",
    `${new URL(url).origin}/`,
  ].filter(Boolean);

  let last = null;
  const seen = new Set();
  for (const referer of referers) {
    if (seen.has(referer)) continue;
    seen.add(referer);
    const headers = {
      "User-Agent": UA,
      Referer: referer,
      Origin: referer.replace(/\/$/, ""),
      Accept: "*/*",
    };
    if (extra.range) headers.Range = extra.range;
    last = await fetch(url, {
      headers,
      redirect: "follow",
      cache: "no-store",
    });
    if (last.ok || last.status === 206) return last;
  }
  return last;
}

export async function GET(request) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Invalid protocol", { status: 400 });
  }

  const rangeHeader = request.headers.get("range");
  const upstream = await fetchUpstream(parsed.href, {
    referer: request.nextUrl.searchParams.get("referer"),
    range: rangeHeader || undefined,
  });

  if (!upstream || (!upstream.ok && upstream.status !== 206)) {
    return new Response(`Upstream ${upstream?.status || 502}`, {
      status: upstream?.status || 502,
    });
  }

  const ct = (upstream.headers.get("content-type") || "").toLowerCase();
  const buf = Buffer.from(await upstream.arrayBuffer());
  const peek = buf.subarray(0, 16).toString("utf8");
  const isPlaylist = peek.startsWith("#EXTM3U");
  const isVtt = peek.startsWith("WEBVTT") || parsed.pathname.endsWith(".vtt");
  const isSrt = parsed.pathname.endsWith(".srt");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
  };

  if (isPlaylist) {
    headers["Content-Type"] = "application/vnd.apple.mpegurl";
    return new Response(rewritePlaylist(buf.toString("utf8"), parsed.href), {
      headers,
    });
  }

  if (isVtt || isSrt) {
    headers["Content-Type"] = isSrt ? "application/x-subrip" : "text/vtt; charset=utf-8";
    return new Response(buf.toString("utf8"), { headers });
  }

  const mime = sniffMime(buf, ct);
  headers["Content-Type"] = mime;

  const range = parseRange(rangeHeader, buf.length);
  if (range && upstream.status !== 206) {
    const slice = buf.subarray(range.start, range.end + 1);
    headers["Content-Range"] = `bytes ${range.start}-${range.start + slice.length - 1}/${buf.length}`;
    headers["Content-Length"] = String(slice.length);
    return new Response(slice, { status: 206, headers });
  }

  if (upstream.status === 206) {
    const cr = upstream.headers.get("content-range");
    if (cr) headers["Content-Range"] = cr;
    headers["Content-Length"] = String(buf.length);
    return new Response(buf, { status: 206, headers });
  }

  headers["Content-Length"] = String(buf.length);
  return new Response(buf, { headers });
}
