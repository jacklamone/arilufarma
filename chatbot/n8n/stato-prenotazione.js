let wa = '';
let seenWa = '';
let rawMsg = '';
try {
  const trig = $('WhatsApp Trigger').first().json;
  wa = String(trig.messages[0].from || '');
  const type = String(trig.messages[0].type || 'text');
  rawMsg = type === 'text' ? String(trig.messages[0].text && trig.messages[0].text.body || '') : '';
} catch (e) {}
try {
  seenWa = String($('Cliente gia visto?').first().json.wa_id || '');
} catch (e) {}

const empty = { servizio: '', giorno: '', ora: '', nome: '', reminder: '', confirmed: false, reminderAsked: false, booked: false, event_id: '', bookedDate: '', ts: Date.now() };

function pack(note, st, fastConfirm, fastText) {
  return [{ json: { wa_id: seenWa, bookingLine: note || '', booking: st || empty, fastConfirm: !!fastConfirm, fastText: fastText || '' } }];
}

try {
  const data = $getWorkflowStaticData('global');
  data.booking = data.booking || {};
  data.lastBot = data.lastBot || {};
  const now = Date.now();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  for (const store of [data.booking, data.lastBot]) {
    for (const [k, v] of Object.entries(store)) {
      const ts = v && typeof v === 'object' ? Number(v.ts || 0) : 0;
      if (ts && ts < cutoff) delete store[k];
    }
  }
  const prev = data.booking[wa] || {};

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const cap = (s) => String(s || '').toLowerCase().replace(/(^|\s|')([a-z])/g, (m, a, b) => a + b.toUpperCase());

  const ALIAS = [
    { keys: ['profilo lipidico', 'colesterolo', 'trigliceridi'], label: 'Profilo Lipidico' },
    { keys: ['emoglobina glicata', 'glicata'], label: 'Emoglobina glicata' },
    { keys: ['analisi capelli', 'analisi pelle'], label: 'Analisi capelli e pelle' },
    { keys: ['noleggio tiralatte', 'tiralatte'], label: 'Noleggio tiralatte' },
    { keys: ['preparazioni galeniche', 'preparati galenici'], label: 'Preparazioni galeniche' },
    { keys: ['pressione arteriosa', 'misurazione pressione'], label: 'Pressione arteriosa' },
    { keys: ['foro lobi', 'foro lobo', 'orecchini', 'piercing orecchie'], label: 'Foro lobi + orecchini' },
    { keys: ['spirometria'], label: 'Spirometria' },
    { keys: ['glicemia'], label: 'Glicemia' },
    { keys: ['vitamina d'], label: 'Vitamina D' },
    { keys: ['vitamina b'], label: 'Vitamina B' },
    { keys: ['ferritina'], label: 'Ferritina' },
    { keys: ['consulenza'], label: 'Consulenza' },
    { keys: ['moc'], label: 'MOC' },
  ];
  const catalog = Array.isArray(data.serviziCatalog) ? data.serviziCatalog : [];
  const SERVIZI = [];
  if (catalog.length) {
    for (const r of catalog) {
      const label = String(r.nome || '').trim();
      if (!label) continue;
      const n = norm(label);
      // Un token singolo vale come chiave SOLO se il servizio ha un nome di una
      // parola sola. Da 'Analisi capelli e pelle' usciva la chiave 'pelle', che
      // faceva scattare il servizio su 'crema per pelle sensibile' (8 settembre,
      // esecuzione 72013). I nomi composti restano raggiungibili per nome intero
      // o tramite gli alias.
      const parole = n.split(/[^a-z0-9]+/).filter(Boolean);
      const keys = [n];
      if (parole.length === 1 && parole[0].length >= 4) keys.push(parole[0]);
      if (r.alias) {
        for (const a of String(r.alias).split(/[,;|/]+/).map(norm).filter(Boolean)) {
          if (!keys.includes(a)) keys.push(a);
        }
      }
      const alias = ALIAS.find((a) => norm(a.label) === n || a.keys.some((k) => n.includes(k)));
      if (alias) for (const k of alias.keys) if (!keys.includes(k)) keys.push(k);
      SERVIZI.push({ keys, label });
    }
  } else {
    SERVIZI.push(...ALIAS);
  }

  function findServizio(text) {
    const t = norm(text);
    if (!t) return '';
    if (/\bprofili\b/.test(t) && !/lipidic|colesterol|triglicer/.test(t)) return '';
    if (/che servizio|quale servizio|servizio da prenotare|quali servizi/.test(t)) return '';
    for (const s of SERVIZI) if (s.keys.some((k) => t.includes(k))) return s.label;
    return '';
  }
  function weekdayRome(offsetDays) {
    const names = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const d = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)));
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return names[d.getUTCDay()];
  }
  function findGiorno(text) {
    const t = norm(text);
    if (/lunedi.?venerdi|orari|siamo aperti/.test(t)) return '';
    if (/\boggi\b/.test(t)) return weekdayRome(0);
    if (/\bdomani\b/.test(t)) return weekdayRome(1);
    const days = [['lunedi','lunedì'],['martedi','martedì'],['mercoledi','mercoledì'],['giovedi','giovedì'],['venerdi','venerdì'],['sabato','sabato'],['domenica','domenica']];
    for (const [n, l] of days) if (t.includes(n)) return l;
    return '';
  }
  function findOra(text) {
    const t = norm(text);
    if (/siamo aperti|orari|lunedi.?venerdi/.test(t)) return '';
    // Un numero fra 7 e 20 non basta da solo: "per mia figlia di 9 anni" non e'
    // le 09:00. Si scandiscono tutti i numeri del messaggio e si scarta quello
    // che ha davanti un'eta' ("di 9 anni") o dietro un'unita' che non e' un
    // orario (anni, persone, euro, gocce...); il primo che sopravvive vince.
    const re = /\b(?:alle?\s+)?(\d{1,2})(?:[:\.](\d{2}))?\b/g;
    let m;
    while ((m = re.exec(t))) {
      const h = Number(m[1]);
      if (h < 7 || h > 20) continue;
      const before = t.slice(Math.max(0, m.index - 12), m.index);
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 12);
      if (/\b(di|ho|ha|abbiamo|hanno|compi[eo])\s*$/.test(before)) continue;
      if (/^\s*(anni|anno|persone|volte|mesi|giorni|euro|kg|chili|cm|gradi|compresse|gocce|ml|mg)\b/.test(after)) continue;
      // '14,90 euro' non sono le 14:00: un numero con decimali e un prezzo
      // (8 settembre, esecuzione 72009).
      if (/^\s*[,.]\d/.test(after)) continue;
      return String(h).padStart(2, '0') + ':' + (m[2] || '00');
    }
    return '';
  }
  function findName(text) {
    const raw = String(text || '').trim();
    const t = norm(raw);
    if (!t || /[?:;,]/.test(raw)) return null;
    if (/^(si|sì|no|ok|cok|k|ciao|buonasera|buongiorno|buon pomeriggio|grazie|prego|perfetto|certo|va bene|confermo)$/.test(t)) return null;
    if (/oggi|domani|detto|preferisco|libero|non sabato/.test(t)) return null;
    // "Mi ricorda gli appuntamenti" (senza punto interrogativo) passava tutti i
    // controlli e finiva registrato come nome del cliente: "Ricorda Gli
    // Appuntamenti" (osservato in produzione l'8 settembre, esecuzione 71475).
    if (/grazie|prego|reminder|promemoria|conferma|va bene|prenot|servizio|glicem|sabato|alle |figlia|figlio|ricord|appuntament|agenda|elenco|quale|quali|ritiro|scusi/.test(t) && !/cognome|profili|mi chiamo/.test(t)) return null;
    const parts = raw.split(/\s+/).filter((p) => !/^(il|mio|cognome|è|e|mi|chiamo)$/i.test(p));
    // Frasi comuni di due-tre parole, tutte lettere, non sono automaticamente
    // un nome: "buona giornata", "come va" passavano il resto dei controlli e
    // venivano registrate come nome del cliente. Si scarta la frase se
    // contiene una di queste parole molto comuni, che non sono mai un nome o
    // un cognome reale.
    const NON_NAME_WORDS = new Set(['buona','buon','buonissima','giornata','serata','settimana','nottata','notte','bene','tutto','niente','presto','subito','chiaro','scusi','scusa','dai','ecco','come','va','cosa','ancora','molto','davvero','veramente']);
    if (parts.some((p) => NON_NAME_WORDS.has(norm(p)))) return null;
    if (/\bprofili\b/.test(t) || /cognome|mi chiamo/.test(t)) {
      if (parts.length >= 2) return parts.map(cap).join(' ');
      return cap(parts[parts.length - 1] || '');
    }
    if (parts.length >= 2 && parts.length <= 3 && /^[a-zA-ZÀ-ÿ' ]+$/.test(raw) && !findServizio(raw) && !findGiorno(raw)) {
      return parts.map(cap).join(' ');
    }
    return null;
  }

  const clientTexts = rawMsg ? [rawMsg] : [];
  const botTexts = data.lastBot[wa] ? [String(data.lastBot[wa])] : [];
  const lastUser = norm(rawMsg);
  const newIntent = /nuova prenotazione|un'altra prenotazione|altra prenotazione|vorrei (misurare|prenotare|fare)|per mia figlia|per mio figlio|altro servizio|un altro appuntamento/.test(lastUser);
  const ack = /^(si|sì|ok|cok|k|va bene|confermo|perfetto|certo)$/.test(lastUser);
  const isGreeting = /^(ciao|salve|buongiorno|buonasera|buon pomeriggio|hey|ehi|hello|hola)([\s!.]*)?$/.test(lastUser);

  const st = {
    servizio: prev.servizio || '',
    giorno: prev.giorno || '',
    ora: prev.ora || '',
    // Il filtro vale anche sul nome GIA' salvato: uno stato sporco da una
    // conversazione precedente ("Ricorda Gli Appuntamenti", 8 settembre) va
    // scartato alla rilettura, non solo bloccato in ingresso.
    nome: prev.nome && String(prev.nome).length <= 40 && !/grazie|prego|sì grazie|ho detto|oggi|ricord|appuntament|agenda|elenco|prenotazion|ritiro/i.test(String(prev.nome)) ? prev.nome : '',
    reminder: prev.reminder || '',
    confirmed: !!prev.confirmed,
    reminderAsked: !!prev.reminderAsked,
    booked: !!prev.booked || !!prev.event_id,
    event_id: prev.event_id || '',
    bookedDate: prev.bookedDate || '',
    ts: now,
  };

  // Una prenotazione salvata non puo' restare valida per sempre: finche' resta
  // booked il blocco di estrazione piu' sotto non aggiorna i campi, e la
  // conversazione resta congelata su quella prenotazione qualunque cosa scriva
  // il cliente. Scade da sola quando il giorno dell'appuntamento e' passato.
  // Gli stati salvati prima che esistesse bookedDate non sono databili: si
  // azzerano al primo messaggio utile.
  function ymdRome(offsetDays) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const d = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)));
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
  function dateForGiorno(giorno) {
    for (let i = 0; i <= 6; i++) if (weekdayRome(i) === giorno) return ymdRome(i);
    return '';
  }
  function clearBooking() {
    st.servizio = '';
    st.giorno = '';
    st.ora = '';
    st.nome = '';
    st.reminder = '';
    st.confirmed = false;
    st.reminderAsked = false;
    st.booked = false;
    st.event_id = '';
    st.bookedDate = '';
  }
  if (st.booked && (!st.bookedDate || st.bookedDate < ymdRome(0))) clearBooking();

  // Uno stato "prenotato" senza NESSUN campo compilato non e' una prenotazione:
  // e' uno stato sporco. Finche' resta booked blocca la raccolta dei campi piu'
  // sotto, e la nota iniettata diventa "[PRENOTAZIONE GIA' SALVATA: .]" — dice
  // all'agente che una prenotazione esiste ma non gli dice quale, e l'agente
  // tergiversa invece di rispondere (osservato in produzione il 7 settembre,
  // esecuzioni 70727/70731/70735/70739). Meglio nessuna prenotazione che una
  // prenotazione vuota.
  function statoVuoto() {
    return !st.servizio && !st.giorno && !st.ora && !st.nome && !st.event_id;
  }
  if (st.booked && statoVuoto()) clearBooking();

  if (/\boggi\b/.test(lastUser)) {
    st.giorno = weekdayRome(0);
    st.booked = false;
  } else if (/\bdomani\b/.test(lastUser)) {
    st.giorno = weekdayRome(1);
    st.booked = false;
  }

  const incomingServizio = rawMsg ? findServizio(rawMsg) : '';
  let freshBooking = false;
  if (incomingServizio && incomingServizio !== st.servizio && !ack && !isGreeting) {
    st.servizio = incomingServizio;
    st.giorno = '';
    st.ora = '';
    st.reminder = '';
    st.confirmed = false;
    st.reminderAsked = false;
    st.booked = false;
    st.event_id = '';
    freshBooking = true;
  } else if (newIntent) {
    st.confirmed = false;
    st.reminderAsked = false;
    st.booked = false;
    st.reminder = '';
    st.event_id = '';
    if (incomingServizio) st.servizio = incomingServizio;
    freshBooking = true;
  }
  if (/\boggi\b/.test(lastUser)) st.giorno = weekdayRome(0);
  if (/\bdomani\b/.test(lastUser)) st.giorno = weekdayRome(1);

  // Quando la prenotazione e' gia' salvata non si ri-estraggono i campi dal
  // testo: si conserva lo stato cosi' com'e'.
  //
  // Quando invece parte una prenotazione NUOVA (cambio servizio o intento
  // esplicito), l'ultimo messaggio del bot appartiene ancora alla prenotazione
  // VECCHIA appena chiusa: se citava un giorno o un'ora, contaminerebbe quella
  // nuova. In quel caso si legge solo cio' che il cliente ha scritto ORA.
  //
  // E l'ultimo messaggio del bot va letto SOLO se era una proposta di
  // appuntamento. Se era l'ELENCO delle prenotazioni gia' esistenti, i
  // servizi, i giorni e gli orari che contiene non sono una richiesta del
  // cliente: leggerli significa inventare una prenotazione mai chiesta
  // (8 settembre, esecuzioni 71345 e 71349).
  function sembraElenco(t) {
    if (!t) return false;
    if (/(ha queste prenotazioni|le sue prenotazioni|ecco le sue|risultano queste|le risultano|ha prenotato:)/.test(t)) return true;
    const giorni = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    if (giorni.filter((g) => t.indexOf(g) !== -1).length >= 2) return true;
    return new Set(t.match(/\b\d{1,2}[:.]\d{2}\b/g) || []).size >= 3;
  }
  const ultimoBot = norm(botTexts[botTexts.length - 1] || '');
  const botElenco = sembraElenco(ultimoBot);

  // L'ultimo messaggio del bot si legge SOLO se e' davvero una PROPOSTA di
  // appuntamento: deve contenere un giorno o un orario esplicito insieme a una
  // parola che indica la proposta. Una risposta di listino non lo e', e finiva
  // per riempire lo stato di dati falsi: la conversazione sulle creme dell'8
  // settembre (esecuzioni 72004-72036, nessuna prenotazione chiesta) aveva
  // prodotto servizio 'Analisi capelli e pelle' e ora '14:00', quest'ultima
  // dal prezzo '14,90 euro'.
  function sembraProposta(t) {
    if (!t) return false;
    const haOrario = /\b\d{1,2}[:.]\d{2}\b|\balle \d{1,2}\b/.test(t);
    const haGiorno = /(lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica|domani|oggi)/.test(t);
    const haProposta = /(propon|le propongo|disponibil|va bene|slot|libero|liberi|posso fissare|fissiamo|prenot|appuntament|conferm)/.test(t);
    return (haOrario || haGiorno) && haProposta;
  }
  const botProposta = sembraProposta(ultimoBot);

  if (!(st.booked && !newIntent)) {
    const textsToScan = (freshBooking || botElenco || !botProposta) ? clientTexts : botTexts.concat(clientTexts);
    for (const text of textsToScan) {
      const sv = findServizio(text);
      if (sv && !st.servizio) st.servizio = sv;
      const g = findGiorno(text); if (g) st.giorno = g;
      const o = findOra(text); if (o) st.ora = o;
    }
    // Il nome si raccoglie SOLO quando il bot lo ha appena chiesto, o quando il
    // cliente si presenta da solo. Senza questo vincolo qualunque frase di due
    // o tre parole diventava un nome: 'Cerchi inci preciso' era finito nello
    // stato come nome del cliente (8 settembre, esecuzione 72036).
    const botHaChiestoNome = /nome e cognome|il suo nome|a che nome|come si chiama|mi dice il nome/.test(ultimoBot);
    const siPresenta = /(mi chiamo|sono io|il mio nome|il mio cognome|cognome)/.test(lastUser);
    if (botHaChiestoNome || siPresenta) {
      for (const text of clientTexts) {
        const nm = findName(text);
        if (nm && nm.length <= 40) st.nome = nm;
      }
    }
  }
  if (/\boggi\b/.test(lastUser)) st.giorno = weekdayRome(0);
  if (/\bdomani\b/.test(lastUser)) st.giorno = weekdayRome(1);

  const lastBot = ultimoBot;
  const yes = ack;
  const no = /^(no)$/.test(lastUser);
  if (/promemoria/.test(lastBot)) st.reminderAsked = true;
  if (/conferma che va bene|va bene cosi/.test(lastBot) && yes) st.confirmed = true;
  if (/promemoria/.test(lastBot) && yes) { st.confirmed = true; st.reminder = 'si'; st.reminderAsked = true; }
  if (/promemoria/.test(lastBot) && no) { st.confirmed = true; st.reminder = 'no'; st.reminderAsked = true; }
  // vedi nota in 'Consolida stato prenotazione': "va confermato in sede" non
  // e' una conferma di prenotazione.
  const bookedDaBot = /(ho prenotato|ho fissato|abbiamo fissato|prenotazione (e |ha |risulta )?confermat|appuntamento (e |ha |risulta )?confermat|ritiro (e |ha |risulta )?confermat|confermat[oa] per (luned|marted|mercoled|gioved|venerd|sabato|domenica|domani|oggi|il |l')|confermat[oa] ✅|e confermato ✅)/.test(lastBot) && !/(va confermat|vanno confermat|da confermar|deve essere confermat|confermat[oa] in sede|confermat[oa] in negozio|confermat[oa] al telefono|confermat[oa] direttamente)/.test(lastBot);
  if (!st.booked && bookedDaBot) st.booked = true;

  const readyToBook = !!(st.servizio && st.giorno && st.ora && st.nome && (st.reminderAsked || st.confirmed));
  if (!st.booked && readyToBook && yes) st.confirmed = true;

  const asksConfirm = /(e|gia)\s+confermat|confermato\s*\?|gia prenot|appuntamento (e |gia )?conferm|ok e confermat/.test(lastUser);
  const lastWasConfirm = bookedDaBot;
  if (!newIntent && lastWasConfirm) {
    st.booked = true;
    st.confirmed = true;
  }

  // Data dell'appuntamento, cosi' la prenotazione sa quando scadere. Se il
  // giorno non e' noto vale oggi: scade stasera invece di restare per sempre.
  if (st.booked && !st.bookedDate) st.bookedDate = dateForGiorno(st.giorno) || ymdRome(0);
  if (!st.booked) st.bookedDate = '';

  data.booking[wa] = st;

  // AGENDA REALE, letta dal nodo 'Leggi Prenotazioni cliente' sul foglio
  // Prenotazioni del gestionale, filtrata sul numero di chi sta scrivendo.
  // E' la fonte di verita': lo stato tenuto in memoria qui sopra serve solo a
  // seguire la conversazione in corso, e se si sporca (7 settembre) il cliente
  // deve comunque ricevere la risposta giusta. Il foglio restituisce wa_id
  // come NUMERO, non come testo: il confronto va fatto su String().
  let agenda = [];
  let agendaLetta = false;
  try {
    const righe = $('Leggi Prenotazioni cliente').all().map((i) => (i && i.json) || {});
    agendaLetta = !righe.some((r) => r && r.error);
    // Mezz'ora di tolleranza: un appuntamento appena iniziato va ancora
    // mostrato a chi scrive "sto arrivando".
    const soglia = Date.now() - 30 * 60 * 1000;
    agenda = righe
      .filter((r) => String(r.wa_id || '') === wa)
      .filter((r) => String(r.stato || '').toLowerCase().indexOf('annullat') === -1)
      .filter((r) => {
        const t = Date.parse(String(r.inizio || ''));
        return !isNaN(t) && t >= soglia;
      })
      .sort((a, b) => String(a.inizio).localeCompare(String(b.inizio)));
  } catch (e) {
    agendaLetta = false;
  }

  // Il foglio Prenotazioni tiene solo il tipo generico ("Ritiro prodotto"): il
  // dettaglio — QUALE prodotto — sta nella descrizione dell'evento di
  // calendario ("Ritiro prodotto: Oral-B Pro 3. Cliente: Luciano Fratelli.").
  // Si abbina rigorosamente per event_id, mai per titolo: cosi' non si puo'
  // finire a leggere l'evento di un altro cliente. Il nodo che legge il
  // calendario costa circa 7 secondi, quindi gira solo quando il cliente sta
  // parlando dei suoi appuntamenti: se non ha girato, questa mappa resta vuota
  // e la nota esce senza dettaglio.
  let descrizioneEvento = {};
  try {
    for (const it of $('Leggi eventi calendario').all()) {
      const e = (it && it.json) || {};
      if (e.id) descrizioneEvento[String(e.id)] = String(e.description || '');
    }
  } catch (e) {}

  // Si prende solo cio' che segue i due punti a inizio descrizione: e' la forma
  // con cui il bot scrive il dettaglio. "Misurazione glicemia." o "Profilo
  // lipidico per Lucio Fabri." non hanno due punti e non producono rumore.
  function dettaglioDaCalendario(eventId, tipo) {
    const d = String(descrizioneEvento[String(eventId || '')] || '').trim();
    if (!d) return '';
    const m = d.match(/^[^:.]{0,40}:\s*([^.]{2,80})/);
    if (!m) return '';
    const testo = m[1].trim().replace(/[,;\s]+$/, '');
    if (!testo || /^cliente\b/i.test(testo)) return '';
    if (norm(testo) === norm(tipo)) return '';
    return testo;
  }

  function fmtAppuntamento(iso) {
    const gg = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
    const mm = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
      const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
      const ore = p.hour === '24' ? '00' : p.hour;
      return gg[wd] + ' ' + Number(p.day) + ' ' + mm[Number(p.month) - 1] + ' alle ' + ore + ':' + p.minute;
    } catch (e) {
      return String(iso);
    }
  }

  // Senza NESSUN campo noto la risposta rapida sarebbe «Sì, è confermato ✅ .»:
  // una conferma vuota. In quel caso si lascia rispondere l'agente.
  const dettagliSalvati = [st.servizio, st.giorno, st.ora, st.nome].filter(Boolean).join(', ');

  // Con PIU' di un appuntamento futuro la risposta rapida non puo' sapere a
  // quale si riferisce "e confermato?": sceglierebbe il primo e potrebbe
  // nominare quello sbagliato. In quel caso risponde l'agente, che ha la
  // lista completa nella nota.
  const nomeUtile = (n) => {
    const s = String(n || '').trim();
    return s && !/^\[|non disponibile/i.test(s) ? s : '';
  };
  const fastConfirm = !newIntent && !isGreeting && asksConfirm && (agenda.length === 1 || (agenda.length === 0 && !!st.booked && !!dettagliSalvati));
  // Quando il gestionale ha la riga, la conferma rapida si costruisce da
  // quella e non dallo stato in memoria.
  const fastText = !fastConfirm
    ? ''
    : agenda.length === 1
      ? ('Sì, è confermato ✅\n' + [String(agenda[0].tipo || 'Appuntamento'), nomeUtile(agenda[0].nome) && ('per ' + nomeUtile(agenda[0].nome)), fmtAppuntamento(agenda[0].inizio)].filter(Boolean).join(' ') + '.')
    : ('Sì, è confermato ✅\n' + [st.servizio, st.nome && ('per ' + st.nome), st.giorno, st.ora && ('alle ' + st.ora)].filter(Boolean).join(' ') + '.');

  // La decisione sul promemoria va SEMPRE riportata all'agente, altrimenti
  // continua a richiederla a ogni messaggio (il prompt gli impone di chiederla
  // prima di salvare) e la conversazione entra in un ciclo: il cliente
  // risponde, lo stato registra la risposta, ma l'agente non la vede.
  const remNote = st.reminder
    ? ('Promemoria GIÀ deciso dal cliente: ' + st.reminder + '. NON richiederlo: salva con Promemoria=' + st.reminder + '.')
    : (st.reminderAsked ? 'Promemoria già chiesto: attendi la risposta, non richiederlo.' : '');

  // Secondo controllo dello stato vuoto: booked puo' essere stato riacceso piu'
  // sopra (bookedDaBot, conferma del cliente) senza che i campi siano noti. Una
  // nota "GIA' SALVATA" senza dettagli e' peggio di nessuna nota: si ricade sul
  // ramo generico, che chiede i campi mancanti invece di dire al modello che
  // esiste una prenotazione di cui non sa nulla.
  let note = '';
  if ((st.booked || st.event_id) && !newIntent && dettagliSalvati) {
    if (isGreeting) {
      note = ' [PRENOTAZIONE GIÀ SALVATA in background: ' + dettagliSalvati + '. Il cliente sta SOLO salutando. Rispondi con un saluto breve e «Come posso aiutarla?». NON ripetere la conferma. NON creare eventi.]';
    } else {
      note = ' [PRENOTAZIONE GIÀ SALVATA: ' + dettagliSalvati + '. Se il cliente chiede QUALSIASI cosa sulla sua prenotazione (cosa ha prenotato, quando, a che ora, se è confermata, se ha il promemoria), la tua PRIMA risposta deve già contenere servizio, giorno e ora scritti qui sopra: è VIETATO rispondere «posso verificare» o rimandare al messaggio dopo. Vietato citare altri clienti del calendario. VIETATO creare un secondo evento.]';
    }
  } else if (readyToBook && yes) {
    note = ' [PRENOTAZIONE DA CONFERMARE: ' + [st.servizio, st.giorno, st.ora, st.nome].filter(Boolean).join(', ') + '. ' + (remNote ? remNote + ' ' : '') + 'Controlla_disponibilita prima. Se esiste già un evento con STESSO nome e orario, non crearne un altro.]';
  } else {
    const known = [];
    if (st.servizio) known.push(st.servizio);
    if (st.giorno) known.push(st.giorno);
    if (st.ora) known.push(st.ora);
    if (st.nome) known.push(st.nome);
    const bits = [];
    if (known.length) bits.push('campi già detti: ' + known.join(', ') + '. Non ririchiederli.');
    if (remNote) bits.push(remNote);
    if (!st.nome && st.servizio && st.giorno && st.ora) bits.push('Manca nome e cognome.');
    // Con tutti i campi noti ma promemoria non ancora chiesto, l'agente a
    // volte salta la domanda e prenota subito (osservato in produzione:
    // stesso stato, stessa nota, in un caso ha chiesto il promemoria e
    // nell'altro no). La nota deve imporlo esplicitamente, non bastare
    // sull'istruzione generica nel system prompt.
    if (!remNote && st.servizio && st.giorno && st.ora && st.nome) {
      bits.push('Tutti i dati sono completi: prima di salvare o chiedere conferma, chiedi ORA se vuole il promemoria WhatsApp il giorno prima (sì/no). Vietato salvare senza aver chiesto il promemoria.');
    }
    bits.push('Se ha detto OGGI il giorno è oggi, non sabato. Vietato citare nomi di altri clienti letti dal calendario.');
    note = ' [PRENOTAZIONE: ' + bits.join(' ') + ']';
  }

  // La nota lunga con l'istruzione esplicita parte SOLO quando il cliente sta
  // davvero chiedendo dei suoi appuntamenti: ripetere un blocco fisso in ogni
  // messaggio riempie la finestra di memoria della conversazione (Round 13).
  // Vale anche per le domande di SEGUITO: dopo che il bot ha elencato le
  // prenotazioni, "a che nome?" o "quale?" riguardano ancora quell'elenco.
  const chiedeAgenda = /(mi ricord|cosa ho prenotat|che ho prenotat|quando ho|a che ora|a che nome|ho (un |qualche )?appuntament|miei appuntament|mia prenotazion|mie prenotazion|prenoarzion|promemoria|e confermat|gia prenotat|quando devo venire|quando vengo|ricordarmi)/.test(lastUser)
    || (botElenco && /\?/.test(String(rawMsg || '')));

  let agendaNote = '';
  if (agendaLetta && agenda.length) {
    // Se il cliente NON sta chiedendo dell'agenda basta il prossimo
    // appuntamento: serve solo a non riprenotare la stessa cosa. Ripetere
    // l'elenco intero in ogni messaggio riempirebbe la memoria per niente.
    const quanti = chiedeAgenda ? 5 : 1;
    const voci = agenda.slice(0, quanti).map((r) => {
      const nm = nomeUtile(r.nome);
      const tipo = String(r.tipo || 'appuntamento');
      const dett = dettaglioDaCalendario(r.event_id, tipo);
      return [dett ? tipo + ' (' + dett + ')' : tipo, fmtAppuntamento(r.inizio), nm ? 'a nome ' + nm : ''].filter(Boolean).join(' ');
    });
    agendaNote = ' [AGENDA DI QUESTO CLIENTE, letta ORA dal gestionale (dato certo, riguarda solo lui): ' + voci.join(' | ') + '.';
    agendaNote += chiedeAgenda
      ? ' Sta chiedendo proprio questo: rispondi SUBITO indicando servizio, giorno e ora di TUTTI quelli elencati. VIETATO rispondere «posso verificare», «se vuole controllo» o rimandare al messaggio dopo.]'
      : (agenda.length > 1 ? ' (e altri ' + (agenda.length - 1) + ').' : '') + ' Non ricrearli in calendario e non citarli se non serve.]';
  } else if (agendaLetta && chiedeAgenda) {
    agendaNote = ' [AGENDA DI QUESTO CLIENTE, letta ORA dal gestionale: nessun appuntamento futuro a questo numero. Dillo con chiarezza e offri di prenotarne uno: non inventare appuntamenti e non dire che devi verificare.]';
  }

  return pack(note + agendaNote, st, fastConfirm, fastText);
} catch (e) {
  return pack('', empty, false, '');
}
