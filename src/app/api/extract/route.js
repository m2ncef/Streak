import { extractFromQuery } from "../../../../vidsrc-scraper/extract.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request) {
  const q = request.nextUrl.searchParams;
  const type = q.get("type") || "movie";
  const tmdb_id = q.get("tmdb_id");
  const season = q.get("season") ? parseInt(q.get("season"), 10) : undefined;
  const episode = q.get("episode") ? parseInt(q.get("episode"), 10) : undefined;
  const first = q.get("first") === "1" || q.get("first") === "true";

  try {
    const { status, body } = await extractFromQuery({
      type,
      tmdb_id,
      season,
      episode,
      first,
    });
    return Response.json(body, { status });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message || "Unexpected server error", results: {} },
      { status: 500 }
    );
  }
}
