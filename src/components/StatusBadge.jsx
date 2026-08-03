import { useCopy } from '../lib/language.jsx'

/**
 * Status is carried by an icon shape and a word as well as colour, so it stays
 * legible to colourblind users and in high-contrast modes (CLAUDE.md, Visual
 * direction). The shapes differ from each other in silhouette, not just hue.
 */
const VARIANTS = {
  clear: {
    text: 'text-ruhig',
    surface: 'bg-ruhig-flaeche',
    icon: (
      <path d="M5 10.5l3.5 3.5L15 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  watching: {
    text: 'text-beobachtung',
    surface: 'bg-beobachtung-flaeche',
    icon: (
      <>
        <circle cx="10" cy="10" r="6.5" strokeWidth="2.5" />
        <circle cx="10" cy="10" r="1.75" fill="currentColor" stroke="none" />
      </>
    ),
  },
  affected: {
    text: 'text-betroffen',
    surface: 'bg-betroffen-flaeche',
    icon: (
      <>
        <path d="M10 5.5v5.5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
}

/**
 * `statusKey` selects the wording, `status` the visual treatment — an
 * unconfirmed clear result reads differently but should not look louder than
 * a confirmed one.
 */
export function StatusBadge({ status, statusKey, muted }) {
  const t = useCopy()
  const key = VARIANTS[status] ? status : 'clear'
  const variant = VARIANTS[key]
  const labelKey = t.status[statusKey] ? statusKey : key
  // A muted badge keeps its word and its icon — the finding has not changed —
  // and drops only the coloured surface that made it carry across the page.
  const label = t.status[labelKey].label
  const tone = muted ? 'bg-papier-tief text-tinte-weich' : `${variant.surface} ${variant.text}`

  // rounded-lg rather than a pill, and the label allowed to wrap: at a large
  // user text size "Lieferengpass gemeldet" is wider than the card it sits in,
  // and a pill that cannot wrap pushes the whole page sideways.
  //
  // shrink-0 so the flex row it sits in wraps the badge onto its own line
  // rather than squeezing it into a narrow column. Squeezed, it was breaking
  // its own words mid-syllable and stranding a single "g" on a line of its own.
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-2 rounded-lg px-3 py-1 text-base font-semibold ${tone}`}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        {variant.icon}
      </svg>
      <span className="min-w-0">{label}</span>
    </span>
  )
}
