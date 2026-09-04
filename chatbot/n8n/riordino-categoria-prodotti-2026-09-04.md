# Riordino categoria — sheet Prodotti (4 settembre 2026)

Su richiesta del titolare, la colonna `categoria` dello sheet `Prodotti` del
gestionale è stata riordinata in 7 categorie pulite e coerenti (Farmaco da
banco, Igiene orale, Cosmesi viso, Cosmesi corpo, Solare, Integratore,
Marca), al posto del mix di farmaci/spazzolini/creme e di tre stili diversi
di etichetta (categoria singola, "marca - linea - formato",
"categoria - principio attivo - confezione"). La vecchia categoria non è
andata persa: è stata spostata in coda al campo `note` di ogni riga.

**Da rivedere col titolare** (farmacista, non io): la distinzione viso/corpo
per le linee Caudalie/ISDIN (righe 26-65) è stata assegnata in base al nome
prodotto e alla linea commerciale, non a una valutazione dermocosmetica —
alcune righe borderline (es. Vinosource, considerata "viso" perché è la
linea idratante viso di Caudalie) meritano una verifica rapida.

Applicato una tantum via script n8n (`ArilùFarma · Riordino categoria
Prodotti`, creato ed eseguito una volta, poi archiviato — stesso pattern
delle bonifiche precedenti). Tabella completa vecchia→nuova categoria:

| Riga | Prodotto | Vecchia categoria | Nuova categoria |
|---|---|---|---|
| 2 | Okitask | Dolore | **Farmaco da banco** |
| 3 | Armolipid | Colesterolo | **Integratore** |
| 4 | Vicks Sinex | Naso | **Farmaco da banco** |
| 5 | Crema Caudalie | Viso | **Cosmesi viso** |
| 6 | Listerine 500ml | Igiene orale | **Igiene orale** |
| 7 | Normolip | Colesterolo | **Integratore** |
| 8 | Caudalie | Marca di punta — viso e cosmesi | **Marca** |
| 9 | Aspirina | Dolore e febbre | **Farmaco da banco** |
| 10 | Moment | Dolore e infiammazione | **Farmaco da banco** |
| 11 | Moment Act | Dolore e infiammazione | **Farmaco da banco** |
| 12 | Tachipirina | Dolore e febbre | **Farmaco da banco** |
| 13 | Gaviscon | Reflusso e bruciore | **Farmaco da banco** |
| 14 | Maalox | Acidità di stomaco | **Farmaco da banco** |
| 15 | Buscopan | Dolori addominali | **Farmaco da banco** |
| 16 | Imodium | Intestino | **Farmaco da banco** |
| 17 | Enterogermina | Intestino | **Integratore** |
| 18 | Rinazina | Naso | **Farmaco da banco** |
| 19 | Fluimucil | Tosse e catarro | **Farmaco da banco** |
| 20 | Aerius | Allergie | **Farmaco da banco** |
| 21 | ISDIN | Marca — solari e dermocosmesi | **Marca** |
| 22 | EuPhidra | Marca — dermocosmesi e igiene | **Marca** |
| 23 | Heliocare | Marca — fotoprotezione | **Marca** |
| 24 | Curasept | Marca — igiene orale | **Igiene orale** |
| 25 | Rilastil | Marca — dermocosmesi | **Marca** |
| 26 | Vinoperfect Siero Illuminante Anti-Macchie | Caudalie - Vinoperfect (schiarente) - 30 ml | **Cosmesi viso** |
| 27 | Vinoperfect Essenza Glicolica | Caudalie - Vinoperfect (schiarente) - 100 ml | **Cosmesi viso** |
| 28 | Vinoperfect Crema Illuminante Anti-Macchie Giorno | Caudalie - Vinoperfect (schiarente) - 50 ml | **Cosmesi viso** |
| 29 | Vinoperfect Crema Notte Glicolica Anti-Macchie | Caudalie - Vinoperfect (schiarente) - 50 ml | **Cosmesi viso** |
| 30 | Vinoperfect Maschera Peeling Glicolico | Caudalie - Vinoperfect (schiarente) - 75 ml | **Cosmesi viso** |
| 31 | Vinosource-Hydra Olio Notte Idratante | Caudalie - Vinosource (idratante) - 30 ml | **Cosmesi viso** |
| 32 | Vinosource-Hydra Crema-Maschera Idratante | Caudalie - Vinosource (idratante) - 75 ml | **Cosmesi viso** |
| 33 | Vinosource-Hydra S.O.S. Crema Idratazione Intensiva | Caudalie - Vinosource (idratante) - 40 ml | **Cosmesi viso** |
| 34 | Vinosource Crema Nutriente Fondente | Caudalie - Vinosource (idratante) - 40 ml | **Cosmesi viso** |
| 35 | Vinosource Fluido Idratante Effetto Matte | Caudalie - Vinosource (idratante) - 40 ml | **Cosmesi viso** |
| 36 | Resveratrol-Lift Crema Cachemire Ridensificante Giorno | Caudalie - Resveratrol-Lift (anti-eta) - 50 ml | **Cosmesi viso** |
| 37 | Resveratrol-Lift Crema Tisana della Notte | Caudalie - Resveratrol-Lift (anti-eta) - 50 ml | **Cosmesi viso** |
| 38 | Premier Cru Il Siero | Caudalie - Premier Cru (anti-eta lusso) - 30 ml | **Cosmesi viso** |
| 39 | Premier Cru La Crema Ricca | Caudalie - Premier Cru (anti-eta lusso) - 50 ml | **Cosmesi viso** |
| 40 | Vinoclean Olio Detergente Struccante Viso e Occhi | Caudalie - Cleansing (detergenti) - 150 ml | **Cosmesi viso** |
| 41 | Vinoclean Latte Detergente Struccante Viso e Occhi | Caudalie - Cleansing (detergenti) - 400 ml | **Cosmesi viso** |
| 42 | Vinopure Siero Salicilico Anti-Imperfezioni | Caudalie - Vinopure (pelle mista/impura) - 30 ml | **Cosmesi viso** |
| 43 | Vinopure Soluzione Salicilica Stop Brufoli | Caudalie - Vinopure (pelle mista/impura) - 15 ml | **Cosmesi viso** |
| 44 | Huile Divine Olio Divino Corpo/Viso/Capelli | Caudalie - Divine (corpo) - 100 ml | **Cosmesi corpo** |
| 45 | Huile Divine Olio Divino Corpo/Viso/Capelli | Caudalie - Divine (corpo) - 50 ml | **Cosmesi corpo** |
| 46 | Vinosun Protect Crema Solare Viso SPF50+ | Caudalie - Solari - 40 ml | **Solare** |
| 47 | Vinosun Protect Crema Solare Viso SPF30 | Caudalie - Solari - 40 ml | **Solare** |
| 48 | Fotoprotector Fusion Water Color SPF50 | ISDIN - Fusion Water (solare viso) - 50 ml | **Solare** |
| 49 | Fotoprotector Fusion Water Magic SPF50+ | ISDIN - Fusion Water (solare viso) - 50 ml | **Solare** |
| 50 | Fusion Fluid Mineral SPF50+ | ISDIN - Fusion Fluid (solare viso) - 50 ml | **Solare** |
| 51 | Eryfotona AK-NMSC Fluid SPF100+ | ISDIN - Eryfotona (fotoriparazione) - 50 ml | **Solare** |
| 52 | Eryfotona Night Siero Notte Riparatore | ISDIN - Eryfotona (fotoriparazione) - 50 ml | **Solare** |
| 53 | Ureadin Ultra 20 Crema Corpo | ISDIN - Ureadin (idratanti urea) - 100 ml | **Cosmesi corpo** |
| 54 | Ureadin Cream 10% Urea | ISDIN - Ureadin (idratanti urea) - 100 ml | **Cosmesi corpo** |
| 55 | Ureadin Podos DB Crema Riparatrice Piedi Fragili | ISDIN - Ureadin (urea/piedi) - 100 ml | **Cosmesi corpo** |
| 56 | Ureadin Podos Gel Oil Piedi | ISDIN - Ureadin (urea/piedi) - 75 ml | **Cosmesi corpo** |
| 57 | Isdinceutics Melaclear Siero Antimacchie | ISDIN - Isdinceutics (sieri) - 30 ml | **Cosmesi viso** |
| 58 | Isdinceutics Hyaluronic Concentrate Siero | ISDIN - Isdinceutics (sieri) - 30 ml | **Cosmesi viso** |
| 59 | Isdinceutics Retinal Intense Siero Notte Antirughe | ISDIN - Isdinceutics (sieri) - 50 ml | **Cosmesi viso** |
| 60 | Acniben Mattifying Cleanser Gel Detergente Opacizzante | ISDIN - Acniben (pelle impura/acne) - 400 ml | **Cosmesi viso** |
| 61 | Acniben Purifying Cleanser Detergente Purificante | ISDIN - Acniben (pelle impura/acne) - 200 ml | **Cosmesi viso** |
| 62 | Nutradeica Gel Crema Viso | ISDIN - Cura viso pelle sensibile/seborroica - 50 ml | **Cosmesi viso** |
| 63 | Nutratopic Rx Crema Pelle Atopica | ISDIN - Nutraisdin (bambini/pelle atopica) - 100 ml | **Cosmesi corpo** |
| 64 | Fotoprotector Bruma Viso SPF50 | ISDIN - Bruma (solare spray) - 100 ml | **Solare** |
| 65 | Fotoprotector Lozione Spray Corpo SPF50 | ISDIN - Bruma (solare spray corpo) - 200 ml | **Solare** |
| 66 | Oral-B Pro-Expert CrossAction (medio) | Oral-B - Spazzolino manuale - 1 pezzo | **Igiene orale** |
| 67 | Oral-B Indicator (medio) | Oral-B - Spazzolino manuale - 1 pezzo | **Igiene orale** |
| 68 | Oral-B Indicator (medio) | Oral-B - Spazzolino manuale - 2 pezzi | **Igiene orale** |
| 69 | Oral-B 3D White & Cool (medio) | Oral-B - Spazzolino manuale - 1 pezzo | **Igiene orale** |
| 70 | Oral-B Pro-Sensitive Advanced (extra morbido) | Oral-B - Spazzolino manuale - 1 pezzo | **Igiene orale** |
| 71 | Oral-B Pro-Sensitive Clinical | Oral-B - Spazzolino manuale - 1 pezzo | **Igiene orale** |
| 72 | Oral-B Vitality CrossAction | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | **Igiene orale** |
| 73 | Oral-B Vitality Pro D103 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | **Igiene orale** |
| 74 | Oral-B Pro 1 (Pro Series 1) | Oral-B - Spazzolino elettrico - confezione doppia, 2 testine | **Igiene orale** |
| 75 | Oral-B Pro 2 (2000N) | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | **Igiene orale** |
| 76 | Oral-B Pro 3 (Pro Series 3) | Oral-B - Spazzolino elettrico - 1 spazzolino + custodia | **Igiene orale** |
| 77 | Oral-B Pro 750 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | **Igiene orale** |
| 78 | Oral-B Pro 3 3000 | Oral-B - Spazzolino elettrico - 1 spazzolino + 1 testina | **Igiene orale** |
| 79 | Oral-B iO 4 | Oral-B - Spazzolino elettrico - spazzolino + testina + custodia viaggio | **Igiene orale** |
| 80 | Oral-B iO 6 (Black) | Oral-B - Spazzolino elettrico - spazzolino + 2-3 testine + custodia | **Igiene orale** |
| 81 | Oral-B iO 8 (8N) | Oral-B - Spazzolino elettrico - spazzolino + 1 testina + custodia magnetica | **Igiene orale** |
| 82 | Oral-B iO 9 (Black Special Edition) | Oral-B - Spazzolino elettrico - spazzolino + 2 testine | **Igiene orale** |
| 83 | Oral-B iO 10 (Black) | Oral-B - Spazzolino elettrico - spazzolino + testina | **Igiene orale** |
| 84 | Oral-B Pro Kids Frozen (3+) | Oral-B - Spazzolino elettrico bambini - 1 spazzolino + 1 testina | **Igiene orale** |
| 85 | Oral-B Kids Star Wars (3+) | Oral-B - Spazzolino elettrico bambini - spazzolino + 4 sticker | **Igiene orale** |
| 86 | Oral-B Junior 6+ (vari personaggi) | Oral-B - Spazzolino elettrico bambini - 1 spazzolino | **Igiene orale** |
| 87 | Oral-B Testine CrossAction | Oral-B - Testine di ricambio - confezione da 4 | **Igiene orale** |
| 88 | Oral-B Testine 3D White | Oral-B - Testine di ricambio - confezione da 3 | **Igiene orale** |
| 89 | Oral-B Testine Sensitive Clean | Oral-B - Testine di ricambio - confezione da 3 | **Igiene orale** |
| 90 | Oral-B Testine Sensitive Clean & Care | Oral-B - Testine di ricambio - confezione da 2 | **Igiene orale** |
| 91 | Oral-B Testine Precision Clean | Oral-B - Testine di ricambio - confezione da 5-6 | **Igiene orale** |
| 92 | Oral-B Testine iO Specialised Clean | Oral-B - Testine di ricambio - confezione da 2 | **Igiene orale** |
| 93 | Oral-B Oxyjet | Oral-B - Irrigatore orale - kit spazzolino + idropulsore | **Igiene orale** |
| 94 | Oral-B Waterjet | Oral-B - Irrigatore orale - sistema + 4 testine | **Igiene orale** |
| 95 | Tachipirina Adulti | Dolore/febbre - Paracetamolo - 10 supposte 1000mg | **Farmaco da banco** |
| 96 | Tachipirina Bambini | Dolore/febbre - Paracetamolo - 10 supposte 250mg | **Farmaco da banco** |
| 97 | Aspirina C | Dolore/febbre - Acido acetilsalicilico + Vit. C - 20 compresse effervescenti | **Farmaco da banco** |
| 98 | Vivin C | Dolore/febbre - Acido acetilsalicilico + Vit. C - 20 compresse effervescenti | **Farmaco da banco** |
| 99 | Oki | Dolore/febbre - Ketoprofene - 30 bustine 80mg | **Farmaco da banco** |
| 100 | Brufen | Dolore/febbre - Ibuprofene - 30 compresse 600mg | **Farmaco da banco** |
| 101 | Proctolyn Crema | Emorroidi - Fluocinolone + chetocaina - crema rettale 30g | **Farmaco da banco** |
| 102 | Proctolyn Supposte | Emorroidi - Fluocinolone + chetocaina - 10 supposte | **Farmaco da banco** |
| 103 | Preparazione H Unguento | Emorroidi - Fenilefrina + olio fegato di squalo - unguento 25g | **Farmaco da banco** |
| 104 | Preparazione H Supposte | Emorroidi - Fenilefrina + olio fegato di squalo - 12 supposte | **Farmaco da banco** |
| 105 | Emorril Crema | Emorroidi - Idrocortisone + lidocaina - crema rettale 40g | **Farmaco da banco** |
| 106 | Venoruton | Emorroidi/circolazione - Oxerutina - 30 bustine 1000mg | **Farmaco da banco** |
| 107 | Tachifludec | Raffreddore/influenza - Paracetamolo + fenilefrina + clorfenamina - 10 bustine | **Farmaco da banco** |
| 108 | Vicks VapoRub | Raffreddore/influenza - Canfora/mentolo/eucaliptolo - unguento 50g | **Farmaco da banco** |
| 109 | Bronchenolo Sedativo Fluidificante | Raffreddore/influenza - Destrometorfano + guaifenesina - sciroppo 150ml | **Farmaco da banco** |
| 110 | Buscopan Compositum | Digestivo - Ioscina butilbromuro + paracetamolo - 20 compresse | **Farmaco da banco** |
| 111 | Citrosodina | Digestivo - Acido citrico + sodio bicarbonato - granulato 150g | **Farmaco da banco** |
| 112 | Zirtec | Allergia - Cetirizina - 7 compresse 10mg | **Farmaco da banco** |
| 113 | Clarityn | Allergia - Loratadina - 7 compresse 10mg | **Farmaco da banco** |
| 114 | Voltaren Emulgel | Dolore muscolare/articolare - Diclofenac dietilammonio - gel 60g | **Farmaco da banco** |
| 115 | Voltadvance | Dolore muscolare/articolare - Diclofenac potassico - 20 compresse 25mg | **Farmaco da banco** |
| 116 | Fastum Gel | Dolore muscolare/articolare - Ketoprofene - gel 50g | **Farmaco da banco** |
| 117 | Eucerin AtopiControl Crema | Cura pelle secca/atopica - Omega-6/ceramidi - crema 100ml | **Cosmesi corpo** |
| 118 | Tantum Verde Pastiglie | Mal di gola - Benzidamina - 20 pastiglie 3mg | **Farmaco da banco** |
| 119 | Tantum Verde Gola Spray | Mal di gola - Flurbiprofene - spray orofaringeo 15ml | **Farmaco da banco** |
| 120 | Neo Borocillina Gola Dolore | Mal di gola - Cetilpiridinio/benzocaina - 16 pastiglie | **Farmaco da banco** |