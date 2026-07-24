# Listino ArilùFarma — fonte dati per il bot

Questo file è la **fonte** del catalogo che il bot consulta: servizi, prodotti
da banco, preparati galenici e offerte. Diventa **4 schede** nel foglio
«ArilùFarma · Gestionale bot» (le stesse colonne qui sotto), e il bot le legge
con lo strumento *Consulta_listino*.

## Regole sui prezzi (importante)

- I prezzi dei **prodotti da banco** qui sono quelli **reali** presi dal sito.
- Per **servizi** e **galenici** il prezzo è `da definire`: sono di **test**,
  li sostituirà il Dott. Conti con quelli veri.
- ⚠️ Guardrail del bot: se un prezzo è `da definire`, il bot **non lo inventa**
  — dice che il prezzo si conferma in sede o al telefono (079 278245).
- Disponibilità reale e prezzi definitivi arriveranno dal gestionale **Winfarm**
  quando lo collegheremo; fino ad allora vale questo listino.

---

## Scheda `Servizi`

| servizio | prezzo | note |
|----------|--------|------|
| Preparazioni galeniche | da definire | preparati su misura in laboratorio |
| Spirometria | da definire | valutazione funzionalità respiratoria |
| Profilo lipidico | da definire | colesterolo totale, HDL, LDL, trigliceridi |
| Emoglobina glicata | da definire | |
| Glicemia | da definire | autoanalisi capillare |
| Vitamina D | da definire | |
| MOC | da definire | densitometria ossea |
| Pressione arteriosa | Gratuita | anche senza appuntamento |
| Ferritina | da definire | |
| Analisi capelli e pelle | da definire | tricologica e dermocosmetica |
| Noleggio tiralatte | da definire | servizio di noleggio |
| Consulenza | da definire | col Dott. Conti |

## Scheda `Prodotti` (da banco)

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Okitask | Dolore | €4,90 | granulato orosolubile per dolori acuti |
| Armolipid | Colesterolo | €39,90 | integratore per colesterolo e trigliceridi |
| Vicks Sinex | Naso | €8,50 | spray nasale con aloe contro la congestione |
| Crema Caudalie | Viso | €14,90 | idratante con polifenoli d'uva |
| Listerine 500ml | Igiene orale | €3,90 | collutorio per pulizia profonda |
| Normolip | Colesterolo | €32,90 | integratore naturale con monacolina K |
| Aspirina | Dolore e febbre | da definire | analgesico e antinfiammatorio |
| Moment | Dolore e infiammazione | da definire | antinfiammatorio (ibuprofene) |
| Moment Act | Dolore e infiammazione | da definire | ibuprofene arginina, azione rapida |
| Tachipirina | Dolore e febbre | da definire | analgesico e antipiretico (paracetamolo) |
| Gaviscon | Reflusso e bruciore | da definire | protezione contro reflusso gastroesofageo |
| Maalox | Acidità di stomaco | da definire | antiacido per bruciore e acidità |
| Buscopan | Dolori addominali | da definire | antispastico per crampi addominali |
| Imodium | Intestino | da definire | antidiarroico |
| Enterogermina | Intestino | da definire | fermenti lattici per la flora intestinale |
| Rinazina | Naso | da definire | decongestionante nasale spray |
| Fluimucil | Tosse e catarro | da definire | mucolitico |
| Aerius | Allergie | da definire | antistaminico |

> Prezzi reali per gli articoli già venduti sul sito attuale; per i nuovi OTC
> classici da banco (aspirina, Moment, Gaviscon, ecc.) il prezzo è "da
> definire" finché il Dott. Conti non lo conferma — stesso guardrail delle
> altre schede: il bot non lo inventa mai, rimanda alla sede o al telefono.

### Marche in vetrina (marquee del sito)

Le marche che scorrono in home (oltre a quelle già presenti come prodotto
sopra, es. Caudalie) sono disponibili in negozio ma senza un prodotto/prezzo
specifico indicato: il bot le tratta come "marca disponibile, listino da
confermare in sede", mai con un prezzo inventato.

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| ISDIN | Marca — solari e dermocosmesi | da definire | linea disponibile in negozio |
| EuPhidra | Marca — dermocosmesi e igiene | da definire | linea disponibile in negozio |
| Heliocare | Marca — fotoprotezione | da definire | linea solare disponibile in negozio |
| Curasept | Marca — igiene orale | da definire | linea disponibile in negozio |
| Rilastil | Marca — dermocosmesi | da definire | linea disponibile in negozio |

> Prodotti delle migliori marche, disponibili in negozio fino a esaurimento
> scorte. Elenco da ampliare col catalogo reale (Winfarm).

## Scheda `Galenici` (preparati del laboratorio)

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Weight Control Plus | Peso e metabolismo | da definire | regola il glucosio e stimola il metabolismo |
| Zero Fame Plus | Peso e metabolismo | da definire | riduce l'appetito, supporta lo stress emotivo |
| Garcinia Cambogia | Peso e metabolismo | da definire | regola appetito e composizione corporea |
| Metabolaid | Peso e metabolismo | da definire | controllo del peso, riduce il senso di fame |
| Spirulina Alga | Peso e metabolismo | da definire | riduce la massa grassa |
| Penso Positivo | Mente e sonno | da definire | equilibrio emotivo e benessere psicofisico |
| Ansia Stop 60 ml | Mente e sonno | da definire | rilassamento, gocce a rapida assimilazione |
| Ansia Stop 30 cps | Mente e sonno | da definire | tono dell'umore e sonno, in capsule |
| Melatonina | Mente e sonno | da definire | regola il ciclo sonno-veglia |
| Prelavaggio Plus | Cura dei capelli | da definire | nutre la fibra capillare |
| Minoxidil | Cura dei capelli | da definire | su ricetta medica, concentrazioni 2% e 5% |
| Ariluprost | Vie urinarie | da definire | D-Mannosio e Mirtillo Rosso |

## Scheda `Offerte` (promozioni attive — da aggiornare)

Qui vanno le promozioni del momento (le stesse che il titolare pubblica su
Facebook/Instagram). Quando collegheremo le pagine social, questa scheda si
aggiornerà da sola; per ora si compila a mano.

| titolo | descrizione | prezzo_sconto | valido_fino |
|--------|-------------|---------------|-------------|
| (esempio) Promo integratori colesterolo | Armolipid + Normolip in offerta | -15% | 2026-08-31 |
