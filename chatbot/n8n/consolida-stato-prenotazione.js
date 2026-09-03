const wa = String($('WhatsApp Trigger').first().json.messages[0].from || '');
let out = '';
let rawMsg = '';
try { out = String($('Normalizza risposta').first().json.output || $('AI Agent').first().json.output || $('Conferma già fatta').first().json.output || ''); } catch (e) {}
try {
  const trig = $('WhatsApp Trigger').first().json;
  rawMsg = trig.messages[0].type === 'text' ? String(trig.messages[0].text && trig.messages[0].text.body || '') : '';
} catch (e) {}
const data = $getWorkflowStaticData('global');
data.booking = data.booking || {};
data.lastBot = data.lastBot || {};
if (out) data.lastBot[wa] = out.slice(0, 800);
const st = Object.assign({
  servizio: '', giorno: '', ora: '', nome: '', reminder: '', confirmed: false, reminderAsked: false, booked: false, event_id: '', bookedDate: '', ts: Date.now()
}, data.booking[wa] || {});
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const t = norm(out);
const u = norm(rawMsg);
const newIntent = /nuova prenotazione|un'altra prenotazione|altra prenotazione|vorrei (misurare|prenotare|fare)|per mia figlia|per mio figlio|altro servizio/.test(u);
if (newIntent) {
  st.booked = false;
  st.confirmed = false;
  st.reminderAsked = false;
  st.event_id = '';
  st.bookedDate = '';
}
if (/e confermato|confermata|ho prenotato|confermato/.test(t) && !newIntent) {
  st.booked = true;
  st.confirmed = true;
}

// Data dell'appuntamento, da tenere allineata con "Stato prenotazione": la'
// una prenotazione booked SENZA bookedDate viene considerata uno stato vecchio
// e azzerata. Se qui segnassimo booked senza datarla, al messaggio successivo
// la prenotazione appena confermata verrebbe cancellata.
function weekdayRome(offsetDays) {
  const names = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const d = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return names[d.getUTCDay()];
}
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
if (st.booked && !st.bookedDate) st.bookedDate = dateForGiorno(st.giorno) || ymdRome(0);
if (!st.booked) st.bookedDate = '';

st.ts = Date.now();
data.booking[wa] = st;
return [{ json: { wa_id: wa, booking: st } }];
