// Reset periodico (ogni 4h) SOLO del numero di test del titolare, per simulare
// un cliente nuovo a ogni ciclo di test invece di accumulare per sempre lo
// storico di prenotazioni/conversazione di tutte le sessioni di test.
const wa = '393403063950';
const data = $getWorkflowStaticData('global');
let cleared = [];
if (data.booking && data.booking[wa]) { delete data.booking[wa]; cleared.push('booking'); }
if (data.lastBot && data.lastBot[wa]) { delete data.lastBot[wa]; cleared.push('lastBot'); }
if (data.known && data.known[wa]) { delete data.known[wa]; cleared.push('known'); }
if (data.lastWamid && data.lastWamid[wa]) { delete data.lastWamid[wa]; cleared.push('lastWamid'); }
return [{ json: { wa_id: wa, cleared, at: new Date().toISOString() } }];
