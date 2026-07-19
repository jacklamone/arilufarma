# Struttura del foglio Google (il "gestionale" del bot)

Il bot usa **un unico file Google Sheets** con quattro schede. Crealo
sull'account Google della parafarmacia e copia l'ID del file (la parte
lunga dell'URL tra `/d/` e `/edit`) nella variabile `GOOGLE_SHEET_ID`.

⚠️ I nomi delle schede e delle colonne devono essere **identici** a
quelli qui sotto (il workflow li cerca per nome). Le intestazioni vanno
nella **riga 1** di ogni scheda.

## Scheda `Sessioni`

Memoria delle conversazioni: a che punto del percorso si trova ogni
cliente. Gestita interamente dal bot, non toccarla a mano.

| wa_id | nome | stato | dati | aggiornato |
|-------|------|-------|------|------------|
| 3933512345678 | Maria Rossi | prenota_slot | {"tipo":"Analisi"} | 2026-07-16 10:32:00 |

Stati possibili: `menu`, `galenica_attesa`, `prenota_tipo`,
`prenota_slot`, `umano` (conversazione passata al Dott. Conti: il bot
tace per 24 ore o finché il cliente non scrive "menu").

## Scheda `Messaggi`

Registro di tutti i messaggi in arrivo (utile per assistenza e per
capire cosa chiedono i clienti).

| data | wa_id | nome | tipo | testo | bottone |
|------|-------|------|------|-------|---------|
| 2026-07-16 10:31:12 | 3933512345678 | Maria Rossi | interactive | 📅 Prenota | prenota |

## Scheda `RichiesteGaleniche`

Le richieste di preparati raccolte dal bot. **Questa è la scheda che il
Dott. Conti guarda ogni giorno**: quando risponde al cliente, aggiorna
la colonna `stato` (es. `nuova` → `gestita`).

| data | wa_id | nome | descrizione | stato |
|------|-------|------|-------------|-------|
| 2026-07-16 10:35:44 | 3933512345678 | Maria Rossi | Minoxidil 5% lozione 100 ml | nuova |

## Scheda `Prenotazioni`

Copia di riepilogo delle prenotazioni (l'evento vero è su Google
Calendar; questa scheda serve come storico e per il workflow dei
promemoria). La colonna `reminder` è a disposizione per segnare a mano
l'invio; il workflow dei promemoria non ne ha bisogno (evita i doppioni
girando una sola volta al giorno).

| data | wa_id | nome | tipo | inizio | stato | reminder |
|------|-------|------|------|--------|-------|----------|
| 2026-07-16 10:40:02 | 3933512345678 | Maria Rossi | Analisi | 2026-07-17T17:30:00+02:00 | confermata | |

## Creazione rapida

> ⚡ **Già fatto:** il foglio «ArilùFarma · Gestionale bot» con le 4
> schede è già stato creato nel Drive dell'account collegato. Ti serve
> solo il suo **ID** (nell'URL, tra `/d/` e `/edit`) per `GOOGLE_SHEET_ID`.
> Le istruzioni qui sotto servono solo se devi ricrearlo da zero.

1. [sheets.new](https://sheets.new) → rinomina il file
   «ArilùFarma · Gestionale bot».
2. Crea le 4 schede con i nomi esatti: `Sessioni`, `Messaggi`,
   `RichiesteGaleniche`, `Prenotazioni`.
3. In ogni scheda scrivi le intestazioni della riga 1 come nelle
   tabelle qui sopra (solo i nomi delle colonne, senza righe di esempio).
4. Condividi il file con l'account Google che collegherai a n8n
   (se è lo stesso account, non serve).
