const input = $input.first().json || {};
const req = $('Richiesta ricevuta').first().json || {};
const q = String(input.Query || req.Query || '').trim().toLowerCase();
const foglioRaw = String(input.Foglio || req.Foglio || '').trim().toLowerCase();
const wanted = foglioRaw ? foglioRaw.split(/[,;|/]+/).map(s => s.trim()).filter(Boolean) : ['prodotti', 'galenici', 'servizi', 'offerte'];
const stop = new Set(['per','una','uno','che','con','del','della','dei','delle','il','lo','la','gli','le','un','di','da','in','su','al','ai','alla','alle','qualcosa','qualche','questo','questa','anche','come','cosa','sono','avete','fate','fare','vorrei','voglio','serve','servono','dopo','lungo','raggio','consigliata','consigliato']);
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
const nq = norm(q);
const tokens = nq.split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !stop.has(t));
// Stem leggero per l'italiano: toglie la vocale finale ai token/parole di
// almeno 5 lettere prima del confronto, cosi' "spazzolini" (query, plurale)
// trova "spazzolino" (scheda prodotto, singolare) e viceversa.
function stem(t) { return t.length > 4 && /[aeiou]$/.test(t) ? t.slice(0, -1) : t; }
function words(s) { return norm(s).split(/[^a-z0-9]+/).filter(Boolean); }
function score(row) {
  const nomeNorm = norm(row.nome || '');
  if (!nq) return 1;
  if (nomeNorm === nq) return 100;
  if (nomeNorm.includes(nq) || (nomeNorm && nq.includes(nomeNorm))) return 90;
  // Confronto a PAROLA INTERA (stem esatto), non a sottostringa libera: con
  // la sottostringa libera un token corto come "pro" (da "Pro 1"/"Pro 3")
  // agganciava anche parole non correlate che lo contengono per caso, es.
  // "Vinosun PROtect" o "PROctolyn" - risultati che riempivano gli 8 posti
  // disponibili ed espellevano i veri Oral-B Pro 1 / Pro 3 dai risultati.
  // Osservato in produzione su "differenze tra pro 1 e pro3".
  const nomeStems = words(row.nome).map(stem);
  const extraStems = words([row.categoria, row.note, row.descrizione, row.titolo].filter(Boolean).join(' ')).map(stem);
  let hits = 0;
  for (const t of tokens) {
    const st = stem(t);
    if (nomeStems.includes(st)) hits += 2;
    else if (extraStems.includes(st)) hits += 1;
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
