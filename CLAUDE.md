# ArilùFarma — sito Parafarmacia Sassari

Sito di **ArilùFarma**, parafarmacia galenica a Sassari (Dott. Luca Conti,
dal 2011). Cliente dell'agenzia Intellecta Solutions. Demo pubblicata su
**ariludemo.netlify.app** (account Netlify "contigiacomo", piano a crediti).

## Regole fondamentali

- **Deploy automatico**: ogni push su `main` va in produzione via Netlify
  (sito statico, nessun build command, publish directory `/`).
- **Lingua**: solo italiano.
- **Niente framework**: HTML/CSS/JS statici in un unico `index.html`
  (stili e script inline), più `privacy.html` e `cookie.html`.
- Se l'account Netlify esaurisce i crediti i deploy vengono "Skipped":
  si sbloccano da soli al rinnovo mensile.

## Struttura e caratteristiche

```
index.html   Pagina unica: hero, marquee marche, servizi, assistente,
             chi siamo, galenica+wizard, prodotti, recensioni, contatti
assets/oro/video/   Video locali (hero quadrifoglio, titolare)
assets/oro/img/     Immagini prodotti e categorie
```

- **Hero**: video quadrifoglio locale (la fascia col nome incisa nel video
  è stata ritagliata via ffmpeg — non ripristinare il file vecchio).
- **Marquee marche**: scorrimento gestito in JS, trascinabile col dito,
  riparte da solo dopo ~1,2s. Non tornare all'animazione CSS con :hover
  (su iOS si bloccava per sempre).
- **Assistente virtuale WhatsApp** (sezione `#assistente`): chatbot
  funzionante (Meta Cloud API + n8n), collegato al gestionale Google
  Sheets e a Google Calendar — gestisce info, prenotazioni, richieste
  galeniche, ritiri, cancellazioni, promemoria automatici e listino
  prezzi/offerte. Il sito (ancora in test, non pubblicato) rimanda al
  numero di test del bot, **+39 329 7751951**. Il numero definitivo
  della farmacia, **327 3615213** (già in uso sul sito istituzionale
  attuale), sostituirà quello di test in tutte le CTA solo al lancio
  ufficiale del nuovo sito — non anticiparlo prima che il titolare lo
  confermi.
- **Chatbot** (`chatbot/`): kit del bot WhatsApp — Meta Cloud API +
  n8n self-hosted su VPS Contabo + Google Sheets (gestionale) + Google
  Calendar. Guida in `chatbot/README.md`, workflow importabile in
  `chatbot/n8n/`. Nessun segreto nel repo: il `.env` vive solo sul VPS.
  La cartella non fa parte del sito, ma su `main` verrebbe pubblicata
  da Netlify come file statici (innocuo, niente credenziali).
- **Contatti**: tutte le CTA aprono il Chatbot su WhatsApp
  (wa.me/393297751951, numero di test — vedi nota sopra). La riga
  "Telefono" mostra solo il fisso 079 278245 (il numero del bot non è
  pensato per chiamate vocali). Email: clienti@parafarmaciasassari.it ·
  Indirizzo: Via Silvio Vardabasso 1/a, Sassari.
- **Intro/loader**: dura 3s + 2s di dissolvenza (già accorciata: non
  allungarla di nuovo).
