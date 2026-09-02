# Stato live (2026-09-02)

Allineato all'istanza n8n di produzione. Il bot è un AI Agent
(WhatsApp Cloud API + gpt-5.4-mini Responses API + memoria 12 turni).

## Workflow n8n

| Workflow | ID | Ruolo |
|----------|----|--------|
| Arilùfarma Chatbot Whatsapp | `2jU0ab0ZSmHwSuKi` | Bot principale (pubblicato, version `28fbe12e`) |
| ArilùFarma · Consulta listino | `Sld2FlyBwuEHKYsY` | Tool: cerca Query, max 8 righe |
| ArilùFarma · Verifica e salva richiesta galenica | `gOx6lRmSk5F8Uj6T` | Tool: verifica riga Galenici e salva |
| ArilùFarma · Promemoria appuntamenti | `JfkB8E2vQS5KfwuE` | Cron 18:00, template WhatsApp |

## Fix 2026-09-02 21:45 CEST — timeout 300s

Esecuzioni `57219`, `57227`, `57228` fallite con *Task execution timed out after 300 seconds* sul nodo **Stato prenotazione**.

Causa: il Code node chiamava `$('Leggi ultime chat').all()` su un nodo Google Sheets **disabilitato e scollegato**. Il task runner restava in attesa del dato fino al timeout, il lock non veniva rilasciato, i messaggi successivi restavano bloccati.

Intervento pubblicato:
- rimosso il lookup a `Leggi ultime chat` (nodo eliminato)
- stato prenotazione solo da messaggio corrente + `staticData.booking` / `lastBot`
- prune staticData oltre 7 giorni e lock oltre 60s
- `onError: continueRegularOutput` + `alwaysOutputData` sui nodi Code del lock/stato

Mandare un messaggio di prova su WhatsApp: deve rispondere in pochi secondi, senza nuovo timeout.

## Cosa fa il bot in produzione

- Orari/indirizzo/email da `DatiFissi` (mai a memoria).
- Prezzi e catalogo via `Consulta_listino`: Query + Foglio opzionale, fuzzy match su Prodotti / Galenici / Servizi / Offerte, **max 8 righe**.
- Richiesta galenica solo se la riga esiste in `Galenici`.
- Prenotazione: Calendar + riga in `Prenotazioni` con `event_id`.
- **Spostamento**: stesso EventId, niente secondo evento.
- Lock per-cliente, privacy CTA automatica al primo messaggio.
- Promemoria WhatsApp il giorno prima solo se `reminder=si`.
