# Bonifica del workflow n8n — settembre 2026

Nota di lavoro sulla messa in sicurezza del chatbot WhatsApp dopo alcuni
giorni in cui la gestione del workflow era stata affidata a un'altra AI
(Grok). Serve a non rifare l'analisi da capo: cosa era rotto, cosa è stato
corretto, cosa è rimasto aperto.

- **Workflow:** `Arilùfarma Chatbot Whatsapp`, ID `2jU0ab0ZSmHwSuKi`, attivo
- **Branch di lavoro:** `claude/whatsapp-chatbot-meta-n8n-nz2l1y`
- **Data della bonifica:** 3 settembre 2026

## Da sapere prima di toccare il workflow

**`update_workflow` salva in bozza, non in produzione.** Dopo una modifica,
`activeVersionId` resta sulla versione precedente finché non si pubblica
esplicitamente. Una correzione applicata e non pubblicata *sembra* fatta ma
il bot continua a girare il codice vecchio. Verificare sempre che
`versionId` e `activeVersionId` coincidano.

**L'export del workflow non contiene i riferimenti alle credenziali.** In
caso di reimport di `arilufarma-whatsapp-bot.json` vanno ricollegate a mano
(Google Sheets, Google Calendar, WhatsApp, OpenAI).

**Non pushare mai su `main`:** ogni push su main va in produzione su Netlify.

## Correzioni applicate

### 1. Riscrittura cablata di un appuntamento — risolto

Nel nodo Code `Stato prenotazione` c'era un blocco che riconosceva un
cliente specifico per nome, servizio, giorno e ora, e ne riscriveva giorno e
ora in silenzio, sul percorso di produzione:

```js
if (st.booked && !newIntent) {
  if (st.nome === '<nome cliente>' && st.servizio === '<servizio>'
      && st.giorno === 'lunedì' && st.ora === '09:00') {
    st.giorno = 'sabato'; st.ora = '11:00';
  }
} else {
```

Era il problema più grave: un appuntamento reale spostato senza che nessuno
lo avesse chiesto.

L'`if/else` esterno però è portante — quando la prenotazione è già salvata i
campi non vanno ri-estratti dal testo. Per questo la correzione **inverte la
condizione** invece di cancellare le righe:

```js
if (!(st.booked && !newIntent)) {
```

Il comportamento resta identico, meno la riscrittura. Sono stati tolti anche
i nomi dei clienti di test dalla nota iniettata nel prompt, sostituiti con
una formulazione generica.

Sorgente del nodo: `stato-prenotazione.js`. Commit `5a77dbb`.

### 2. Lock anti-sovrapposizione illusorio — risolto

Il mutex era costruito su `$getWorkflowStaticData('global')`, che n8n
persiste **solo a fine esecuzione** e che non è atomico fra esecuzioni
concorrenti: due messaggi simultanei leggevano entrambi "lock libero". Non
serializzava nulla, aggiungeva solo latenza.

Il costo vero era il ciclo di attesa: il nodo Wait `Attendi e riprova`
consumava slot di esecuzione. Al momento dell'analisi quattro esecuzioni
erano rimaste piantate in `running` senza mai concludersi (59160, 59195,
59196, 59197) e una era ferma in coda per mancanza di slot. Il sistema si
autosaturava.

**Nodi rimossi:** `Inizio tentativo`, `Lock libero o troppi tentativi?`,
`Attendi e riprova`, `Prendi lock memoria`.

I due nodi Code superstiti facevano più del lock, quindi sono stati
conservati e ripuliti anziché cancellati — cancellarli avrebbe rotto due
cose:

| Prima | Dopo | Cosa salva |
|---|---|---|
| `Leggi lock memoria` | `Dedup messaggi e pulizia memoria` | deduplica su `wamid`, che protegge dai retry di Meta — il caso di sovrapposizione realmente frequente — più la manutenzione di `booking`/`lastBot` |
| `Libera lock memoria` | `Segna cliente visto` | `data.known[wa]`, da cui dipende `Cliente gia visto?` per l'invio dell'informativa privacy |

**Percorso risultante:**

```
Filter → Dedup messaggi e pulizia memoria → Messaggio duplicato? → Cliente gia visto?
```

Sorgenti dei nodi: `dedup-messaggi-pulizia-memoria.js`,
`segna-cliente-visto.js`. Commit `d376d12`.

Il workflow è passato da 45 a 41 nodi. I 13 tool dell'AI Agent sono stati
verificati ancora tutti collegati.

### 3. Stato di prenotazione congelato e mai scaduto — risolto

Emerso provando il bot dal vivo dopo le prime due correzioni. Nella memoria
persistente del workflow era rimasta, sul numero del titolare, una
prenotazione fantasma:

```
servizio: "Vitamina D"   giorno: "lunedì"   ora: "09:00"
nome: "<nome di un altro cliente>"   booked: true   confirmed: true
```

È lo stesso stato che il codice cablato di Grok riconosceva. Rimuovere quel
codice non bastava: **questo è un dato**, salvato in
`$getWorkflowStaticData`, e sopravvive intatto a qualunque modifica al
codice.

Conseguenze osservate in produzione:

- Il bot era **congelato**. Quando una prenotazione risulta `booked`, il
  blocco di estrazione non aggiorna i campi dal messaggio (comportamento
  corretto in sé). Con uno stato fasullo bloccato su `booked: true`,
  qualunque cosa scrivesse il cliente il servizio restava "Vitamina D".
- A ogni messaggio l'agente riceveva la nota `[PRENOTAZIONE GIÀ SALVATA:
  … <nome di un altro cliente>]`. Il nome non arrivava dal prompt di
  sistema ma da questo dato.

Sotto c'era un difetto strutturale che avrebbe colpito anche i clienti veri:
**una prenotazione `booked` non scadeva mai.** Il campo `ts` si aggiorna a
ogni messaggio, quindi la pulizia a 7 giorni non scattava finché la persona
scriveva. Un cliente che prenota lunedì e torna dopo un mese sarebbe rimasto
bloccato sulla vecchia prenotazione.

**Correzione:** introdotto il campo `bookedDate`, la data dell'appuntamento
calcolata dal giorno della settimana nel fuso di Roma.

```js
if (st.booked && (!st.bookedDate || st.bookedDate < ymdRome(0))) clearBooking();
```

- Una prenotazione scade da sola quando il suo giorno è passato.
- Gli stati salvati prima che `bookedDate` esistesse non sono databili e
  vengono azzerati al primo messaggio: è questo che ha ripulito da solo lo
  stato lasciato da Grok, su tutti i numeri interessati.
- Se il giorno non è noto, `bookedDate` vale oggi: scade in giornata anziché
  restare per sempre.

La logica di scadenza è stata verificata su cinque casi (stato legacy,
prenotazione di oggi, futura, di ieri, nessuna prenotazione) prima di
andare in produzione.

### Non era una regressione

Verificato: il congelamento non è stato introdotto dalle correzioni 1 e 2.
Prima della correzione 1, con quello stato il codice entrava comunque nel
ramo che non ri-estrae i campi — e in più riscriveva giorno e ora. Il
blocco era identico. La correzione 1 ha rimosso la causa futura senza
ripulire il dato già scritto; serviva questo terzo intervento.

## Cosa Grok ha fatto bene — da conservare

**Il collegamento a Google Sheets funziona ed è un miglioramento reale.** I
fogli `DatiFissi`, `Servizi` e `Offerte` vengono letti, tenuti in cache 5
minuti e iniettati nel contesto. Il prompt di sistema è stato ripulito dai
dati fissi e rimanda al foglio: niente più orari o prezzi cablati. Se il
titolare cambia il gestionale, il bot cambia risposta.

Questa parte non va toccata in un'eventuale ulteriore bonifica.

## Rimasto aperto

### Esecuzioni piantate da chiudere a mano

Le quattro esecuzioni bloccate in `running` (59160, 59195, 59196, 59197)
**non si sbloccano da sole** e continuano a occupare slot. Vanno terminate
dalla sezione Executions dell'interfaccia n8n. Ora che il ciclo Wait non
c'è più non se ne creano di nuove.

### Nomi di clienti reali ancora nel prompt

Restano in due punti non coperti dalla correzione del nodo Code: il prompt
di sistema dell'**AI Agent** e la descrizione del tool
**`Controlla_disponibilita`**, nella forma "vietato citare `<nomi>`".
Paradossale: per dire all'agente di non nominarli, glieli si mette davanti a
ogni messaggio. Da sostituire con una formulazione generica, come già fatto
altrove.

### Parser italiano a regex

Circa 300 righe nel nodo `Stato prenotazione` estraggono servizio, giorno,
ora e nome dal testo con espressioni regolari. Due difetti verificati
leggendo il codice:

- `findOra` accetta qualsiasi numero fra 7 e 20 nel messaggio: "per mia
  figlia di 9 anni" diventa un appuntamento alle 09:00.
- `findName` accetta qualsiasi frase di 2-3 parole di sole lettere che non
  sia un servizio o un giorno: "buona giornata" diventa il nome del cliente
  "Buona Giornata".

È il lavoro più lungo e invasivo dei quattro.

### Ramo che scavalca l'AI

`Conferma veloce?` → `Conferma già fatta` risponde con testo preconfezionato
senza passare dall'agente, basandosi sulle stesse regex. Se lo stato interno
è sbagliato, il cliente riceve una conferma falsa.

## Nomi di clienti reali ancora nel prompt — risolto

Il titolare ha segnalato che la scheda "lock" era stata aggiunta al foglio
circa due giorni prima, e ha chiesto di controllare se Grok avesse
manipolato anche il prompt "su quel fronte". Verifica: nessuna manipolazione
legata a lock/attese/concorrenza nel prompt — ma la verifica ha comunque
trovato un problema reale, distinto, sullo stesso tema dei dati di clienti
esposti senza necessità.

Il nodo AI Agent ha due campi distinti: `options.systemMessage` (il prompt
di sistema statico, 15.681 caratteri) e `text` (il template per-turno che
assembla il messaggio umano con tutti i dati iniettati). I nomi di due
clienti del calendario di test — usati come esempio in una regola di
isolamento tra prenotazioni di clienti diversi — erano cablati in TRE punti,
non uno:

1. `AI Agent` → campo `text`: "Vietato citare Lucio Stolti, Antonio Profili
   o altri nomi presi dal calendario o dagli esempi." — iniettato a ogni
   singolo messaggio di ogni conversazione.
2. Tool `Controlla_disponibilita` → `toolDescription`: "Non usare nomi
   visti in calendario (Lucio Stolti, Antonio Profili, ecc.)..." — inviato a
   OpenAI a ogni turno come parte dello schema dei tool disponibili, anche
   quando il tool non viene chiamato.
3. `AI Agent` → `systemMessage`, riga "COGNOME ≠ SERVIZIO": un esempio
   didattico per insegnare che "Profili" è un cognome e non va confuso con
   "Profilo Lipidico". Qui il nome non serviva a sopprimere un cliente
   specifico ma a illustrare un pattern — however riusava per coincidenza
   il nome esatto di un cliente reale del calendario.

Il paradosso dei primi due: per dire all'agente di non nominare quei
clienti, li si metteva davanti al modello a ogni messaggio — l'esatto
contrario dell'obiettivo, oltre a mandare il nome di un cliente reale a un
fornitore terzo (OpenAI) su ogni conversazione, senza alcun beneficio
funzionale, per un'attività (parafarmacia) il cui stesso prompt tiene una
sezione GDPR dedicata.

**Corretto:**
1. e 2. sostituiti con una formulazione generica ("Vietato citare nomi di
   altri clienti presi dal calendario o dagli esempi." / "Non usare nomi
   visti in calendario come se fossero di questo numero.") — stessa
   protezione, senza esporre nomi specifici.
3. l'esempio "Antonio Profili" rimosso mantenendo "Profili" (cognome nudo)
   e "il mio cognome è profili" (pattern di frase), che coprono già
   interamente lo stesso caso d'uso didattico senza bisogno del nome
   completo.

Verificato con una scansione di tutti i nodi del workflow che non restassero
altre occorrenze, e che nessun altro tool o nodo contenesse pattern simili
(lock, attese, nomi di clienti). Applicato a bot attivo — modifiche di solo
testo statico, nessun codice eseguito, nessun rischio per l'esecuzione in
corso.

## Verifica di tutto l'ecosistema — 3 settembre, pomeriggio

Il titolare ha notato una scheda "lock" (colonne `wa_id`, `lock_time`) nel foglio
Google Sheets del gestionale e ha chiesto di verificare se fosse la causa dei
problemi. Non lo era: la scheda esiste ma **non è referenziata da nessun nodo
di nessun workflow** — entrambe le celle `lock_time` sono vuote, non è mai
stata scritta. È quasi certamente un primo tentativo di lock su foglio,
abbandonato a favore di quello in-memory (il vero colpevole, smontato al
punto 2 sopra).

La verifica si è allargata a tutti i workflow n8n collegati ad ArilùFarma.
Il server ne ospita 16 in totale; gli altri 9 appartengono a progetti non
correlati e non sono stati toccati. Dei 7 di ArilùFarma:

- **Consulta listino** (`Sld2FlyBwuEHKYsY`, attivo): pulito. Cache a 15 minuti
  su `$getWorkflowStaticData`, usata correttamente — qui un mancato hit
  occasionale causa solo una rilettura in più del foglio, mai un dato
  sbagliato, a differenza del vecchio lock dove la stessa tecnica serviva per
  un'esclusione reciproca che richiedeva atomicità vera.
- **Alert errori** (`Dc19orzkbQ0CHPYg`, attivo): ben scritto ma **non
  collegato**. Il workflow principale non lo designa come proprio "Error
  Workflow" nelle impostazioni, quindi non scatta mai. Il connettore n8n
  disponibile in questa sessione non espone un'operazione per impostare
  `settings.errorWorkflow` a livello di workflow — va collegato a mano:
  sul workflow principale, ☰ → Settings → Error Workflow → "ArilùFarma ·
  Alert errori" → Save.
- **Verifica e salva richiesta galenica** (`gOx6lRmSk5F8Uj6T`) e
  **Promemoria appuntamenti** (`JfkB8E2vQS5KfwuE`): entrambi precedenti
  all'episodio Grok (24 luglio), puliti, nessuna modifica necessaria.
- **Manutenzione gestionale** e **Setup listino (una tantum)**: script
  una-tantum già eseguiti con successo (valori incrociati e verificati
  contro il foglio live), disattivati, ora archiviati. Il primo conteneva
  una tabella cablata di 19 combinazioni nome+data di clienti reali — stesso
  pattern del punto 1, ma innocuo perché lo script non gira più
  automaticamente. Da non rieseguire: sui dati odierni non troverebbe
  corrispondenze nella tabella cablata e rischierebbe di sovrascrivere
  event_id validi con `'n/d'`.

## File in questa cartella

| File | Contenuto |
|---|---|
| `arilufarma-whatsapp-bot.json` | export del workflow principale, riallineato al live (era fermo al 22 agosto, 19 nodi contro 41) |
| `stato-prenotazione.js` | sorgente del nodo Code `Stato prenotazione` |
| `dedup-messaggi-pulizia-memoria.js` | sorgente del nodo Code omonimo |
| `segna-cliente-visto.js` | sorgente del nodo Code omonimo |
| `arilufarma-consulta-listino.json` | sub-workflow del listino |
| `arilufarma-reminder.json` | workflow dei promemoria |
