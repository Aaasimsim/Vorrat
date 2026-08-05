# Vorrat

Early warning for people whose medication is about to run short.

German drug shortages are reported by manufacturers to the BfArM and published openly, sometimes
months ahead. The database is public and machine-readable, and patients never see it. Vorrat reads
that feed and tells a patient when something they depend on is about to become hard to get.

**Live:** https://vorrat-two.vercel.app

## What this is, and what it is not

Vorrat is an independent project. It provides information only, is not intended as a medical device,
and is not affiliated with BfArM. It shows what manufacturers have reported to BfArM, and nothing
beyond that.

A quiet state means no matching shortage was found in the feed, which is not the same as your
medication being available: ingredient names carry salt forms, matching is graded by confidence, and
a name matched wrongly reads as clear. A reported shortage does not mean your pharmacy is out today
either. Local stock is the one thing this data cannot see.

Treat it as a reason to ask your pharmacy sooner, never as a replacement for your pharmacist or
doctor.

See [brief.md](brief.md) for the product, [CLAUDE.md](CLAUDE.md) for the build rules.

## Running it

```sh
npm install
npm run dev
```

`vite dev` serves the real serverless handler against the live BfArM feed, so there is no mock to
drift out of sync.

```sh
npm run feed:snapshot   # save a local copy of the feed for offline work
npm test                # pipeline + Wirkstoff normalisation, against that snapshot
```

## How it is put together

```
api/shortages.js     fetches the BfArM CSV, parses, dedupes, serves compact JSON
src/lib/pipeline.js  CSV -> one record per Bearbeitungsnummer
src/lib/matching.js  graded confidence: PZN / product / verskri / Wirkstoff
src/lib/storage.js   the medication list, on this device only
src/copy/de.js       every user-facing string, for native-speaker review
```

The split matters: the shortage list is public and travels over the network, the medication list is
private and does not. Matching happens in the browser, so nothing about a user's medication is ever
sent anywhere. There is no account and no analytics carrying drug names.

## Things worth knowing before changing this

**The feed is Windows-1252.** Decoding it as UTF-8 corrupts every umlaut.

**`Beginn` is often in the future.** That is the product, not a bug. Do not filter those out.

**Ingredient names carry salt forms.** The feed says `Pantoprazol-Natrium-Sesquihydrat`; the patient
types `Pantoprazol`. `src/lib/wirkstoffNames.js` reconciles the two. Without it the app silently
reports "clear" for a drug that is in shortage.

**There is no market denominator.** brief.md §3 proposes alerting when most manufacturers of an
ingredient are affected. That cannot be computed here: the feed lists only manufacturers who are
*reporting a shortage*, so on a live snapshot 223 of 266 ingredient markets show a single known
manufacturer and the ratio is ~always 100%. Pantoprazole, with a dozen real manufacturers and three
reporting, reads as total market failure. The alert tiers therefore rest on BfArM's own
`klassifikation`, and the market figure is shown only as labelled context. Implementing that tier
properly needs a registry of authorised products per ingredient, which is a separate data source.

**A false alarm is worse than no product.** When a rule is ambiguous, fail toward the quiet state.

## Data Source & Attribution

Data is sourced from the official public shortage feed provided by **BfArM / PharmNet.Bund** (*Lieferengpassmeldungen für Humanarzneimittel in Deutschland*):
`https://anwendungen.pharmnet-bund.de/lieferengpassmeldungen/public/csv`

The feed is published openly and without authentication. Formal redistribution terms for commercial
use have not been verified, so confirm them with BfArM before deploying this commercially.

## Status

v1 per brief.md §4 is deployed and running against the live feed: pipeline, graded matching, the
quiet state, the alert, run-out estimates and the pharmacy view.

Two things are worth knowing before pointing anyone at it:

- **The German copy has not had a native-speaker review.** See
  [docs/copy-review.md](docs/copy-review.md), the review worksheet. This is the most useful
  contribution anyone could make right now.
- **There are no notifications.** Vorrat is a page you have to open, so it cannot yet do the
  thing its name promises. Closing that gap is the main open piece of work.

