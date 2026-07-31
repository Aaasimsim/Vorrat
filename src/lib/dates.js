export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/** A report counts as current if it hasn't ended yet — a future Beginn is still "active" (that's the advance warning). */
export function isActiveShortage(record, today = todayIso()) {
  return record.ende === null || record.ende >= today
}
