// NODO "Stato prenotazione" — versione del 9 settembre 2026.
//
// COSA FA E COSA NON FA PIÙ.
//
// Fino all'8 settembre questo nodo cercava di capire, leggendo il testo con
// espressioni regolari, QUALE servizio, QUALE giorno, QUALE ora e QUALE nome
// il cliente avesse detto, e passava il risultato all'agente come dato certo
// ("campi già detti: Spirometria, martedì, 15:00"). Sei guasti su dodici della
// bonifica di settembre nascevano da lì, e l'ultimo era il peggiore: l'8
// settembre alle 22:20 il cliente ha chiesto "martedì prossimo alle 10", il bot
// ha risposto "martedì 15 settembre alle 10:00", il nodo ha riletto la frase
// del bot, ha scambiato il 15 di "15 settembre" per un orario e ha fatto
// salvare l'appuntamento alle 15:00 (esecuzioni 72505, 72510 e 72514). Con un
// giorno del mese fra 7 e 20 il guasto si ripeteva sistematicamente.
//
// Da oggi la deduzione non c'è più. Il modello ha in memoria gli ultimi 12
// messaggi: sa già cosa ha detto il cliente, non serve che il codice glielo
// ripeta, e soprattutto non serve che glielo ripeta SBAGLIATO. Il codice fa
// solo quello che il modello non può fare: leggere il gestionale.
//
// Restano quindi tre sole cose:
//   1. l'agenda REALE del cliente, letta dal foglio Prenotazioni per numero
//      WhatsApp, con il dettaglio del prodotto preso dalla descrizione
//      dell'evento di calendario abbinato per event_id;
//   2. la decisione sul promemoria: non è un'estrazione di dati, è la
//      registrazione di un sì/no dato in risposta a una domanda precisa. Serve
//      perché altrimenti l'agente la richiede a ogni messaggio;
//   3. la pulizia dello stato vecchio in memoria.
//
// Le regole "verifica la disponibilità prima di fissare", "non creare un
// secondo evento uguale" e "non citare i nomi degli altri clienti letti dal
// calendario" non stanno più in questa nota: sono passate nelle descrizioni
// degli strumenti Prenota_appuntamento e Controlla_disponibilita, dove valgono
// sempre e non consumano la finestra di memoria a ogni messaggio.
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

// I campi servizio/giorno/ora/nome restano nella forma dell'oggetto solo perché
// il nodo "Consolida stato prenotazione" e il reset del numero di test si
// aspettano quella struttura. Da oggi restano sempre vuoti: nessuno li scrive.
// fastConfirm e fastText non sono letti da nessun nodo (verificato sull'export
// del 9 settembre): restano a valore fisso per non cambiare la forma dell'uscita.
function pack(note, st) {
  return [{ json: { wa_id: seenWa, bookingLine: note || '', booking: st || empty, fastConfirm: false, fastText: '' } }];
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

  const lastUser = norm(rawMsg);
  const lastBot = norm(data.lastBot[wa] || '');
  const ack = /^(si|si grazie|ok|cok|k|va bene|confermo|perfetto|certo)$/.test(lastUser);
  const no = /^(no|no grazie)$/.test(lastUser);
  const newIntent = /nuova prenotazione|un'altra prenotazione|altra prenotazione|vorrei (misurare|prenotare|fare)|per mia figlia|per mio figlio|altro servizio|un altro appuntamento/.test(lastUser);

  const st = {
    servizio: '',
    giorno: '',
    ora: '',
    nome: '',
    reminder: prev.reminder || '',
    confirmed: !!prev.confirmed,
    reminderAsked: !!prev.reminderAsked,
    booked: !!prev.booked || !!prev.event_id,
    event_id: prev.event_id || '',
    bookedDate: prev.bookedDate || '',
    ts: now,
  };

  // Una nuova prenotazione azzera la decisione sul promemoria: quella vecchia
  // riguardava l'appuntamento precedente.
  if (newIntent) {
    st.reminder = '';
    st.reminderAsked = false;
    st.confirmed = false;
    st.booked = false;
    st.event_id = '';
    st.bookedDate = '';
  }

  // La domanda sul promemoria si riconosce dal punto interrogativo vicino alla
  // parola: "Vuole il promemoria WhatsApp il giorno prima?" è una domanda,
  // "Promemoria WhatsApp attivo ✅" è una conferma, e un "ok" del cliente dopo
  // la seconda non è una risposta.
  const botHaChiestoPromemoria = /promemoria[^?]{0,80}\?/.test(lastBot);
  if (botHaChiestoPromemoria) {
    st.reminderAsked = true;
    if (ack) st.reminder = 'si';
    if (no) st.reminder = 'no';
  }

  data.booking[wa] = st;

  // AGENDA REALE, letta dal nodo 'Leggi Prenotazioni cliente' sul foglio
  // Prenotazioni del gestionale, filtrata sul numero di chi sta scrivendo.
  // È la fonte di verità. Il foglio restituisce wa_id come NUMERO, non come
  // testo: il confronto va fatto su String().
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
  // Si abbina rigorosamente per event_id, mai per titolo: così non si può
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

  // Si prende solo ciò che segue i due punti a inizio descrizione: è la forma
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

  const nomeUtile = (n) => {
    const s = String(n || '').trim();
    return s && !/^\[|non disponibile/i.test(s) ? s : '';
  };

  // La decisione sul promemoria va SEMPRE riportata all'agente, altrimenti
  // continua a richiederla a ogni messaggio (il prompt gli impone di chiederla
  // prima di salvare) e la conversazione entra in un ciclo: il cliente
  // risponde, lo stato registra la risposta, ma l'agente non la vede.
  //
  // Serve solo finché la prenotazione è in corso. Quando il bot ha davvero
  // confermato, il nodo 'Consolida stato prenotazione' mette booked a true:
  // da lì in poi la nota non ha più niente da dire e ripeterla a ogni
  // messaggio consumerebbe la finestra di memoria per niente.
  const remNote = st.booked
    ? ''
    : st.reminder
      ? (' [PROMEMORIA: il cliente ha GIÀ risposto ' + st.reminder + '. Non richiederlo: salva con Promemoria=' + st.reminder + '.]')
      : (st.reminderAsked ? ' [PROMEMORIA: già chiesto, attendi la risposta del cliente. Non richiederlo.]' : '');

  // La nota lunga con l'istruzione esplicita parte SOLO quando il cliente sta
  // davvero chiedendo dei suoi appuntamenti: ripetere un blocco fisso in ogni
  // messaggio riempie la finestra di memoria della conversazione (Round 13).
  const chiedeAgenda = /(mi ricord|cosa ho prenotat|che ho prenotat|quando ho|a che ora|a che nome|ho (un |qualche )?appuntament|miei appuntament|mia prenotazion|mie prenotazion|prenoarzion|promemoria|e confermat|gia prenotat|quando devo venire|quando vengo|ricordarmi)/.test(lastUser);

  // Gli identificativi degli eventi si mettono nella nota SOLO quando il
  // cliente sta chiedendo di annullare o spostare qualcosa. È l'unico modo che
  // ha il modello di ottenere un event_id: Controlla_disponibilita non ne
  // restituisce più (9 settembre), e questi vengono dalle righe del foglio già
  // filtrate sul numero di chi scrive. Così per toccare l'appuntamento di un
  // altro cliente il modello dovrebbe indovinarne l'identificativo.
  const chiedeModifica = /(annull|cancell|disdi|spost|rimand|posticip|anticip|cambiare (giorno|ora|orario)|un altro giorno|un'altra ora)/.test(lastUser);

  let agendaNote = '';
  if (agendaLetta && agenda.length) {
    // Se il cliente NON sta chiedendo dell'agenda basta il prossimo
    // appuntamento: serve solo a non riprenotare la stessa cosa. Ripetere
    // l'elenco intero in ogni messaggio riempirebbe la memoria per niente.
    const quanti = (chiedeAgenda || chiedeModifica) ? 5 : 1;
    const voci = agenda.slice(0, quanti).map((r) => {
      const nm = nomeUtile(r.nome);
      const tipo = String(r.tipo || 'appuntamento');
      const dett = dettaglioDaCalendario(r.event_id, tipo);
      const id = chiedeModifica && r.event_id ? 'EventId=' + String(r.event_id) : '';
      return [dett ? tipo + ' (' + dett + ')' : tipo, fmtAppuntamento(r.inizio), nm ? 'a nome ' + nm : '', id].filter(Boolean).join(' ');
    });
    agendaNote = ' [AGENDA DI QUESTO CLIENTE, letta ORA dal gestionale (dato certo, riguarda solo lui): ' + voci.join(' | ') + '.';
    if (chiedeModifica) {
      agendaNote += ' Gli EventId qui sopra sono gli UNICI che puoi usare per annullare o spostare: non prenderli da nessun altro strumento e non scriverli MAI in un messaggio al cliente. Se quello che il cliente descrive non compare in questo elenco, non è suo: non toccarlo e invitalo a chiamare la parafarmacia.';
    }
    agendaNote += chiedeAgenda
      ? ' Sta chiedendo proprio questo: rispondi SUBITO indicando servizio, giorno e ora di TUTTI quelli elencati. VIETATO rispondere «posso verificare», «se vuole controllo» o rimandare al messaggio dopo.]'
      : (agenda.length > voci.length ? ' (e altri ' + (agenda.length - voci.length) + ').' : '') + ' Non ricrearli in calendario e non citarli se non serve.]';
  } else if (agendaLetta && (chiedeAgenda || chiedeModifica)) {
    agendaNote = ' [AGENDA DI QUESTO CLIENTE, letta ORA dal gestionale: nessun appuntamento futuro a questo numero. Dillo con chiarezza e offri di prenotarne uno: non inventare appuntamenti e non dire che devi verificare.]';
  }

  return pack(remNote + agendaNote, st);
} catch (e) {
  return pack('', empty);
}
