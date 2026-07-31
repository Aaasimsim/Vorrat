import { useEffect, useState } from 'react'
import { loadCachedFeed, saveCachedFeed } from './storage.js'

/**
 * Fetches the public shortage index. Falls back to the last cached copy when
 * the network or BfArM is unavailable — a day-old list is far more useful to
 * someone checking their medication than an error screen, as long as the UI
 * says which it is showing.
 */
export function useShortageFeed() {
  const [state, setState] = useState({ status: 'loading', feed: null, stale: false })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/shortages')
        if (!response.ok) throw new Error(`status ${response.status}`)
        const feed = await response.json()
        if (cancelled) return
        saveCachedFeed(feed)
        setState({ status: 'ready', feed, stale: false })
      } catch {
        if (cancelled) return
        const cached = loadCachedFeed()
        setState(
          cached
            ? { status: 'ready', feed: cached, stale: true }
            : { status: 'error', feed: null, stale: false },
        )
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
