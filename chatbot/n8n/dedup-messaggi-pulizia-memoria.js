const wa = String($('WhatsApp Trigger').first().json.messages[0].from || '');
const data = $getWorkflowStaticData('global');
data.known = data.known || {};
data.booking = data.booking || {};
data.lastBot = data.lastBot || {};
data.lastWamid = data.lastWamid || {};

// Il vecchio mutex (data.locks) e' stato rimosso: $getWorkflowStaticData viene
// persistito solo a fine esecuzione e non e' atomico fra esecuzioni concorrenti,
// quindi due messaggi simultanei leggevano entrambi "lock libero". Non
// serializzava nulla: aggiungeva solo latenza e, col ciclo di attesa, bruciava
// slot di esecuzione. Restano la deduplica dei messaggi e la manutenzione.
delete data.locks;

const now = Date.now();
const cutoff = now - 7 * 24 * 60 * 60 * 1000;
for (const [k, v] of Object.entries(data.booking)) {
  const ts = v && typeof v === 'object' ? Number(v.ts || 0) : 0;
  if (!ts || ts < cutoff) delete data.booking[k];
}
for (const k of Object.keys(data.lastBot)) {
  if (!data.booking[k]) delete data.lastBot[k];
}

let wamid = '';
try { wamid = String($('WhatsApp Trigger').first().json.messages[0].id || ''); } catch (e) {}
const dup = !!(wamid && data.lastWamid[wa] === wamid);
if (wamid) data.lastWamid[wa] = wamid;
return [{ json: { wa_id: wa, duplicate: dup } }];
