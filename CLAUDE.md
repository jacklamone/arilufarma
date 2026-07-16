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
- **Assistente virtuale WhatsApp** (sezione `#assistente`): chatbot in
  sviluppo da parte del titolare del progetto, collegato a un gestionale
  e a Google Calendar. Numero WhatsApp: 327 3615213. Il sito ne parla al
  presente perché sito e bot vanno live insieme.
- **Contatti**: tutte le CTA aprono WhatsApp (wa.me/393273615213).
  Tel: 079 278245 · Email: clienti@parafarmaciasassari.it
  Indirizzo: Via Silvio Vardabasso 1/a, Sassari.
- **Intro/loader**: dura 3s + 2s di dissolvenza (già accorciata: non
  allungarla di nuovo).
