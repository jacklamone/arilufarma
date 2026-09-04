const input = $input.first().json || {};
const req = $('Richiesta ricevuta').first().json || {};
const q = String(input.Query || req.Query || '').trim().toLowerCase();
const foglioRaw = String(input.Foglio || req.Foglio || '').trim().toLowerCase();
const wanted = foglioRaw ? foglioRaw.split(/[,;|/]+/).map(s => s.trim()).filter(Boolean) : ['prodotti', 'galenici', 'servizi', 'offerte'];
const stop = new Set(['per','una','uno','che','con','del','della','dei','delle','il','lo','la','gli','le','un','di','da','in','su','al','ai','alla','alle','qualcosa','qualche','questo','questa','anche','come','cosa','sono','avete','fate','fare','vorrei','voglio','serve','servono','dopo','lungo','raggio','consigliata','consigliato']);
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
const nq = norm(q);
const tokens = nq.split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !stop.has(t));
// Stem leggero per l'italiano: toglie la vocale finale ai token di almeno 5
// lettere prima del confronto per sottostringa. Senza questo, una query al
// plurale ("spazzolini elettrici") non trovava mai le righe scritte al
// singolare in categoria ("Spazzolino elettrico"), perche' "spazzolini" non
// e' una sottostringa di "spazzolino" ne' viceversa. Osservato in produzione:
// il cliente chiedeva spazzolini elettrici, presenti a listino, e il bot
// rispondeva che non risultavano.
function stem(t) { return t.length > 4 && /[aeiou]$/.test(t) ? t.slice(0, -1) : t; }
function score(row) {
  const nome = norm(row.nome || '');
  const extra = norm([row.categoria, row.note, row.descrizione, row.titolo].filter(Boolean).join(' '));
  if (!nq) return 1;
  if (nome === nq) return 100;
  if (nome.includes(nq) || (nome && nq.includes(nome))) return 90;
  let hits = 0;
  for (const t of tokens) {
    const st = stem(t);
    if (nome.includes(st)) hits += 2;
    else if (extra.includes(st)) hits += 1;
  }
  if (!hits) return 0;
  return 15 + hits * 20;
}
function pack(foglio, rows, nameKeys) {
  if (!wanted.some(w => foglio.toLowerCase().startsWith(w.slice(0, 4)))) return [];
  return (rows || []).map(r => {
    const nome = nameKeys.map(k => r[k]).find(Boolean) || '';
    const s = score({ nome, ...r });
    if (s <= 0 && nq) return null;
    if (!nome) return null;
    const out = { foglio: foglio, nome: String(nome) };
    if (r.categoria) out.categoria = r.categoria;
    if (r.prezzo) out.prezzo = r.prezzo;
    if (r.prezzo_sconto) out.prezzo_sconto = r.prezzo_sconto;
    if (r.note) out.note = r.note;
    if (r.descrizione) out.descrizione = r.descrizione;
    if (r.valido_fino) out.valido_fino = r.valido_fino;
    out._p = s || 1;
    return out;
  }).filter(Boolean);
}
const hits = [
  ...pack('Prodotti', input.prodotti || [], ['nome']),
  ...pack('Galenici', input.galenici || [], ['nome']),
  ...pack('Servizi', input.servizi || [], ['servizio', 'nome']),
  ...pack('Offerte', input.offerte || [], ['titolo', 'nome']),
].sort((a, b) => b._p - a._p).slice(0, 8).map(({ _p, ...rest }) => rest);
return [{ json: { query: q, cache: !!input.cacheHit, fogli: wanted, trovati: hits.length, risultati: hits, nota: hits.length ? 'Usa SOLO queste righe. Non inventare prezzi. Foglio=Servizi: il servizio SI effettua. Foglio=Offerte: promo reale del gestionale.' : 'Nessuna riga pertinente. Non inventare prodotti, servizi o prezzi. Invita a chiamare lo 079 278245.' } }];
