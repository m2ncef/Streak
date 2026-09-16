const MAX_BYTES = 500_000

export async function GET(request) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return Response.json({ error: 'Missing url' }, { status: 400 })
  }

  let target
  try {
    target = new URL(url)
  } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return Response.json({ error: 'Only http(s) module URLs are allowed' }, { status: 400 })
  }

  const res = await fetch(target.href, {
    headers: { Accept: 'text/javascript, application/javascript, text/plain, */*' },
    cache: 'no-store',
    redirect: 'follow',
  })

  if (!res.ok) {
    return Response.json({ error: `Fetch failed (${res.status})` }, { status: 502 })
  }

  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_BYTES) {
    return Response.json({ error: 'Module file is too large' }, { status: 413 })
  }

  const code = new TextDecoder().decode(buf)
  return new Response(code, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
