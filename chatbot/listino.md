# Listino ArilùFarma — fonte dati per il bot

Questo file è la **fonte** del catalogo che il bot consulta: servizi, prodotti
da banco, preparati galenici e offerte. Diventa **4 schede** nel foglio
«ArilùFarma · Gestionale bot» (le stesse colonne qui sotto), e il bot le legge
con lo strumento *Consulta_listino*.

## Regole sui prezzi (importante)

- Sono **reali** solo i prezzi dei sei articoli già venduti sul sito attuale
  (Okitask, Armolipid, Vicks Sinex, Crema Caudalie, Listerine, Normolip).
- Tutto il resto — **servizi**, **galenici** e il **catalogo ampliato** delle
  marche — è `da definire`: li conferma il Dott. Conti con i prezzi veri.
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

### Catalogo ampliato per marca

Elenco degli articoli delle marche trattate, così il bot sa **cosa esiste in
negozio** anche quando non sa ancora quanto costa. Il prezzo è `da definire`
per tutti: vale il guardrail: il bot conferma la disponibilità e rimanda alla
sede o al telefono per il prezzo. Da riempire quando il Dott. Conti passa il
listino, o automaticamente quando colleghiamo Winfarm.

#### Caudalie

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Vinoperfect Siero Illuminante Anti-Macchie | Caudalie - Vinoperfect (schiarente) - 30 ml | da definire | |
| Vinoperfect Essenza Glicolica | Caudalie - Vinoperfect (schiarente) - 100 ml | da definire | |
| Vinoperfect Crema Illuminante Anti-Macchie Giorno | Caudalie - Vinoperfect (schiarente) - 50 ml | da definire | |
| Vinoperfect Crema Notte Glicolica Anti-Macchie | Caudalie - Vinoperfect (schiarente) - 50 ml | da definire | |
| Vinoperfect Maschera Peeling Glicolico | Caudalie - Vinoperfect (schiarente) - 75 ml | da definire | |
| Vinosource-Hydra Olio Notte Idratante | Caudalie - Vinosource (idratante) - 30 ml | da definire | |
| Vinosource-Hydra Crema-Maschera Idratante | Caudalie - Vinosource (idratante) - 75 ml | da definire | |
| Vinosource-Hydra S.O.S. Crema Idratazione Intensiva | Caudalie - Vinosource (idratante) - 40 ml | da definire | |
| Vinosource Crema Nutriente Fondente | Caudalie - Vinosource (idratante) - 40 ml | da definire | |
| Vinosource Fluido Idratante Effetto Matte | Caudalie - Vinosource (idratante) - 40 ml | da definire | |
| Resveratrol-Lift Crema Cachemire Ridensificante Giorno | Caudalie - Resveratrol-Lift (anti-età) - 50 ml | da definire | |
| Resveratrol-Lift Crema Tisana della Notte | Caudalie - Resveratrol-Lift (anti-età) - 50 ml | da definire | |
| Premier Cru Il Siero | Caudalie - Premier Cru (anti-età lusso) - 30 ml | da definire | |
| Premier Cru La Crema Ricca | Caudalie - Premier Cru (anti-età lusso) - 50 ml | da definire | |
| Vinoclean Olio Detergente Struccante Viso e Occhi | Caudalie - Cleansing (detergenti) - 150 ml | da definire | |
| Vinoclean Latte Detergente Struccante Viso e Occhi | Caudalie - Cleansing (detergenti) - 400 ml | da definire | |
| Vinopure Siero Salicilico Anti-Imperfezioni | Caudalie - Vinopure (pelle mista/impura) - 30 ml | da definire | |
| Vinopure Soluzione Salicilica Stop Brufoli | Caudalie - Vinopure (pelle mista/impura) - 15 ml | da definire | |
| Huile Divine Olio Divino Corpo/Viso/Capelli | Caudalie - Divine (corpo) - 100 ml | da definire | |
| Huile Divine Olio Divino Corpo/Viso/Capelli | Caudalie - Divine (corpo) - 50 ml | da definire | |
| Vinosun Protect Crema Solare Viso SPF50+ | Caudalie - Solari - 40 ml | da definire | |
| Vinosun Protect Crema Solare Viso SPF30 | Caudalie - Solari - 40 ml | da definire | |

#### ISDIN

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Fotoprotector Fusion Water Color SPF50 | ISDIN - Fusion Water (solare viso) - 50 ml | da definire | |
| Fotoprotector Fusion Water Magic SPF50+ | ISDIN - Fusion Water (solare viso) - 50 ml | da definire | |
| Fusion Fluid Mineral SPF50+ | ISDIN - Fusion Fluid (solare viso) - 50 ml | da definire | |
| Eryfotona AK-NMSC Fluid SPF100+ | ISDIN - Eryfotona (fotoriparazione) - 50 ml | da definire | |
| Eryfotona Night Siero Notte Riparatore | ISDIN - Eryfotona (fotoriparazione) - 50 ml | da definire | |
| Ureadin Ultra 20 Crema Corpo | ISDIN - Ureadin (idratanti urea) - 100 ml | da definire | |
| Ureadin Cream 10% Urea | ISDIN - Ureadin (idratanti urea) - 100 ml | da definire | |
| Ureadin Podos DB Crema Riparatrice Piedi Fragili | ISDIN - Ureadin (urea/piedi) - 100 ml | da definire | |
| Ureadin Podos Gel Oil Piedi | ISDIN - Ureadin (urea/piedi) - 75 ml | da definire | |
| Isdinceutics Melaclear Siero Antimacchie | ISDIN - Isdinceutics (sieri) - 30 ml | da definire | |
| Isdinceutics Hyaluronic Concentrate Siero | ISDIN - Isdinceutics (sieri) - 30 ml | da definire | |
| Isdinceutics Retinal Intense Siero Notte Antirughe | ISDIN - Isdinceutics (sieri) - 50 ml | da definire | |
| Acniben Mattifying Cleanser Gel Detergente Opacizzante | ISDIN - Acniben (pelle impura/acne) - 400 ml | da definire | |
| Acniben Purifying Cleanser Detergente Purificante | ISDIN - Acniben (pelle impura/acne) - 200 ml | da definire | |
| Nutradeica Gel Crema Viso | ISDIN - Cura viso pelle sensibile/seborroica - 50 ml | da definire | |
| Nutratopic Rx Crema Pelle Atopica | ISDIN - Nutraisdin (bambini/pelle atopica) - 100 ml | da definire | |
| Fotoprotector Bruma Viso SPF50 | ISDIN - Bruma (solare spray) - 100 ml | da definire | |
| Fotoprotector Lozione Spray Corpo SPF50 | ISDIN - Bruma (solare spray corpo) - 200 ml | da definire | |

#### Oral-B

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Oral-B Pro-Expert CrossAction (medio) | Oral-B - Spazzolino manuale - 1 pezzo | da definire | |
| Oral-B Indicator (medio) | Oral-B - Spazzolino manuale - 1 pezzo | da definire | |
| Oral-B Indicator (medio) | Oral-B - Spazzolino manuale - 2 pezzi | da definire | |
| Oral-B 3D White & Cool (medio) | Oral-B - Spazzolino manuale - 1 pezzo | da definire | |
| Oral-B Pro-Sensitive Advanced (extra morbido) | Oral-B - Spazzolino manuale - 1 pezzo | da definire | |
| Oral-B Pro-Sensitive Clinical | Oral-B - Spazzolino manuale - 1 pezzo | da definire | |
| Oral-B Vitality CrossAction | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | da definire | |
| Oral-B Vitality Pro D103 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | da definire | |
| Oral-B Pro 1 (Pro Series 1) | Oral-B - Spazzolino elettrico - confezione doppia, 2 testine | da definire | |
| Oral-B Pro 2 (2000N) | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | da definire | |
| Oral-B Pro 3 (Pro Series 3) | Oral-B - Spazzolino elettrico - 1 spazzolino + custodia | da definire | |
| Oral-B Pro 750 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | da definire | |
| Oral-B Pro 3 3000 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | da definire | |
| Oral-B iO 4 | Oral-B - Spazzolino elettrico - spazzolino + testina + custodia viaggio | da definire | |
| Oral-B iO 6 (Black) | Oral-B - Spazzolino elettrico - spazzolino + 2-3 testine + custodia | da definire | |
| Oral-B iO 8 (8N) | Oral-B - Spazzolino elettrico - spazzolino + 1 testina + custodia magnetica | da definire | |
| Oral-B iO 9 (Black Special Edition) | Oral-B - Spazzolino elettrico - spazzolino + 2 testine | da definire | |
| Oral-B iO 10 (Black) | Oral-B - Spazzolino elettrico - spazzolino + testina | da definire | |
| Oral-B Pro Kids Frozen (3+) | Oral-B - Spazzolino elettrico bambini - 1 spazzolino + 1 testina | da definire | |
| Oral-B Kids Star Wars (3+) | Oral-B - Spazzolino elettrico bambini - spazzolino + 4 sticker | da definire | |
| Oral-B Junior 6+ (vari personaggi) | Oral-B - Spazzolino elettrico bambini - 1 spazzolino | da definire | |
| Oral-B Testine CrossAction | Oral-B - Testine di ricambio - confezione da 4 | da definire | |
| Oral-B Testine 3D White | Oral-B - Testine di ricambio - confezione da 3 | da definire | |
| Oral-B Testine Sensitive Clean | Oral-B - Testine di ricambio - confezione da 3 | da definire | |
| Oral-B Testine Sensitive Clean & Care | Oral-B - Testine di ricambio - confezione da 2 | da definire | |
| Oral-B Testine Precision Clean | Oral-B - Testine di ricambio - confezione da 5-6 | da definire | |
| Oral-B Testine iO Specialised Clean | Oral-B - Testine di ricambio - confezione da 2 | da definire | |
| Oral-B Oxyjet | Oral-B - Irrigatore orale - kit spazzolino + idropulsore | da definire | |
| Oral-B Waterjet | Oral-B - Irrigatore orale - sistema + 4 testine | da definire | |

#### Altri farmaci da banco

Varianti e formati che non erano ancora in elenco. Gli articoli già presenti
nella tabella principale qui sopra (Tachipirina, Moment, Maalox, Gaviscon,
Imodium, Enterogermina, Rinazina, Fluimucil, Okitask, Vicks Sinex, Aspirina)
**non vanno ripetuti**: una riga sola per prodotto, altrimenti il bot trova
due risposte diverse per la stessa domanda.

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Tachipirina Adulti | Dolore/febbre - Paracetamolo - 10 supposte 1000mg | da definire | |
| Tachipirina Bambini | Dolore/febbre - Paracetamolo - 10 supposte 250mg | da definire | |
| Aspirina C | Dolore/febbre - Acido acetilsalicilico + Vit. C - 20 compresse effervescenti | da definire | |
| Vivin C | Dolore/febbre - Acido acetilsalicilico + Vit. C - 20 compresse effervescenti | da definire | |
| Oki | Dolore/febbre - Ketoprofene - 30 bustine 80mg | da definire | |
| Brufen | Dolore/febbre - Ibuprofene - 30 compresse 600mg | da definire | |
| Proctolyn Crema | Emorroidi - Fluocinolone + chetocaina - crema rettale 30g | da definire | |
| Proctolyn Supposte | Emorroidi - Fluocinolone + chetocaina - 10 supposte | da definire | |
| Preparazione H Unguento | Emorroidi - Fenilefrina + olio fegato di squalo - unguento 25g | da definire | |
| Preparazione H Supposte | Emorroidi - Fenilefrina + olio fegato di squalo - 12 supposte | da definire | |
| Emorril Crema | Emorroidi - Idrocortisone + lidocaina - crema rettale 40g | da definire | |
| Venoruton | Emorroidi/circolazione - Oxerutina - 30 bustine 1000mg | da definire | |
| Tachifludec | Raffreddore/influenza - Paracetamolo + fenilefrina + clorfenamina - 10 bustine | da definire | |
| Vicks VapoRub | Raffreddore/influenza - Canfora/mentolo/eucaliptolo - unguento 50g | da definire | |
| Bronchenolo Sedativo Fluidificante | Raffreddore/influenza - Destrometorfano + guaifenesina - sciroppo 150ml | da definire | |
| Buscopan Compositum | Digestivo - Ioscina butilbromuro + paracetamolo - 20 compresse | da definire | |
| Citrosodina | Digestivo - Acido citrico + sodio bicarbonato - granulato 150g | da definire | |
| Zirtec | Allergia - Cetirizina - 7 compresse 10mg | da definire | |
| Clarityn | Allergia - Loratadina - 7 compresse 10mg | da definire | |
| Voltaren Emulgel | Dolore muscolare/articolare - Diclofenac dietilammonio - gel 60g | da definire | |
| Voltadvance | Dolore muscolare/articolare - Diclofenac potassico - 20 compresse 25mg | da definire | |
| Fastum Gel | Dolore muscolare/articolare - Ketoprofene - gel 50g | da definire | |
| Eucerin AtopiControl Crema | Cura pelle secca/atopica - Omega-6/ceramidi - crema 100ml | da definire | |
| Tantum Verde Pastiglie | Mal di gola - Benzidamina - 20 pastiglie 3mg | da definire | |
| Tantum Verde Gola Spray | Mal di gola - Flurbiprofene - spray orofaringeo 15ml | da definire | |
| Neo Borocillina Gola Dolore | Mal di gola - Cetilpiridinio/benzocaina - 16 pastiglie | da definire | |

### Marche in vetrina (marquee del sito)

Le marche che scorrono in home sono disponibili in negozio ma senza un
prodotto/prezzo specifico indicato: il bot le tratta come "marca
disponibile, listino da confermare in sede", mai con un prezzo inventato.
Per Caudalie e ISDIN esistono ora anche gli articoli specifici qui sopra: la
riga marca resta valida per il **resto** della linea, non ancora dettagliato.
(Oral-B non è nel marquee, ma è trattato in negozio: vedi la sua tabella.)

| nome | categoria | prezzo | note |
|------|-----------|--------|------|
| Caudalie | Marca di punta — viso e cosmesi | da definire | marca di punta della parafarmacia (vedi anche Crema Caudalie tra i prodotti) |
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
