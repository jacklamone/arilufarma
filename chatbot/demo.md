# Demo del Chatbot al Dott. Conti

Scaletta per far provare il bot dal vivo. Dura circa 15 minuti: i primi 8 sono
la demo vera, il resto sono domande. L'ordine conta — parte da quello che
funziona meglio e arriva al galenico, che è il pezzo che gli interessa di più.

## Prima di iniziare (il giorno prima, non la mattina stessa)

- [ ] **Numero WhatsApp dedicato.** Quello di test è un numero personale: va
      sostituito. Il numero nuovo va registrato sulla Cloud API di Meta e
      **non deve essere già attivo su WhatsApp normale**, altrimenti la
      verifica fallisce. Fallo con qualche giorno di anticipo.
- [ ] Manda tu un messaggio al bot e verifica che risponda: la finestra di
      24h di WhatsApp va aperta, altrimenti il primo messaggio del cliente
      può arrivare in ritardo.
- [ ] Controlla che n8n sia acceso e il workflow **attivo** (non basta che sia
      importato).
- [ ] Apri il foglio «ArilùFarma · Gestionale bot» su un secondo schermo: a un
      certo punto glielo fai vedere ed è metà della vendita.
- [ ] Svuota le prenotazioni di prova dal Calendar, così l'agenda che gli
      mostri è pulita.

## Come aprire

Non presentarlo come "un chatbot". Presentalo come **un collaboratore che
risponde quando la parafarmacia è chiusa**:

> "Dottore, questo risponde ai clienti alle 22 di sera e la domenica. Le
> prenotazioni gliele scrive in agenda da solo. Le faccio vedere: mi detti lei
> le domande, così non sembra che l'abbia preparato."

Quella frase finale è importante: fagli fare **le sue** domande. Un bot che
regge le domande vere convince dieci volte più di uno script.

## La scaletta

### 1. Orari e dove siete (30 secondi)

> "A che ora aprite domenica?" · "Dove siete?"

Serve solo a far vedere che risponde subito e in italiano naturale. Non
soffermarti.

### 2. Un prodotto col prezzo vero (il momento chiave)

> "Quanto costa l'Okitask?"

Risponde **4,90 euro**, che è il prezzo del suo sito. Qui fermati un attimo e
dillo esplicitamente: *"questo è il suo prezzo, preso dal suo listino — il bot
non se lo inventa"*. È la frase che prepara il punto 3.

Altri con prezzo reale: Armolipid, Vicks Sinex, Crema Caudalie, Listerine,
Normolip. Sono sei: se lui ne chiede un settimo, cade nel caso 3 — che va
bene, è previsto.

### 3. Un prodotto senza prezzo (trasformare il buco in argomento)

> "Quanto costa il Vinoperfect siero?"

Il bot risponde che il prodotto c'è ma che il prezzo glielo confermano in sede
o al telefono. **Questo è voluto e va spiegato come tale:**

> "Il bot conosce già tutto il suo catalogo, ma i prezzi restano in mano sua.
> Non le dirà mai un prezzo vecchio o sbagliato a un cliente: finché non ce li
> dà lei, dice 'glielo confermiamo in sede'. Appena mi passa il listino — o
> quando colleghiamo Winfarm — i prezzi compaiono qui e si aggiornano da soli."

Se lo dici prima che lo noti lui, è una funzione di sicurezza. Se lo noti
dopo, sembra un pezzo mancante. **Dillo prima.**

### 4. La richiesta galenica (il cuore)

> "Ho la pelle che si arrossa con le creme del supermercato, avete qualcosa?"

Il bot riconosce che è un caso da preparato su misura, non propone un prodotto
a caso, e raccoglie i dati per il Dott. Conti. Fagli notare che **non inventa
formulazioni**: raccoglie e passa a lui.

Questo è il punto in cui capisce che non è un risponditore automatico.

### 5. La prenotazione (fagliela vedere in agenda)

> "Vorrei prenotare una spirometria giovedì mattina."

Il bot propone gli orari liberi, conferma, e **scrive l'appuntamento in Google
Calendar**. Qui giri lo schermo e gli fai vedere l'evento comparso.

Poi:

> "Anzi scusi, me la sposta a venerdì?"

La modifica funziona e l'agenda si aggiorna. È il momento che convince di più
perché tocca il suo lavoro vero, non una chiacchiera.

### 6. Il promemoria

Spiega (non serve dimostrarlo dal vivo) che il giorno prima il cliente riceve
un promemoria automatico, **solo se ha dato il consenso**. Il consenso è già
gestito: è un punto che a un titolare interessa, perché è quello che gli
riempie o gli svuota l'agenda.

## Cosa NON far provare

- **Le offerte**: la scheda è ancora vuota, ci risponde poco. Se chiede,
  digli che si collega alle sue pagine Facebook/Instagram — è già previsto.
- **Disponibilità a magazzino**: il bot non sa cosa c'è in scaffale finché non
  colleghiamo Winfarm. Se glielo chiede, la risposta onesta è "quello arriva
  col gestionale".
- Non usare frasi tipo "fa tutto da solo": se poi trova un limite, perde
  fiducia su tutto il resto.

## Come chiudere

Due cose concrete da chiedergli, non una richiesta generica:

1. **Il listino prezzi.** Ha già il file pronto: `prezzi-da-confermare.csv`,
   ordinato per priorità. Digli che **non deve riempirlo tutto**: le prime due
   sezioni (farmaci da banco e galenici, ~50 righe) bastano per avere il bot
   completo. Il resto può seguire con calma.
2. **Il numero definitivo.** Se vuole andare in produzione col 327 3615213,
   quel numero va migrato sulla Cloud API — e nel frattempo non può più essere
   usato con WhatsApp normale sul telefono. È una decisione sua e va posta
   chiaramente, perché è irreversibile a breve termine.

Il messaggio di chiusura è: *il bot è pronto, mancano i suoi dati.* Che è vero
e lo mette lui al centro della decisione.
