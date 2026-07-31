/**
 * Normalise German ingredient names (Wirkstoffe) to a canonical base form.
 *
 * BfArM shortage feed entries contain pharmacopoeial annotations, salt/ester
 * suffixes, hydrate forms, and archaic/chemical formatting (e.g. "Quetiapinfumarat (Ph.Eur.)",
 * "Pantoprazol-Natrium-Sesquihydrat").
 *
 * This module reduces both feed entries and patient query strings to canonical base
 * forms so that matching succeeds reliably while preserving clinical safety (never collapsing
 * distinct active ingredients like Levothyroxin vs Liothyronin).
 */

// List of salt / ester suffixes in German pharmaceutical nomenclature.
// Ordered by length descending so longer composite suffixes match first.
const SALT_ESTER_SUFFIXES = [
  'dihydrogenphosphat',
  'etexilatmesilat',
  'dihydrochlorid',
  'trihydrochlorid',
  'dipropionat',
  'hydrochlorid',
  'lactobionat',
  'propionat',
  'hemimagnesium',
  'hemicalcium',
  'calciumsalz',
  'natriumsalz',
  'hemisulfat',
  'palmitat',
  'embonat',
  'fumarat',
  'succinat',
  'tartrat',
  'mesilat',
  'mesylat',
  'besilat',
  'oxalat',
  'citrat',
  'acetat',
  'phosphat',
  'nitrat',
  'bromid',
  'chlorid',
  'sulfat',
  'maleat',
  'valerat',
  'furoat',
  'axetil',
  'cilexetil',
  'etexilat',
  'estolat',
  'mannitol',
  'decanoat',
  'mononitrat',
  'benzoat',
  'carbonat',
  'acetonid',
  'hcl',
  'natrium',
  'kalium',
  'calcium',
  'magnesium',
];

/**
 * Replace German umlauts and sharp S with ASCII equivalents.
 */
function normalizeUmlauts(str) {
  return str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/**
 * Reduce a Wirkstoff string to a canonical base ingredient for comparison.
 * Must be applied to BOTH the feed value and the user's typed query.
 * Returns a lowercased string. Never throws; returns '' for null/empty input.
 *
 * @param {string} name
 * @returns {string}
 */
export function canonicalWirkstoff(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let str = name.trim();
  if (!str) return '';

  // 1. Lowercase & Umlaut normalization
  str = str.toLowerCase();
  str = normalizeUmlauts(str);

  // Unwrap chemical salt wrapper prefixes like "natrium(hydrocortison...)" -> "hydrocortison..."
  str = str.replace(/natrium\(([^)]+)\)/gi, '$1');

  // 2. Remove double parentheses and parenthetical annotations iteratively
  // e.g. ((mit Angaben zum ...)), (Ph.Eur.), (DAB), (USP), (1:1), (1:x), [(R,R)-tartrat]
  while (/\(\([^)]*\)\)/.test(str)) {
    str = str.replace(/\(\([^)]*\)\)/g, ' ');
  }
  while (/\([^)]*\)/.test(str)) {
    str = str.replace(/\([^)]*\)/g, ' ');
  }
  str = str.replace(/\[[^\]]*\]/g, ' ');

  // Remove trailing punctuation like orphaned parens, brackets, commas
  str = str.replace(/[()\[\]{},;:]/g, ' ');

  // Remove standalone ratio or dose annotations like "1:1", "1:x"
  str = str.replace(/\b\d+:\w+\b/g, ' ');

  // 3. Remove hydrate notations
  // e.g. "x H<2>O", "3 H<2>O", "x H2O", "-Monohydrat", "Dihydrat", "wasserfrei"
  str = str.replace(/\b\d*\s*x\s*\d*\s*h<2>o\b/gi, ' ');
  str = str.replace(/\b\d*\s*h<2>o\b/gi, ' ');
  str = str.replace(/\b\d*\s*x\s*\d*\s*h2o\b/gi, ' ');
  str = str.replace(/\b\d*\s*h2o\b/gi, ' ');
  str = str.replace(/[-_\s]?(monohydrat|dihydrat|trihydrat|tetrahydrat|pentahydrat|hexahydrat|heptahydrat|sesquihydrat|hemihydrat|hydrat|wasserfrei)\b/g, ' ');

  // 4. Remove hyphenated/separated salt words
  // e.g. "-Natrium", "-Kalium", "-Calcium", "-Magnesium", "-Hydrochlorid"
  str = str.replace(/[-_\s]+(natrium|kalium|calcium|magnesium|dinatrium|dicalcium|dihydrogenphosphat|hemimagnesium|hemicalcium|tert-butylamin|tertbutylamin|salz|calciumsalz|natriumsalz)\b/g, ' ');

  // 5. Strip concatenated salt/ester suffixes from individual words
  // Minimum stem length guard: only strip if remaining stem has at least 4 characters
  const words = str.split(/[\s\-_]+/).filter(Boolean);
  const canonicalWords = words.map(word => {
    let current = word;
    let stripped = true;

    while (stripped) {
      stripped = false;
      for (const suffix of SALT_ESTER_SUFFIXES) {
        if (current.endsWith(suffix) && current.length - suffix.length >= 4) {
          current = current.slice(0, -suffix.length);
          stripped = true;
          break; // restart check on reduced word
        }
      }
    }
    return current;
  }).filter(Boolean);

  return canonicalWords.join(' ').trim();
}

/**
 * Both sides canonicalised, then compared. Returns boolean.
 *
 * @param {string} userQuery
 * @param {string} feedValue
 * @returns {boolean}
 */
export function wirkstoffMatches(userQuery, feedValue) {
  const cUser = canonicalWirkstoff(userQuery);
  const cFeed = canonicalWirkstoff(feedValue);

  if (!cUser || !cFeed) return false;

  // Direct match
  if (cUser === cFeed) return true;

  // If feedValue contains multiple ingredients (separated by ; or , or "und"), check each component
  if (feedValue && (feedValue.includes(';') || feedValue.includes(',') || feedValue.includes(' und '))) {
    const parts = feedValue.split(/;|,|\bund\b/).map(p => canonicalWirkstoff(p)).filter(Boolean);
    if (parts.includes(cUser)) return true;
  }

  return false;
}
