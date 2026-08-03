# The snapshot archive

## What this is

BfArM publishes each shortage's *current* expected end date. It does not publish
the history of that field. When a manufacturer pushes an end date back by four
months, the old value is overwritten and gone.

So the question "how much do manufacturers' predicted end dates actually slip?"
cannot be answered from the feed at any single moment. It can only be answered
by an archive built forward from a start date. Nobody in Germany publishes this.

**The archive began 2026-07-31.** Every day it runs is a day that can be
measured; every day it silently fails is a gap that can never be backfilled.

## Where it lives

| Path | What it is |
|---|---|
| `data/snapshots/YYYY-MM-DD.csv` | One raw BfArM CSV per day, semicolon-delimited, Windows-1252, with two columns removed (see below). Keyed by UTC date. |
| `data/processed/drift.json` | Derived. End-date drift per shortage, recomputed from the full snapshot set on every run. |

Written by `.github/workflows/daily-snapshot.yml`, which runs at 03:00 UTC and
commits to this repository. Storage is deliberately unresolved: moving `data/`
to private object storage or a separate private repo was considered on
2026-08-04 and deferred until something actually consumes the drift data.

## The one deviation from "raw, unmodified"

The archived CSV is byte-for-byte the feed **except that the `E-Mail` and
`Telefon` columns are stripped** by `scripts/strip-contacts.mjs` before anything
is committed.

Those columns carry direct contact details for named individuals at
manufacturers. Vorrat reads neither. Committing them daily would bake personal
contact data into a public git history permanently, where it cannot be recalled.
An archive marginally less pure than the wire format is a much better outcome.

The workflow greps for `@` after stripping and refuses to archive if anything
survived, so this cannot regress quietly.

## Failure behaviour

Both the HTTP check and the CSV-header sanity check `exit 1`. This is
deliberate: a missed day is unrecoverable, so a green run that archived nothing
is the single worst outcome — it hides a permanent gap. A red run is noisy and
recoverable by re-running the same day.

## Why there is no prune step

There used to be one, keeping the 60 newest snapshots. It quietly capped the
entire archive. `scripts/analyze-drift.mjs` recomputes from every CSV present in
the working tree, so a 60-file window meant drift could never be measured over
more than 60 days, however long the archive ran. The long record is the whole
point, and that step made the long record impossible.

Removing it means unbounded growth: roughly **308 KB/day**, about 112 MB/year
uncompressed, though git delta-compresses near-identical CSVs well.

Two ways to re-bound that later without losing history, in order of preference:

1. **Make `drift.json` cumulative.** Have `analyze-drift.mjs` merge each new
   day's observations into the existing output instead of recomputing from
   scratch. Once history lives in the derived file, raw CSVs older than a
   window can be pruned freely. This is the right fix and it needs care: the
   analyzer has 23 tests built around the recompute model.
2. **Gzip archived snapshots.** CSV compresses roughly 8x. Cheaper to do,
   but the analyzer and its tests must learn to read `.csv.gz`.

## What is deliberately not stored

A per-day *parsed* JSON snapshot was considered and skipped. The argument for it
is that later analysis shouldn't depend on re-running today's parser — but the
raw CSV is retained precisely so it can be re-parsed, which makes the parsed
copy a convenience rather than insurance. It would roughly double daily
footprint for that convenience, which is a poor trade while storage is
unresolved. Revisit if re-parsing the full archive ever becomes slow enough to
matter.

## Known consumers

`scripts/analyze-drift.mjs` only. Nothing in `src/` or `api/` reads this
directory, and `drift.json` is currently read by nothing at all — the tree is
write-only until a feature consumes it. Keep it that way deliberately rather
than by accident: the app fetches live data through `/api/shortages` and must
not develop a build-time dependency on the archive.
