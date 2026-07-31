/**
 * The German PZN-8 carries a Modulo-11 check digit: the first seven digits are
 * weighted 1..7, summed, and taken mod 11. A remainder of 10 is not issued.
 *
 * Verified against the 923 distinct PZNs in a live BfArM snapshot: 922 pass.
 * The one that fails (09569740) is bad data in the feed itself — which is
 * exactly why this is advisory. A patient copying the number correctly off
 * their own pack must never be blocked by our arithmetic.
 */
export function isValidPzn(value) {
  const digits = normalizePzn(value)
  if (!/^\d{8}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 7; i += 1) {
    sum += Number(digits[i]) * (i + 1)
  }

  const remainder = sum % 11
  if (remainder === 10) return false
  return remainder === Number(digits[7])
}

/** Strips spaces and the "PZN-" prefix people copy off a Rezept. */
export function normalizePzn(value) {
  return String(value ?? '')
    .replace(/pzn[-\s]*/gi, '')
    .replace(/\D/g, '')
}

/** Groups as "1234 5678" while typing — easier to check against a pack. */
export function formatPzn(value) {
  const digits = normalizePzn(value).slice(0, 8)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)} ${digits.slice(4)}`
}
