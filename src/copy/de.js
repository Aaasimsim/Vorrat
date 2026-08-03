// src/copy/de.js

export const de = {
  app: {
    name: "Vorrat",
    // Benennt das Ergebnis, nicht die Kategorie. "Lieferengpass" ist genau das
    // Amtsdeutsch, das diese App übersetzen soll, und steht deshalb nicht im
    // ersten Satz.
    tagline: "Erfahren Sie von Engpässen bei Ihren Medikamenten, bevor Sie in der Apotheke stehen.",
    seitentitel: "Vorrat: Frühwarnung bei Lieferengpässen von Medikamenten",
    dataSource: "Basiert auf den offiziellen Lieferengpassmeldungen des Bundesinstituts für Arzneimittel und Medizinprodukte (BfArM).",
    madeByPrefix: "Entwickelt von ",
    authorName: "Asim Syed",
  },

  /**
   * Der Einstieg für jemanden, der die App zum ersten Mal öffnet. Er beantwortet
   * drei Fragen in dieser Reihenfolge: Was ist das Problem, warum können wir
   * überhaupt vorwarnen, und was macht Vorrat damit.
   *
   * Der Mechanismus-Satz ist der wichtigste auf dem ganzen Bildschirm. Ohne ihn
   * gibt es keinen Grund zu glauben, dass eine Vorwarnung möglich ist.
   */
  einstieg: {
    mechanismus:
      "Hersteller müssen absehbare Lieferengpässe dem BfArM melden, oft Monate im Voraus. Diese Meldungen sind öffentlich. Nur sieht sie fast niemand.",
    // "sagt Ihnen", nicht "empfiehlt": die App informiert, sie rät nie.
    vorrat:
      "Vorrat liest diese Meldungen täglich und sagt Ihnen, wenn eines Ihrer Medikamente betroffen ist. Früh genug, um in Ruhe mit Apotheke oder Praxis zu sprechen.",
    // Der Auslöser sagt selbst schon etwas aus. "Beispiel ansehen" allein
    // verrät nicht, wofür, und wer nicht tippt, hätte gar nichts gelernt.
    beispielOeffnen: "Beispiel ansehen: So sieht eine Meldung aus",
    beispielSchliessen: "Beispiel ausblenden",
    beispielLabel: "Beispiel",
    beispielHinweis:
      "Zwei echte Meldungen aus der BfArM-Liste. Ihre eigenen Medikamente werden genauso dargestellt.",
  },

  nav: {
    meineMedikamente: "Meine Medikamente",
    hinzufuegen: "Medikament hinzufügen",
    datenschutz: "Datenschutz",
  },

  laden: "Meldungen werden geladen …",

  stumm: {
    schalten: "Diese Meldung nicht mehr hervorheben",
    aufheben: "Meldung wieder hervorheben",
    hinweis: "Diese Meldung ist stummgeschaltet. Sie bleibt hier sichtbar, wird aber nicht mehr hervorgehoben.",
  },

  vorschlaege: {
    titel: "Meinten Sie einen dieser Namen?",
    hilfe: "Diese Namen kommen in der BfArM-Liste vor. Tippen Sie einen an, um ihn zu übernehmen.",
  },

  details: {
    ausblenden: "Details ausblenden",
    anzeigenFn: ({ anzahl }) =>
      `Details anzeigen (${anzahl} ${anzahl === 1 ? "Meldung" : "Meldungen"})`,
    entfernenFn: ({ name }) => `${name} entfernen`,
  },

  status: {
    clear: {
      label: "Keine Meldung",
      body: "Für dieses Medikament liegt aktuell keine behördliche Lieferengpassmeldung vor.",
    },
    // Same finding, weaker grounds. The BfArM-Liste contains only medications
    // currently in shortage, so a name we cannot place is usually a medication
    // that is simply fine — but it can also be a spelling we did not read.
    // Saying only "keine Meldung" would turn that ambiguity into false
    // reassurance, so this states both and offers the PZN as the way out.
    // Written to inform, not to alarm: the common case here is good news.
    unbekannt: {
      label: "Keine Meldung gefunden",
      body: "Wir haben keine Meldung zu diesem Namen gefunden. Das heißt meistens: alles in Ordnung. Sicher zuordnen können wir ihn aber nicht. Mit der PZN von der Packung wird die Prüfung eindeutig.",
    },
    watching: {
      // Deliberately does not claim that other manufacturers are still
      // supplying the drug: the BfArM feed lists only who reports a shortage,
      // never who supplies the market, so that sentence would be an inference
      // stated as fact. It says what is actually on record instead.
      // ­ is a soft hyphen: invisible unless the line actually has to
      // break there, and then it renders a real hyphen. The two long status
      // words are wider than their badge on a 320px screen at a large user
      // text size, and browsers without a German hyphenation dictionary would
      // otherwise cut them mid-syllable with no hyphen at all. Written as an
      // escape rather than a literal so the character stays visible in review.
      label: "In Beobach­tung",
      body: "Eine Lieferengpassmeldung betrifft Ihren Wirkstoff, aber nicht Ihr Präparat direkt. Das BfArM hat sie nicht als versorgungskritisch eingestuft. Sie müssen jetzt nichts tun, wir beobachten das weiter.",
    },
    affected: {
      label: "Liefer­engpass gemeldet",
      body: "Für Ihr Medikament liegt eine offizielle Meldung über einen bevorstehenden oder aktiven Lieferengpass vor.",
    },
  },

  /**
   * Was sich seit der letzten Meldung geändert hat.
   *
   * "beendet" ist die einzige gute Nachricht, die diese App überhaupt zu geben
   * hat, und sie wird nur ausgesprochen, wenn die Meldung noch in der Liste
   * steht und ihr Enddatum vorbei ist. Verschwindet eine Meldung dagegen
   * spurlos, heißt das meistens, dass das BfArM sie unter neuer Nummer
   * fortgeschrieben hat. Dann sagen wir, dass wir es nicht wissen. Eine falsche
   * Entwarnung wäre das Schlimmste, was hier passieren kann.
   */
  entwarnung: {
    beendetLabel: "Engpass beendet",
    beendetFn: ({ datum }) =>
      `Der gemeldete Lieferengpass ist seit dem ${datum} beendet. Ihr Medikament sollte wieder normal lieferbar sein.`,
    beendetOhneDatum:
      "Der gemeldete Lieferengpass ist beendet. Ihr Medikament sollte wieder normal lieferbar sein.",
    beendetHinweis:
      "Fragen Sie in Ihrer Apotheke nach, ob Ihr Präparat dort wieder vorrätig ist. Wie schnell die Belieferung wieder anläuft, ist von Ort zu Ort verschieden.",
    unklarLabel: "Meldung nicht mehr gelistet",
    unklarBody:
      "Die frühere Meldung steht nicht mehr in der BfArM-Liste. Ob der Engpass beendet ist oder unter einer neuen Nummer weiterläuft, können wir daraus nicht ablesen.",
    unklarHinweis:
      "Fragen Sie in Ihrer Apotheke nach, ob Ihr Präparat wieder lieferbar ist.",
    quelleFn: ({ bearbeitungsnummer }) => `Betraf BfArM-Meldung ${bearbeitungsnummer}`,
    schliessen: "Verstanden, Hinweis ausblenden",
  },

  confidence: {
    high: "Genaue Übereinstimmung mit Ihrem Medikament",
    elevated: "Vom BfArM als versorgungskritisch eingestuft",
    low: "Betrifft einen von mehreren Herstellern",
  },

  alert: {
    title: "Information zum Lieferstatus",
    beginnFn: ({ datum }) => `Gemeldeter Beginn: ${datum}`,
    endeFn: ({ datum }) => `Voraussichtliches Ende: ${datum}`,
    endeUnbekannt: "Voraussichtliches Ende: Nicht angegeben",
    grundLabel: "Gemeldeter Grund",
    herstellerHinweisLabel: "Hinweis des Herstellers",
    herstellerHinweisQuelle: "Diese Information stammt direkt aus der Auskunft des Herstellers an das BfArM.",
    alternativeLabel: "In der Meldung genanntes Alternativpräparat",
    alternativeDisclaimer: "Dieser Hinweis stammt aus der behördlichen Meldung. Die Entscheidung über einen Wechsel oder eine Anpassung trifft ausschließlich Ihr Arzt oder Ihre Apotheke.",
    quelleFn: ({ bearbeitungsnummer, datum }) => `Quelle: BfArM-Meldung ${bearbeitungsnummer} (Stand: ${datum})`,
  },

  naechsteSchritte: {
    title: "Mögliche nächste Schritte",
    intro: "Besprechen Sie die Versorgungslage frühzeitig bei Ihrem nächsten Besuch in der Apotheke oder Arztpraxis.",
    punkte: [
      "Fragen Sie in Ihrer Apotheke, ob Ihr Präparat ausreichend vorrätig ist oder rechtzeitig bestellt werden kann.",
      "Erkundigen Sie sich, ob ein wirkstoffgleiches Präparat eines anderen Herstellers verfügbar ist.",
      "Falls kein Ersatz vorrätig ist: Sprechen Sie mit Ihrer Arztpraxis über eine rechtzeitige Rezeptanpassung.",
      "Zeigen Sie bei Bedarf diese BfArM-Meldungsnummer in Ihrer Apotheke vor.",
    ],
  },

  unsicherheit: {
    title: "Hinweis zur Datenbasis",
    body: "Die Angaben basieren auf den gesetzlichen Selbstauskünften der Hersteller gegenüber dem BfArM. Eine Meldung bedeutet nicht zwingend, dass das Medikament in Ihrer Apotheke vor Ort vergriffen ist. Die tatsächliche Verfügbarkeit kann lokal variieren.",
  },

  hinzufuegen: {
    title: "Medikament hinzufügen",
    fehlerName: "Bitte geben Sie einen Namen oder Wirkstoff ein.",
    // The PZN is only ever a warning: the BfArM feed itself contains at least
    // one PZN that fails its own checksum, so blocking on it would reject a
    // number a patient copied correctly from their pack.
    warnungPzn: "Diese PZN sieht nicht wie eine gültige 8-stellige PZN aus. Sie können sie trotzdem speichern.",
    nameLabel: "Name des Medikaments oder Wirkstoff",
    nameHilfe: "Wie auf der Verpackung angegeben, zum Beispiel L-Thyroxin oder Pantoprazol",
    pznLabel: "Pharmazentralnummer (PZN), optional",
    pznHilfe: "Die 8-stellige Nummer finden Sie auf der Packung und auf jedem Rezept. Die Eingabe ist freiwillig und ermöglicht eine genauere Zuordnung.",
    speichern: "Medikament speichern",
    abbrechen: "Abbrechen",
  },

  leer: {
    title: "Noch keine Medikamente hinterlegt",
    // Sagt, was als Nächstes passiert, statt die Kopfzeile zu wiederholen. Das
    // "danach täglich" ist der Punkt: Vorrat ist eine laufende Beobachtung,
    // keine einmalige Abfrage.
    body: "Fügen Sie ein Medikament hinzu. Wir prüfen sofort und danach täglich.",
    cta: "Erstes Medikament hinzufügen",
  },

  datenschutz: {
    title: "Datenschutz & Privatsphäre",
    kurz: "Ihre Medikamentenliste wird ausschließlich lokal auf Ihrem Gerät gespeichert und niemals übertragen.",
    // "vollständig geschützt" was removed: the list is stored unencrypted in
    // this browser, so anyone with access to the device can read it. Claiming
    // complete protection would be an overclaim in a health product.
    lang: "Es wird kein Benutzerkonto benötigt. Ihre eingegebenen Medikamente bleiben in Ihrem Browser gespeichert und verlassen Ihr Gerät zu keinem Zeitpunkt. Vorrat lädt nur die öffentliche Liste des BfArM herunter und gleicht sie hier auf Ihrem Gerät ab. Wer Zugriff auf dieses Gerät hat, kann die Liste allerdings sehen.",
  },

  fehler: {
    laden: "Die aktuellen Lieferengpassdaten konnten nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.",
    veraltetFn: ({ datum }) => `Hinweis: Es wird ein gespeicherter Stand vom ${datum} angezeigt.`,
  },

  aktualisiert: {
    standFn: ({ datum }) => `Stand der BfArM-Daten: ${datum}`,
  },

  vorrat: {
    titel: "Reichweite & Vorratsschätzung",
    optionalOeffnen: "Vorratsschätzung hinzufügen (optional)",
    optionalSchliessen: "Vorratsschätzung ausblenden",
    optionalHilfe:
      "Wenn Sie diese Angaben machen, können wir Ihnen zeigen, ob ein Engpass beginnt, bevor Ihr Vorrat endet. Sie können das Feld auch leer lassen.",
    aufgebrauchtFn: ({ datum }) => `Ihr Vorrat war rechnerisch am ${datum} aufgebraucht.`,
    packungsgroesseLabel: "Packungsgröße (Anzahl Tabletten oder Einheiten)",
    dosisLabel: "Tägliche Dosis (z. B. 1 oder 0,5)",
    letzteAbholungLabel: "Datum der letzten Abholung",
    reichtBisFn: ({ datum }) => `Ihr Vorrat reicht voraussichtlich bis etwa ${datum}.`,
    unsicher: "Vorratsschätzung unvollständig. Bitte ergänzen Sie Ihre Angaben.",
    vorEngpassFn: ({ datum }) => `Ihr Vorrat endet voraussichtlich am ${datum}, bevor der gemeldete Engpass beginnt.`,
    nachEngpassFn: ({ datum }) => `Der gemeldete Engpass beginnt, bevor Ihr Vorrat voraussichtlich am ${datum} endet.`,
    hinweis: "Dies ist eine Schätzung basierend auf Ihren eigenen Angaben und berücksichtigt keine Dosisänderungen.",
  },

  apotheke: {
    titel: "Ansicht für die Apotheke",
    untertitel: "Vorzeigen am Tresen zur schnellen Identifikation der Meldung",
    buttonLabel: "Für die Apotheke anzeigen",
    schliessen: "Ansicht schließen",
    hinweis: "Zeigen Sie diese Ansicht oder die Bearbeitungsnummer in der Apotheke vor, um die behördliche Engpassmeldung vorzulegen.",
  },
};

