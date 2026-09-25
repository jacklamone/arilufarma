# ArilùFarma — sito Parafarmacia Sassari

Sito di **ArilùFarma**, parafarmacia galenica a Sassari (Dott. Luca Conti,
dal 2011). Cliente dell'agenzia Intellecta Solutions. Demo pubblicata su
**ariludemo.netlify.app** (account Netlify "contigiacomo", piano a crediti).

## Regole fondamentali

- **Deploy automatico**: ogni push su `main` va in produzione via Netlify
  (sito statico, nessun build command, publish directory `/`).
- **Lingua**: solo italiano.
- **Niente framework**: HTML/CSS/JS statici in un unico `index.html`
  (stili e script inline), più `privacy.html`, `cookie.html` e
  `note-legali.html`.
- Se l'account Netlify esaurisce i crediti i deploy vengono "Skipped":
  si sbloccano da soli al rinnovo mensile (poi serve un nuovo push o
  "Trigger deploy"). Ogni deploy di produzione costa 15 crediti: meglio
  raggruppare le modifiche invece di pubblicarle una alla volta.
- **GitHub Pages**: anteprima gratuita, attiva da `main` / root su
  **jacklamone.github.io/arilufarma**, si aggiorna a ogni push senza
  consumare crediti. `.nojekyll` fa servire i file così come sono (niente
  Jekyll, niente `.md` trasformati in pagine): non toglierlo.
- **Noindex in demo**: tutte le pagine hanno
  `<meta name="robots" content="noindex, nofollow">` perché il sito è
  ancora in test. **Toglierlo al lancio ufficiale**, insieme al cambio del
  numero WhatsApp (vedi sotto). Non usare `Disallow` in un robots.txt al
  suo posto: impedirebbe ai motori di leggere il noindex.

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
  La cartella non fa parte del sito, ma su `main` viene pubblicata da
  Netlify e da GitHub Pages come file statici (innocuo, niente
  credenziali, ma raggiungibile da chi conosce il percorso).
- **Contatti**: tutte le CTA aprono il Chatbot su WhatsApp
  (wa.me/393297751951, numero di test — vedi nota sopra). La riga
  "Telefono" mostra solo il fisso 079 278245 (il numero del bot non è
  pensato per chiamate vocali). Email: clienti@parafarmaciasassari.it ·
  Indirizzo: Via Silvio Vardabasso 1/a, Sassari.
- **Intro/loader**: dura 3s + 2s di dissolvenza (già accorciata: non
  allungarla di nuovo).
- **Footer**: credito "© 2026 [logo] Intellecta Solutions" con link a
  intellectasolutions.it (logo in `assets/img/intellecta-logo.webp`).
  Le scritte del footer sono tarate per stare sopra 4,5:1 di contrasto:
  non riabbassarle.
- **Pulsante "Su"**: in basso a destra, centrato sopra il FAB WhatsApp.
