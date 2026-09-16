export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function proxyUrl(abs) {
  return `/api/hls-proxy?url=${encodeURIComponent(abs)}`;
}

function rewritePlaylist(text, sourceUrl) {
  const base = new URL(sourceUrl);
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line) return line;
      if (line.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_, u) => {
          try {
            return `URI="${proxyUrl(new URL(u, base).href)}"`;
          } catch {
            return `URI="${u}"`;
          }
        });
      }
      try {
        return proxyUrl(new URL(line, base).href);
      } catch {
        return line;
      }
    })
    .join("\n");
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
      Accept: "*/*",
    };
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

  const upstream = await fetchUpstream(parsed.href, {
    referer: request.nextUrl.searchParams.get("referer"),
  });

  if (!upstream || (!upstream.ok && upstream.status !== 206)) {
    return new Response(`Upstream ${upstream?.status || 502}`, {
      status: upstream?.status || 502,
    });
  }

  const ct = (upstream.headers.get("content-type") || "").toLowerCase();
  const buf = Buffer.from(await upstream.arrayBuffer());
  const peek = buf.subarray(0, 16).toString("utf8");
  const isPlaylist =
    peek.startsWith("#EXTM3U") ||
    ct.includes("mpegurl") ||
    ct.includes("m3u8") ||
    parsed.pathname.includes(".m3u8") ||
    /master\.m3u8/i.test(parsed.href);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };

  if (isPlaylist) {
    headers["Content-Type"] = "application/vnd.apple.mpegurl";
    return new Response(rewritePlaylist(buf.toString("utf8"), parsed.href), {
      headers,
    });
  }

  let mime = ct && !ct.includes("text/html") ? ct : "application/octet-stream";
  if (buf[0] === 0x47) mime = "video/mp2t";
  else if (buf.length > 8 && buf.subarray(4, 8).toString("ascii") === "ftyp") {
    mime = "video/mp4";
  }
  headers["Content-Type"] = mime;
  return new Response(buf, { headers });
}
