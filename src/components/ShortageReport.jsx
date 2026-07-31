import { useCopy } from '../lib/language.jsx'
import { formatGermanDate } from '../lib/format.js'

/**
 * One BfArM report, rendered. Every clinical-adjacent line here is either a
 * field copied from the record or a question to ask a professional — the app
 * never states a therapy judgement of its own (brief.md §5).
 *
 * The record's own text stays German in both UI languages and is marked
 * lang="de". Translating a manufacturer's clinical wording would make us the
 * author of a clinical statement rather than the messenger of one, and it is
 * also the version a pharmacist can actually check against the source.
 */
export function ShortageReport({ record, muted, onToggleMute }) {
  const t = useCopy()
  const beginn = formatGermanDate(record.beginn)
  const ende = formatGermanDate(record.ende)
  const meldedatum = formatGermanDate(record.meldedatum)

  return (
    <article className="border-t border-linie-zart pt-5">
      <h4 lang="de" className="text-lg font-semibold bricht-um text-tinte">
        {record.produkt ?? record.wirkstoffe.join(', ')}
      </h4>

      {record.zulassungsinhaber && (
        <p lang="de" className="mt-1 text-base text-tinte-weich">
          {record.zulassungsinhaber}
        </p>
      )}

      {/* The dates carry their own label in the sentence ("Reported start: …"),
          so a separate <dt> would only repeat itself to a screen reader. Only
          the reason, whose value is bare German from the record, needs one. */}
      <div className="mt-4 space-y-2">
        {beginn && <p className="text-base">{t.alert.beginnFn({ datum: beginn })}</p>}

        <p className="text-base">
          {ende ? t.alert.endeFn({ datum: ende }) : t.alert.endeUnbekannt}
        </p>

        {record.grund && (
          <dl className="grid gap-x-6 sm:grid-cols-[max-content_1fr]">
            <dt className="text-base font-semibold">{t.alert.grundLabel}</dt>
            <dd lang="de" className="text-base">
              {record.grund}
            </dd>
          </dl>
        )}
      </div>

      {/* Quoted verbatim and attributed, never paraphrased into advice — this is
          often the single most useful thing in the record (brief.md §2). */}
      {record.anmerkung && (
        <figure className="mt-5 border-l-4 border-linie bg-papier-tief py-4 pl-4 pr-4">
          <figcaption className="text-base font-semibold text-tinte">
            {t.alert.herstellerHinweisLabel}
          </figcaption>
          <blockquote lang="de" className="mt-2 text-base text-tinte">
            „{record.anmerkung}“
          </blockquote>
          <p className="mt-3 text-sm text-tinte-weich">{t.alert.herstellerHinweisQuelle}</p>
        </figure>
      )}

      {record.alternativpraeparat && (
        <div className="mt-5 border-l-4 border-linie bg-papier-tief py-4 pl-4 pr-4">
          <p className="text-base font-semibold text-tinte">{t.alert.alternativeLabel}</p>
          <p lang="de" className="mt-2 text-base">
            {record.alternativpraeparat}
          </p>
          <p className="mt-3 text-sm text-tinte-weich">{t.alert.alternativeDisclaimer}</p>
        </div>
      )}

      <p className="mt-5 text-sm text-tinte-weich">
        {t.alert.quelleFn({
          bearbeitungsnummer: record.bearbeitungsnummer,
          datum: meldedatum ?? '—',
        })}
      </p>

      {muted && <p className="mt-3 text-sm text-tinte-weich">{t.stumm.hinweis}</p>}

      {onToggleMute && (
        <button
          type="button"
          onClick={() => onToggleMute(record.bearbeitungsnummer)}
          className="mt-3 min-h-12 text-sm text-tinte-weich underline underline-offset-4 hover:text-tinte"
        >
          {muted ? t.stumm.aufheben : t.stumm.schalten}
        </button>
      )}
    </article>
  )
}
