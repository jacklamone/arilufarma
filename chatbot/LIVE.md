# Stato live (2026-09-02)

Allineato all'istanza n8n di produzione. Il bot **non** è più a menu:
è un AI Agent (WhatsApp Cloud API + gpt-5.6-luna + memoria 7 turni).

## Workflow n8n

| Workflow | ID | Ruolo |
|----------|----|--------|
| Arilùfarma Chatbot Whatsapp | `2jU0ab0ZSmHwSuKi` | Bot principale (pubblicato) |
| ArilùFarma · Consulta listino | `Sld2FlyBwuEHKYsY` | Tool: cerca Query, max 8 righe |
| ArilùFarma · Verifica e salva richiesta galenica | `gOx6lRmSk5F8Uj6T` | Tool: verifica riga Galenici e salva |
| ArilùFarma · Promemoria appuntamenti | `JfkB8E2vQS5KfwuE` | Cron 18:00, template WhatsApp |

File in `n8n/`:

- `arilufarma-whatsapp-bot.json` — snapshot del bot (reimportare e riassegnare le credenziali)
- `arilufarma-consulta-listino.json` — sotto-workflow listino
- `arilufarma-reminder.json` — promemoria

## Cosa fa il bot in produzione

- Orari/indirizzo/email da `DatiFissi` (mai a memoria).
- Prezzi e catalogo via `Consulta_listino`: Query + Foglio opzionale, fuzzy match su Prodotti / Galenici / Servizi / Offerte, **max 8 righe**. Non legge più il foglio intero nell'agente.
- Richiesta galenica solo se la riga esiste in `Galenici`.
- Prenotazione: Calendar + riga in `Prenotazioni` con `event_id`.
- **Spostamento**: `Sposta_appuntamento` aggiorna lo stesso evento Calendar (`eventId`) e `Aggiorna_prenotazione_per_id` aggiorna il foglio. Non crea un secondo evento.
- Cancellazione: elimina l'evento + stato `annullata`.
- Lock per-cliente, privacy CTA automatica al primo messaggio, foto prodotto (niente ricette/documenti), audio rifiutato.
- Promemoria WhatsApp il giorno prima solo se `reminder=si`.

## Prima di spostare un appuntamento vecchio

Le prenotazioni create **prima** di questa versione possono non avere `event_id`. In quel caso il bot usa `wa_id` + `inizio` vecchio. Per le nuove prenotazioni `event_id` è obbligatorio.

Aggiungi la colonna `event_id` in riga 1 della scheda `Prenotazioni` se ancora non c'è.
