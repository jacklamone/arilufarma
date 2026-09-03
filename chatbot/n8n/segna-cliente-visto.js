const wa = String($('WhatsApp Trigger').first().json.messages[0].from || '');
const data = $getWorkflowStaticData('global');
data.known = data.known || {};
data.known[wa] = Date.now();
const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
for (const [k, v] of Object.entries(data.known)) {
  const t = typeof v === 'number' ? v : Date.parse(String(v));
  if (!t || t < cutoff) delete data.known[k];
}
return [{ json: { wa_id: wa } }];
