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

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
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
      const keys = [n, ...n.split(/[^a-z0-9]+/).filter((tok) => tok.length >= 4)];
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
    if (/grazie|prego|reminder|promemoria|conferma|va bene|prenot|servizio|glicem|sabato|alle |figlia|figlio/.test(t) && !/cognome|profili|mi chiamo/.test(t)) return null;
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
    nome: prev.nome && String(prev.nome).length <= 40 && !/grazie|prego|sì grazie|ho detto|oggi/i.test(String(prev.nome)) ? prev.nome : '',
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
  // testo: si conserva lo stato cosi' com'e'. (Qui c'era una riscrittura
  // cablata di giorno/ora per un cliente specifico: rimossa.)
  //
  // Quando invece parte una prenotazione NUOVA (cambio servizio o intento
  // esplicito), l'ultimo messaggio del bot appartiene ancora alla prenotazione
  // VECCHIA appena chiusa: se citava un giorno o un'ora, contaminerebbe quella
  // nuova. In quel caso si legge solo cio' che il cliente ha scritto ORA.
  if (!(st.booked && !newIntent)) {
    const textsToScan = freshBooking ? clientTexts : botTexts.concat(clientTexts);
    for (const text of textsToScan) {
      const sv = findServizio(text);
      if (sv && !st.servizio) st.servizio = sv;
      const g = findGiorno(text); if (g) st.giorno = g;
      const o = findOra(text); if (o) st.ora = o;
    }
    for (const text of clientTexts) {
      const nm = findName(text);
      if (nm && nm.length <= 40) st.nome = nm;
    }
  }
  if (/\boggi\b/.test(lastUser)) st.giorno = weekdayRome(0);
  if (/\bdomani\b/.test(lastUser)) st.giorno = weekdayRome(1);

  const lastBot = norm(botTexts[botTexts.length - 1] || '');
  const yes = ack;
  const no = /^(no)$/.test(lastUser);
  if (/promemoria/.test(lastBot)) st.reminderAsked = true;
  if (/conferma che va bene|va bene cosi/.test(lastBot) && yes) st.confirmed = true;
  if (/promemoria/.test(lastBot) && yes) { st.confirmed = true; st.reminder = 'si'; st.reminderAsked = true; }
  if (/promemoria/.test(lastBot) && no) { st.confirmed = true; st.reminder = 'no'; st.reminderAsked = true; }
  if (!st.booked && /e confermato|confermata|ho prenotato/.test(lastBot)) st.booked = true;

  const readyToBook = !!(st.servizio && st.giorno && st.ora && st.nome && (st.reminderAsked || st.confirmed));
  if (!st.booked && readyToBook && yes) st.confirmed = true;

  const asksConfirm = /(e|gia)\s+confermat|confermato\s*\?|gia prenot|appuntamento (e |gia )?conferm|ok e confermat/.test(lastUser);
  const lastWasConfirm = /e confermato|confermata|ho prenotato/.test(lastBot);
  if (!newIntent && lastWasConfirm) {
    st.booked = true;
    st.confirmed = true;
  }

  // Data dell'appuntamento, cosi' la prenotazione sa quando scadere. Se il
  // giorno non e' noto vale oggi: scade stasera invece di restare per sempre.
  if (st.booked && !st.bookedDate) st.bookedDate = dateForGiorno(st.giorno) || ymdRome(0);
  if (!st.booked) st.bookedDate = '';

  data.booking[wa] = st;

  const fastConfirm = !newIntent && !isGreeting && !!st.booked && asksConfirm;
  const fastText = fastConfirm
    ? ('Sì, è confermato ✅\n' + [st.servizio, st.nome && ('per ' + st.nome), st.giorno, st.ora && ('alle ' + st.ora)].filter(Boolean).join(' ') + '.')
    : '';

  // La decisione sul promemoria va SEMPRE riportata all'agente, altrimenti
  // continua a richiederla a ogni messaggio (il prompt gli impone di chiederla
  // prima di salvare) e la conversazione entra in un ciclo: il cliente
  // risponde, lo stato registra la risposta, ma l'agente non la vede.
  const remNote = st.reminder
    ? ('Promemoria GIÀ deciso dal cliente: ' + st.reminder + '. NON richiederlo: salva con Promemoria=' + st.reminder + '.')
    : (st.reminderAsked ? 'Promemoria già chiesto: attendi la risposta, non richiederlo.' : '');

  let note = '';
  if ((st.booked || st.event_id) && !newIntent) {
    if (isGreeting) {
      note = ' [PRENOTAZIONE GIÀ SALVATA in background: ' + [st.servizio, st.giorno, st.ora, st.nome].filter(Boolean).join(', ') + '. Il cliente sta SOLO salutando. Rispondi con un saluto breve e «Come posso aiutarla?». NON ripetere la conferma. NON creare eventi.]';
    } else {
      note = ' [PRENOTAZIONE GIÀ SALVATA: ' + [st.servizio, st.giorno, st.ora, st.nome].filter(Boolean).join(', ') + '. Citala SOLO se chiede conferma. Vietato citare altri clienti del calendario. VIETATO creare un secondo evento.]';
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
    bits.push('Se ha detto OGGI il giorno è oggi, non sabato. Vietato citare nomi di altri clienti letti dal calendario.');
    note = ' [PRENOTAZIONE: ' + bits.join(' ') + ']';
  }

  return pack(note, st, fastConfirm, fastText);
} catch (e) {
  return pack('', empty, false, '');
}

