import fs from 'node:fs'
import path from 'node:path'
import { buildShortageIndex } from '../src/lib/pipeline.js'

/**
 * Converts a YYYY-MM-DD date string into UTC milliseconds.
 * Returns null if missing or unparsable.
 */
function parseIsoDateUtc(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null
  const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD strings (toIso - fromIso).
 */
function dateDiffInDays(fromIso, toIso) {
  const t1 = parseIsoDateUtc(fromIso)
  const t2 = parseIsoDateUtc(toIso)
  if (t1 == null || t2 == null) return 0
  const msPerDay = 86400000
  return Math.round((t2 - t1) / msPerDay)
}

/**
 * Resolves a Bearbeitungsnummer to its earliest reachable root ancestor by walking
 * the referenzierteErstmeldung parent chain.
 *
 * BfArM does not update shortage reports in place — it issues a new Bearbeitungsnummer
 * and withdraws the previous one, setting referenzierteErstmeldung to the superseded report ID.
 *
 * Returns { rootId, chainTruncated }.
 */
function resolveRoot(bn, refErstmeldung, parentMap) {
  if (refErstmeldung && !parentMap.has(bn)) {
    parentMap.set(bn, refErstmeldung)
  } else if (!parentMap.has(bn)) {
    parentMap.set(bn, null)
  }

  let current = bn
  const visited = new Set([current])

  while (true) {
    const parent = parentMap.get(current)
    if (!parent) break
    if (visited.has(parent)) {
      // Guard against potential cycles in reference chains.
      break
    }
    visited.add(parent)
    current = parent
  }

  // A chain is truncated if the root ancestor was referenced as an original (refErstmeldung)
  // but its full record predates our snapshot archive (i.e. parentMap has no record entry for it).
  const chainTruncated = parentMap.get(current) === undefined

  return { rootId: current, chainTruncated }
}

/**
 * Process a chronological list of snapshot CSV file paths and analyze date drift.
 */
export function analyzeDriftFromSnapshots(snapshotFiles) {
  const sortedFiles = [...snapshotFiles].sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b)),
  )

  const parentMap = new Map()
  const trackedShortages = new Map()
  const snapshotDates = []

  for (const filePath of sortedFiles) {
    const fileName = path.basename(filePath)
    const snapshotDate = fileName.replace(/\.csv$/, '')
    snapshotDates.push(snapshotDate)

    const fileBuffer = fs.readFileSync(filePath)
    const index = buildShortageIndex(fileBuffer)

    // First pass: register parent links for all records in this snapshot
    for (const record of index.records) {
      const bn = record.bearbeitungsnummer
      const ref = record.referenzierteErstmeldung
      if (ref && !parentMap.has(bn)) {
        parentMap.set(bn, ref)
      } else if (!parentMap.has(bn)) {
        parentMap.set(bn, null)
      }
    }

    // Second pass: map records to root identity chains and update drift metrics
    for (const record of index.records) {
      const bn = record.bearbeitungsnummer
      const ref = record.referenzierteErstmeldung
      const { rootId, chainTruncated } = resolveRoot(bn, ref, parentMap)
      const currentEnde = record.ende

      if (!trackedShortages.has(rootId)) {
        trackedShortages.set(rootId, {
          rootId,
          currentBearbeitungsnummer: bn,
          produkt: record.produkt,
          wirkstoffe: record.wirkstoffe,
          zulassungsinhaber: record.zulassungsinhaber,
          atc: record.atc,
          firstObservedEnde: currentEnde,
          latestObservedEnde: currentEnde,
          totalDaysDrifted: 0,
          extensionsCount: 0,
          chainTruncated,
          extensionHistory: [],
        })
      } else {
        const tracked = trackedShortages.get(rootId)

        // Update metadata to latest known values
        if (record.produkt) tracked.produkt = record.produkt
        if (record.wirkstoffe?.length) tracked.wirkstoffe = record.wirkstoffe
        if (record.zulassungsinhaber) tracked.zulassungsinhaber = record.zulassungsinhaber
        if (record.atc) tracked.atc = record.atc
        tracked.currentBearbeitungsnummer = bn
        if (chainTruncated) tracked.chainTruncated = true

        const prevEnde = tracked.latestObservedEnde

        if (!tracked.firstObservedEnde && currentEnde) {
          tracked.firstObservedEnde = currentEnde
        }

        if (prevEnde && currentEnde) {
          const diffDays = dateDiffInDays(prevEnde, currentEnde)
          if (diffDays > 0) {
            tracked.extensionsCount += 1
            tracked.totalDaysDrifted += diffDays
            tracked.extensionHistory.push({
              snapshotDate,
              previousEnde: prevEnde,
              newEnde: currentEnde,
              daysExtended: diffDays,
              bearbeitungsnummer: bn,
            })
            tracked.latestObservedEnde = currentEnde
          } else if (diffDays < 0) {
            // Shortage end date was moved earlier
            tracked.latestObservedEnde = currentEnde
          }
        } else if (!prevEnde && currentEnde) {
          tracked.latestObservedEnde = currentEnde
        }
      }
    }
  }

  const allRecords = Array.from(trackedShortages.values())
  const totalShortagesTracked = allRecords.length
  const driftedRecords = allRecords.filter((r) => r.extensionsCount > 0)
  const driftedCount = driftedRecords.length

  const driftDaysList = driftedRecords.map((r) => r.totalDaysDrifted).sort((a, b) => a - b)
  const totalExtensionEvents = allRecords.reduce((sum, r) => sum + r.extensionsCount, 0)

  let meanDaysDrifted = 0
  let medianDaysDrifted = 0

  if (driftedCount > 0) {
    const sumDays = driftDaysList.reduce((a, b) => a + b, 0)
    meanDaysDrifted = Number((sumDays / driftedCount).toFixed(1))

    const mid = Math.floor(driftedCount / 2)
    if (driftedCount % 2 === 1) {
      medianDaysDrifted = driftDaysList[mid]
    } else {
      medianDaysDrifted = Number(((driftDaysList[mid - 1] + driftDaysList[mid]) / 2).toFixed(1))
    }
  }

  const leaderboard = [...driftedRecords]
    .sort((a, b) => b.totalDaysDrifted - a.totalDaysDrifted || b.extensionsCount - a.extensionsCount)
    .slice(0, 20)

  const firstSnapshot = snapshotDates.length > 0 ? snapshotDates[0] : null
  const lastSnapshot = snapshotDates.length > 0 ? snapshotDates[snapshotDates.length - 1] : null

  return {
    generatedAt: new Date().toISOString(),
    snapshotCount: snapshotDates.length,
    firstSnapshot,
    lastSnapshot,
    summary: {
      totalShortagesTracked,
      driftedCount,
      driftRate: {
        drifted: driftedCount,
        of: totalShortagesTracked,
        percentage:
          totalShortagesTracked > 0
            ? Number(((driftedCount / totalShortagesTracked) * 100).toFixed(1))
            : 0,
      },
      meanDaysDrifted,
      medianDaysDrifted,
      totalExtensionEvents,
    },
    leaderboard,
    records: allRecords,
  }
}

// Standalone execution entry point
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('analyze-drift.mjs') ||
    process.argv[1].endsWith('analyze-drift.js'))

if (isDirectExecution) {
  const snapshotsDir = path.resolve('data/snapshots')
  const outDir = path.resolve('data/processed')
  const outFile = path.join(outDir, 'drift.json')

  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true })
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const files = fs
    .readdirSync(snapshotsDir)
    .filter((f) => f.endsWith('.csv'))
    .map((f) => path.join(snapshotsDir, f))

  const result = analyzeDriftFromSnapshots(files)

  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8')
  console.log(
    `✅ Date Drift analysis complete (${result.snapshotCount} snapshots processed). Output written to ${outFile}`,
  )
}
