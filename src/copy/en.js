/**
 * English UI. Key-for-key mirror of de.js — scripts/test-copy-parity.mjs fails
 * the build if the two drift apart.
 *
 * This translates the app's own chrome only. Everything that comes out of a
 * BfArM record — product names, the reported reason, and above all the
 * manufacturer's own note — stays in German exactly as filed, and is rendered
 * with lang="de". Translating a manufacturer's clinical wording would make
 * this app the author of a clinical statement rather than the messenger of
 * one, which is the line CLAUDE.md draws and does not permit crossing.
 *
 * The register to match is de.js: calm, plain, and specific. Not clinical, not
 * chirpy, no urgency. Someone frightened about losing a medication is reading.
 */
export const en = {
  app: {
    name: "Vorrat",
    // Names the outcome, not the category. "Supply shortage" is the officialese
    // this app exists to translate, so it stays out of the first sentence.
    tagline: "Find out about shortages in your medications, before you are standing in the pharmacy.",
    seitentitel: "Vorrat: early warning for medication supply shortages",
    dataSource:
      "Based on the official supply shortage reports filed with the German Federal Institute for Drugs and Medical Devices (BfArM).",
    madeByPrefix: "Made by ",
    authorName: "Asim Syed",
  },

  /**
   * The opening for someone who has just landed in the app. It answers three
   * questions in order: what the problem is, why advance warning is possible at
   * all, and what Vorrat does with that.
   *
   * The mechanism sentence is the most important one on the screen. Without it
   * there is no reason to believe a warning could arrive in time.
   */
  einstieg: {
    mechanismus:
      "Manufacturers are required to report foreseeable supply shortages to BfArM, often months in advance. Those reports are public. Almost nobody sees them.",
    // "tells you", never "recommends": this app informs, it does not advise.
    vorrat:
      "Vorrat reads those reports every day and tells you when one of your medications is affected. Early enough to talk to your pharmacy or your doctor's practice without rushing.",
    // The trigger carries meaning on its own. "See an example" alone does not
    // say of what, and anyone who never taps would have learned nothing.
    beispielOeffnen: "See an example: what a report looks like",
    beispielSchliessen: "Hide the example",
    beispielLabel: "Example",
    beispielHinweis:
      "Two real reports from the BfArM list. Your own medications are shown the same way.",
  },

  nav: {
    meineMedikamente: "My medications",
    hinzufuegen: "Add a medication",
    datenschutz: "Privacy",
  },

  laden: "Loading reports …",

  stumm: {
    schalten: "Stop highlighting this report",
    aufheben: "Highlight this report again",
    hinweis: "This report is muted. It stays visible here, but is no longer highlighted.",
  },

  vorschlaege: {
    titel: "Did you mean one of these?",
    hilfe: "These names appear in the BfArM list. Tap one to use it.",
  },

  details: {
    ausblenden: "Hide details",
    anzeigenFn: ({ anzahl }) =>
      `Show details (${anzahl} ${anzahl === 1 ? "report" : "reports"})`,
    entfernenFn: ({ name }) => `Remove ${name}`,
  },

  status: {
    clear: {
      label: "Nothing reported",
      body: "No supply shortage has been reported to the authorities for this medication.",
    },
    // Same finding, weaker grounds — see the note in de.js.
    unbekannt: {
      label: "Nothing found",
      body: "We found no report for this name. That usually means everything is fine. We could not match the name with certainty, though. The PZN from the package makes the check exact.",
    },
    watching: {
      // Mirrors the German: deliberately does not claim other manufacturers are
      // still supplying the drug, because the feed cannot tell us that.
      label: "Watching",
      body: "A shortage report affects your active ingredient, but not your specific product. BfArM has not classified it as supply-critical. There is nothing for you to do right now, we will keep watching.",
    },
    affected: {
      label: "Shortage reported",
      body: "There is an official report of an upcoming or ongoing supply shortage for your medication.",
    },
  },

  /**
   * What has changed since we last said something.
   *
   * "Ended" is the only good news this app has to give, and it is only spoken
   * when the report is still listed and its end date has passed. A report that
   * vanishes instead usually means BfArM continued it under a new number, and
   * then we say we do not know. A false all-clear is the worst thing that could
   * happen here.
   */
  entwarnung: {
    beendetLabel: "Shortage ended",
    beendetFn: ({ datum }) =>
      `The reported supply shortage ended on ${datum}. Your medication should be available normally again.`,
    beendetOhneDatum:
      "The reported supply shortage has ended. Your medication should be available normally again.",
    beendetHinweis:
      "Ask your pharmacy whether your product is back in stock. How quickly supply resumes varies from place to place.",
    unklarLabel: "Report no longer listed",
    unklarBody:
      "The earlier report is no longer in the BfArM list. We cannot tell from that whether the shortage has ended or is continuing under a new report number.",
    unklarHinweis: "Ask your pharmacy whether your product is available again.",
    quelleFn: ({ bearbeitungsnummer }) => `Concerned BfArM report ${bearbeitungsnummer}`,
    schliessen: "Understood, hide this note",
  },

  confidence: {
    high: "Exact match with your medication",
    elevated: "Classified as supply-critical by BfArM",
    low: "Affects one of several manufacturers",
  },

  alert: {
    title: "Supply status",
    beginnFn: ({ datum }) => `Reported start: ${datum}`,
    endeFn: ({ datum }) => `Expected end: ${datum}`,
    endeUnbekannt: "Expected end: not stated",
    grundLabel: "Reported reason",
    herstellerHinweisLabel: "Note from the manufacturer",
    herstellerHinweisQuelle:
      "This note was filed with BfArM by the manufacturer and is shown in the original German, exactly as written.",
    alternativeLabel: "Alternative product named in the report",
    alternativeDisclaimer:
      "This name comes from the official report. Only your doctor or pharmacist can decide whether to change or adjust anything.",
    quelleFn: ({ bearbeitungsnummer, datum }) =>
      `Source: BfArM report ${bearbeitungsnummer} (as of ${datum})`,
  },

  naechsteSchritte: {
    title: "What you can do next",
    intro:
      "Raise it early at your next visit to the pharmacy or your doctor's practice.",
    punkte: [
      "Ask your pharmacy whether your product is in stock, or can still be ordered in time.",
      "Ask whether a product with the same active ingredient from another manufacturer is available.",
      "If no substitute is in stock, talk to your doctor's practice about adjusting the prescription in good time.",
      "Show your pharmacy this BfArM report number if it helps.",
    ],
  },

  unsicherheit: {
    title: "About this data",
    body: "These details come from the reports manufacturers are legally required to file with BfArM. A report does not necessarily mean your local pharmacy has run out. Actual availability varies from place to place.",
  },

  hinzufuegen: {
    title: "Add a medication",
    fehlerName: "Please enter a name or active ingredient.",
    warnungPzn: "This does not look like a valid 8-digit PZN. You can save it anyway.",
    nameLabel: "Medication name or active ingredient",
    nameHilfe: "As printed on the package, for example L-Thyroxin or Pantoprazol",
    pznLabel: "Pharmazentralnummer (PZN), optional",
    pznHilfe:
      "The 8-digit number on the package and on every prescription. It is optional, and giving it lets us match your exact pack.",
    speichern: "Save medication",
    abbrechen: "Cancel",
  },

  leer: {
    title: "No medications added yet",
    // Says what happens next instead of repeating the header. The "every day
    // after that" is the point: Vorrat is a standing watch, not a one-off lookup.
    body: "Add a medication. We check right away, and every day after that.",
    cta: "Add your first medication",
  },

  datenschutz: {
    title: "Privacy",
    kurz: "Your medication list is stored only on this device and is never transmitted.",
    lang: "No account is needed. The medications you enter stay in this browser and never leave your device. Vorrat only downloads the public BfArM list and compares it here, on your device. Anyone with access to this device can, however, see the list.",
  },

  fehler: {
    laden:
      "The current shortage data could not be loaded. Please check your internet connection.",
    veraltetFn: ({ datum }) => `Showing a saved version from ${datum}.`,
  },

  aktualisiert: {
    standFn: ({ datum }) => `BfArM data as of ${datum}`,
  },

  vorrat: {
    titel: "Estimated supply & run-out date",
    optionalOeffnen: "Add a supply estimate (optional)",
    optionalSchliessen: "Hide the supply estimate",
    optionalHilfe:
      "If you fill this in, we can show you whether a shortage begins before your supply runs out. You can also leave it empty.",
    aufgebrauchtFn: ({ datum }) => `By this estimate your supply ran out on ${datum}.`,
    packungsgroesseLabel: "Pack size (number of tablets or units)",
    dosisLabel: "Daily dose (e.g. 1 or 0.5)",
    letzteAbholungLabel: "Date of last pickup",
    reichtBisFn: ({ datum }) => `Your supply is estimated to last until roughly ${datum}.`,
    unsicher: "Run-out estimate incomplete. Please check your entries.",
    vorEngpassFn: ({ datum }) => `Your supply is estimated to end on ${datum}, before the reported shortage starts.`,
    nachEngpassFn: ({ datum }) => `The reported shortage starts before your supply is estimated to end on ${datum}.`,
    hinweis: "This is an estimate based on your own entries and does not account for changes in dose.",
  },

  apotheke: {
    titel: "Pharmacy counter view",
    untertitel: "Show this screen at the counter for quick report lookup",
    buttonLabel: "Show to pharmacy",
    schliessen: "Close view",
    hinweis: "Show this screen or the report number to your pharmacist to reference the official BfArM shortage filing.",
  },
};

