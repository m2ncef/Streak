import { gunzipSync } from "zlib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function srtToVtt(raw) {
  let text = String(raw || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  if (text.startsWith("WEBVTT")) return text;
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${text}\n`;
}

function looksLikeSubs(text) {
  return (
    text.startsWith("WEBVTT") ||
    /\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/.test(text)
  );
}

export async function GET(request) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) return new Response("Missing url", { status: 400 });

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Invalid protocol", { status: 400 });
  }

  const upstream = await fetch(parsed.href, {
    headers: {
      "User-Agent": UA,
      Accept: "text/vtt, text/plain, application/x-subrip, */*",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
  }

  let buf = Buffer.from(await upstream.arrayBuffer());
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    try {
      buf = gunzipSync(buf);
    } catch {
      return new Response("Could not unzip subtitle", { status: 415 });
    }
  }
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    return new Response("Zip subtitles are not supported", { status: 415 });
  }

  let text = buf.toString("utf8");
  if (!looksLikeSubs(text)) {
    try {
      text = buf.toString("latin1");
    } catch {
      /* keep utf8 */
    }
  }
  if (!looksLikeSubs(text)) {
    return new Response("Not a subtitle file", { status: 415 });
  }

  const vtt = srtToVtt(text);
  return new Response(vtt, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
