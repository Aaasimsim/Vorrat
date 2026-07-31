import { buildShortageIndex } from '../src/lib/pipeline.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'

const FEED_URL = 'https://anwendungen.pharmnet-bund.de/lieferengpassmeldungen/public/csv'

// The CSV has no CORS headers, so the browser cannot fetch it directly. This
// function is the only thing that talks to BfArM; the client pulls the JSON
// below and matches locally, so medication lists never leave the device.
export default async function handler(request, response) {
  try {
    const upstream = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'Vorrat/1.0 (+https://github.com/) Lieferengpass-Frühwarnung' },
    })

    if (!upstream.ok) {
      throw new Error(`BfArM responded ${upstream.status}`)
    }

    const raw = Buffer.from(await upstream.arrayBuffer())
    const index = buildShortageIndex(raw)

    // The baseline is rebuilt from the current feed on every run. It therefore
    // only ever knows manufacturers who have had at least one shortage report,
    // which is why matching.js requires a minimum sample before trusting it as
    // a market denominator. Persisting it across runs would sharpen the signal
    // and is the obvious next step once there is somewhere to put it.
    const baseline = mergeBaseline(emptyBaseline(), index.records)

    // Cached at the edge for 6h, and served stale for a day while revalidating —
    // a shortage report that is a few hours old is still useful; a failed fetch
    // that blanks the list is not.
    response.setHeader(
      'Cache-Control',
      'public, s-maxage=21600, stale-while-revalidate=86400',
    )
    response.setHeader('Content-Type', 'application/json; charset=utf-8')

    return response.status(200).json({ ...index, baseline })
  } catch (error) {
    return response.status(502).json({
      error: 'upstream_unavailable',
      message: String(error.message ?? error),
    })
  }
}
