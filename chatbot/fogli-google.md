# Struttura del foglio Google (il "gestionale" del bot)

Il bot usa **un unico file Google Sheets** («ArilùFarma · Gestionale bot»).
I nomi delle schede e delle colonne devono essere **identici** a quelli
qui sotto. Le intestazioni vanno nella **riga 1**.

## Scheda `Messaggi`

Registro di tutti i messaggi in arrivo e della risposta del bot.

| data_ora | wa_id | nome_whatsapp | messaggio_cliente | risposta_bot |
|----------|-------|---------------|-------------------|--------------|

## Scheda `RichiesteGaleniche`

Richieste di preparati raccolte dal bot. Il Dott. Conti aggiorna `stato`
(`nuova` → `gestita`).

| data | wa_id | nome | descrizione | stato |
|------|-------|------|-------------|-------|

## Scheda `Prenotazioni`

Copia di riepilogo (l'evento vero è su Google Calendar). Serve allo
storico e al workflow dei promemoria.

| data | wa_id | nome | tipo | inizio | stato | reminder | event_id |
|------|-------|------|------|--------|-------|----------|----------|

- `inizio`: ISO con fuso, es. `2026-09-04T10:00:00+02:00`
- `stato`: `confermata` / `annullata`
- `reminder`: `si` / `no`
- `event_id`: ID evento Google Calendar. **Obbligatorio** per
  spostare un appuntamento senza creare un secondo evento.
  Aggiungi la colonna in riga 1 se manca.

## Scheda `Lock`

Mutex per-cliente: evita risposte doppie se arrivano due messaggi
vicini.

| wa_id | lock_time |
|-------|-----------|

## Scheda `DatiFissi`

Orario, indirizzo, email. Il bot **non** li tiene a memoria.

## Schede listino

Usate dal sotto-workflow `Consulta listino` (fuzzy match, max 8 righe).

- `Prodotti` — da banco (`nome`, `categoria`, `prezzo`, …)
- `Galenici` — su misura (`nome`, `categoria`, `prezzo`, …)
- `Servizi` — servizi prenotabili
- `Offerte` — promozioni (`titolo`/`nome`, `prezzo_sconto`, `valido_fino`)

## Creazione rapida

Il foglio è già nel Drive collegato. Serve solo l'ID (URL tra `/d/` e
`/edit`) se lo ricrei da zero.
