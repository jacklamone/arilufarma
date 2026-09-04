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

## Punto 3 — parser italiano a regex — risolto

Ultimo punto dell'audit originale rimasto aperto. Due difetti concreti nel
nodo `Stato prenotazione`:

- `findOra` prendeva qualsiasi numero fra 7 e 20 nel messaggio, senza
  contesto: "per mia figlia di 9 anni" diventava un orario delle 09:00.
- `findName` accettava qualsiasi frase di 2-3 parole di sole lettere che
  non fosse un servizio o un giorno noto: "buona giornata" o "come va"
  diventavano il nome del cliente.

**`findOra` corretto** scandendo tutti i numeri del messaggio (non solo il
primo) e scartando quelli con un'età davanti ("di 9 anni", "ho 15 anni") o
un'unità dietro che non è un orario (persone, euro, gocce, compresse,
mesi...). Il primo numero che sopravvive ai due controlli vince.

**`findName` corretto** con un elenco di parole italiane molto comuni
(saluti, cortesie, avverbi come "buona", "giornata", "come", "va", "bene")
che scartano la frase se anche una sola compare fra le parole candidate —
invece di provare a enumerare ogni possibile frase di cortesia, si scarta
in base alle parole che la compongono.

Verificato eseguendo le VERE funzioni del file (non una trascrizione a
mano) estratte ed eseguite in isolamento: 7 casi che dovevano rompersi
(gli esempi dell'audit) tutti corretti, 13 casi reali della giornata
(orari, giorni, nomi, servizi visti nelle conversazioni di test) tutti
invariati. Rieseguiti anche i due scenari end-to-end completi già usati
in precedenza (prenotazione normale a più messaggi, contaminazione fra
prenotazioni diverse): nessuna regressione. Applicato a bot disattivato,
verificato sul codice live, poi riattivato.

## Errore mio: nodo di reset diventato permanente — causato e risolto in produzione

Per far testare al titolare il bot "da cliente nuovo", ho inserito
temporaneamente nel percorso reale (dopo `Filter`, prima di `Dedup
messaggi e pulizia memoria`) un nodo che cancellava `data.booking`,
`data.lastBot`, `data.known`, `data.lastWamid` per un numero specifico,
prima di ogni altra logica. Un primo tentativo con esecuzione manuale
(`execute_workflow` in modalità "manual") sembrava riuscito — la
cancellazione veniva letta correttamente nella stessa esecuzione — ma le
scritture fatte in modalità manuale **non vengono persistite** nello
storage condiviso: solo le esecuzioni reali (webhook) scrivono in modo
duraturo. Il messaggio di prova successivo ha ritrovato la vecchia
prenotazione intatta, a conferma che il primo tentativo non aveva
funzionato.

Ho quindi innestato la stessa pulizia direttamente nel percorso reale,
condizionata al numero di telefono specifico, e pubblicato. **Errore di
progettazione**: il nodo non aveva alcuna condizione di "una tantum" — a
ogni messaggio in arrivo da quel numero, cancellava di nuovo tutto prima
che il resto della pipeline potesse leggerlo. Il primo messaggio dopo la
pubblicazione ("Ciao") ha funzionato correttamente (reset e primo
messaggio riconosciuti bene). Dal secondo messaggio in poi, il bot ha
trattato OGNI messaggio come il primo: informativa privacy reinviata a
ripetizione, nessuna prenotazione o contesto conservato tra un messaggio e
l'altro, perché lo stato veniva azzerato prima di poter essere letto dal
turno successivo.

Rimosso il nodo entro ~3 minuti dalla segnalazione. Verificato con una
lettura mirata (mai una scrittura) che lo stato per quel numero, dopo la
rimozione, fosse pulito e coerente — nessuna prenotazione a metà, ultima
risposta del bot correttamente registrata, flag "già visto" corretto
(scritto da `Segna cliente visto`, a valle del nodo difettoso, quindi mai
compromesso). Nessun danno residuo per altri numeri: la condizione
`wa === TARGET_WA` rendeva il nodo trasparente per chiunque altro in
tutto l'intervallo in cui è stato attivo.

Nodi e connessioni verificati byte per byte identici allo stato precedente
il test, prima di ripubblicare.

## Ramo che scavalca l'AI — risolto

Ultimo punto dell'audit originale: `Conferma veloce?` → `Conferma già fatta`
rispondeva con testo preconfezionato ("Sì, è confermato ✅ ...") quando il
cliente chiedeva conferma di una prenotazione già `booked`, basandosi sulle
stesse regex del nodo `Stato prenotazione`, senza mai passare dall'AI Agent.

La verifica ha trovato un problema più serio di quello originariamente
descritto. Mappando le connessioni:

```
Conferma già fatta → Send message + Log conversazione
```

Questo ramo bypassava **anche** `Consolida stato prenotazione` — l'unico
nodo che scrive `data.lastBot[wa]`, la memoria di "cosa ha detto l'ultima
volta il bot". Ogni volta che scattava questa scorciatoia, quella memoria
non veniva aggiornata: al messaggio successivo `Stato prenotazione` ragionava
su una risposta del bot più vecchia di quella appena inviata, con rischio di
interpretare male una successiva risposta "sì/no" del cliente (es. sul
promemoria) basandosi su un contesto superato.

Prova concreta che il disallineamento non era una novità: dentro
`Consolida stato prenotazione` esisteva un riferimento di fallback a
`$('Conferma già fatta').first().json.output`, scritto per un collegamento
che di fatto non esisteva — quel nodo non è mai stato raggiungibile da lì.
Codice morto che tradiva l'inconsistenza.

**Corretto rimuovendo interamente la scorciatoia**, non solo aggiustandone
il contenuto: eliminati i nodi `Conferma veloce?` e `Conferma già fatta`,
il ramo di `È un'immagine?` che vi confluiva ora va direttamente ad
`AI Agent`. Il nodo `Stato prenotazione` genera comunque, per ogni
messaggio, la nota `[PRENOTAZIONE GIÀ SALVATA: ... Citala SOLO se chiede
conferma.]`: l'AI Agent può rispondere correttamente a "è confermato?"
usando lo stesso stato, ma passando dal percorso normale — con verifica
del linguaggio naturale e consolidamento della memoria intatti, invece di
un template che non verificava nulla e disallineava la memoria del bot.

Il riferimento morto in `Consolida stato prenotazione` è stato lasciato
(non causa errori: è il terzo termine di un OR che in JavaScript va in
corto circuito — non viene mai valutato perché il termine precedente,
`$('Normalizza risposta').first().json.output`, è sempre valorizzato sul
percorso ora unico). Verificato che nessun altro nodo referenziasse i due
nodi rimossi prima di eliminarli. Applicato a bot disattivato, verificato
sul codice live, poi riattivato.

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

## Promemoria saltato prima della conferma (4 settembre)

Test live del titolare: prenotazione Glicemia per "Angelo Fonte", tutti i
campi noti (servizio, giorno, ora, nome). Invece di chiedere il promemoria,
l'AI Agent ha chiamato direttamente `Controlla_disponibilita` e
`Salva_prenotazione`, saltando la domanda obbligatoria.

**Verifica con i dati reali (non a naso):** confrontate due esecuzioni con
uno stato IDENTICO (tutti i campi noti, `reminderAsked:false`,
`reminder:''`) — stessa nota `bookingLine` inviata all'agente in entrambi i
casi:
- Esecuzione `59926` (Glicemia, "Angelo Fonte"): l'agente NON ha chiesto il
  promemoria ed è passato subito alla prenotazione.
- Esecuzione `60098` (Foro lobi, stesso cliente, ~40 minuti dopo): con la
  stessa identica nota, l'agente HA chiesto correttamente "Vuole ricevere
  un promemoria su WhatsApp il giorno prima? (Sì/No)".

Quindi non è un bug deterministico del codice: è un'istruzione che vive solo
nel system prompt generale ("chiedi il promemoria prima di salvare") e che il
modello, in un caso su due, non rispetta perché la nota di stato
(`Stato prenotazione`) non la ripete esplicitamente in quel turno — a
differenza di ogni altro caso limite (prenotazione già salvata, prenotazione
da confermare, promemoria già deciso), che invece hanno tutti un'istruzione
imperativa dedicata nella nota.

**Fix:** in `stato-prenotazione.js`, quando servizio+giorno+ora+nome sono
tutti noti ma il promemoria non è stato né chiesto né deciso, la nota ora
aggiunge esplicitamente: "Tutti i dati sono completi: prima di salvare o
chiedere conferma, chiedi ORA se vuole il promemoria WhatsApp il giorno
prima (sì/no). Vietato salvare senza aver chiesto il promemoria."

Verificato prima del deploy: script che rigioca lo stato esatto
dell'esecuzione `59926` contro il file corretto conferma che la nota ora
contiene l'istruzione; rieseguiti anche `scenario.json`/`scenario2.json`
(harness esistente) senza regressioni. Pubblicato su n8n con protocollo
unpublish → edit → verifica su bozza → publish.

**Nota collaterale, non un bug:** nello stesso screenshot il titolare ha
notato "venerdì 5 settembre" poi corretto in "venerdì 4 settembre". Nei log
reali di quella conversazione (esecuzioni 59918→59929) il bot ha sempre
detto "venerdì 4 settembre", mai il 5 — la data del 5 compare solo dentro
gli eventi calendario di ALTRI clienti restituiti da `Controlla_disponibilita`
(che elenca tutti gli appuntamenti dei prossimi 14 giorni, non solo quello
richiesto). Il "5 settembre" visto dal titolare è quasi certamente un
messaggio precedente, non generato da questo scambio: nessuna correzione di
codice fatta su questo punto, da tenere d'occhio se si ripresenta con nuovi
log a supporto.

## "Spazzolini elettrici" non trovati a listino, pur essendoci (4 settembre)

Segnalazione del titolare: chiedendo al bot "spazzolini elettrici" (plurale),
risposta "Non risultano spazzolini elettrici a listino" — ma nello sheet
`Prodotti` ci sono 19 spazzolini elettrici Oral-B. Chiedendo invece "Oral-B"
o "spazzolino elettrico" (singolare) il bot li trovava.

**Causa verificata sui dati reali** (workflow separato `ArilùFarma · Consulta
listino`, ID `Sld2FlyBwuEHKYsY`, il sub-workflow/tool che il bot usa per
interrogare `Prodotti`/`Galenici`/`Servizi`/`Offerte`): il nodo `Filtra
corrispondenze` cerca per sottostringa pura, senza alcuna gestione di
singolare/plurale. Le righe del prodotto hanno `categoria` = "Oral-B -
Spazzolino elettrico - ..." (singolare); la query del cliente era "spazzolini
elettrici" (plurale). "spazzolini" non è una sottostringa di "spazzolino" né
viceversa (divergono sull'ultima lettera), quindi zero corrispondenze — pur
essendoci 19 righe pertinenti nello sheet. Confermato eseguendo la ricerca
reale contro il dump delle righe usato in quell'esecuzione.

**Fix:** aggiunta una "stemmatura" leggera per l'italiano — nel confronto per
sottostringa, ai token di ricerca di almeno 5 lettere si toglie la vocale
finale prima di cercarli nel nome/categoria del prodotto ("spazzolini" →
"spazzolin", che è sottostringa sia di "spazzolini" che di "spazzolino").
Verificato offline contro un dump reale delle righe di `Prodotti`: la query
"spazzolini elettrici" ora restituisce le stesse 19 righe di "spazzolino
elettrico"; nessuna variazione sui casi già funzionanti (nomi esatti, Oral-B,
Caudalie, ecc.). Pubblicato con lo stesso protocollo unpublish → edit →
verifica su bozza → publish.

**Nota collaterale, non risolta — "le specifiche tecniche si incasinano":**
lo sheet `Prodotti` NON ha una colonna di specifiche tecniche reali (durata
batteria, modalità di spazzolamento, sensore di pressione, ecc.): la colonna
`categoria` contiene solo la composizione della confezione ("1 spazzolino +
1 testina", "spazzolino + custodia"). Quando il titolare ha chiesto "dettagli
tecnici" su Oral-B Pro 2 vs Pro 3, il bot non aveva quei dati da restituire
E ha anche perso il filo di quali due prodotti si stesse parlando (ha
richiesto di nuovo "a quale prodotto si riferisce" invece di riusare il
contesto dei 2 messaggi precedenti). Questo non è stato corretto in questa
sessione: sono due problemi distinti — (a) dato mancante nel gestionale, da
aggiungere se si vuole che il bot risponda su specifiche tecniche vere, (b)
un'incoerenza di memoria conversazionale dell'AI Agent su cui servirebbe più
segnale reale prima di intervenire (osservato una sola volta finora).

## Caratteristiche tecniche prodotti: eccezione controllata alla regola anti-invenzione (4 settembre)

Richiesta esplicita del titolare: quando il bot riconosce un prodotto di
marca reale (es. "Oral-B CrossAction"), vuole che usi la propria conoscenza
generale per descriverne le caratteristiche tecniche e confrontarlo con
altri modelli — non solo i dati (incompleti) del gestionale.

**Perché non è stata una modifica automatica.** Il prompt dell'AI Agent ha
una regola esplicita, scritta in cima a tutte le altre: "non inventare MAI
nulla — disponibilità, prodotti, prezzi, orari...". È lì apposta, per lo
stesso motivo per cui questa bonifica esiste (i danni della gestione
precedente). Allargarla senza delimitarla avrebbe riaperto lo stesso rischio.
Ho proposto al titolare due opzioni delimitate (solo specifiche tecniche con
avviso, oppure anche confronti/consigli più ampi tra prodotti) e lui ha
scelto la seconda.

**Fix (nodo "AI Agent", `options.systemMessage`):**
- Aggiunta un'ECCEZIONE esplicita alla regola anti-invenzione, in coda alla
  regola stessa: vale SOLO per caratteristiche tecniche e confronti tra
  prodotti di marca reali (riconosciuti dal cliente o trovati da
  Consulta_listino). Impone SEMPRE una frase che chiarisce sono info
  generali da confermare in negozio. Esplicitamente NON estesa a prezzo,
  disponibilità a scorta, presenza a listino (quelli restano solo dal
  gestionale) né a farmaci/integratori/dosaggi/posologie/consigli di
  salute — quella parte della regola resta blindata come prima.
- Aggiunta una riga nella sezione LISTINO che rimanda a questa eccezione nel
  punto in cui il bot risponde su un prodotto.

Verificato che il testo sia stato salvato sul nodo prima di pubblicare
(protocollo unpublish → edit → verifica su bozza → publish). Non ancora
testato in una conversazione reale: da verificare al prossimo test del
titolare che questa risposta sia effettivamente più completa mantenendo
l'avviso e senza toccare prezzo/disponibilità.

## "Differenze tra pro 1 e pro3?" non trovava i prodotti, anche dopo il fix precedente (4 settembre)

Test del titolare subito dopo l'aggiunta dell'eccezione per le specifiche
tecniche: chiesto "quali elettrici avete" (risposta corretta, elenco
completo grazie al fix precedente), poi "Differenze tra pro 1 e pro3?" — il
bot ha risposto "Non riesco a capire a quali 'Pro 1' e 'Pro 3' si riferisca
dal listino. Mi scrive il nome completo del prodotto o il marchio?", pur
avendo appena elencato lui stesso "Pro 1" e "Pro 3" nel messaggio precedente.

**Causa verificata sui dati reali** (esecuzione del sub-workflow "Consulta
listino" collegata alla conversazione): l'AI Agent ha chiamato
`Consulta_listino` con `Query: "pro 1 pro3"`. Il motore di ricerca cercava
per SOTTOSTRINGA libera (anche dopo il fix del 4/9 sul singolare/plurale):
il token "pro" (3 lettere) risultava contenuto non solo nei veri prodotti
Oral-B "Pro" ma anche in parole completamente estranee che lo contengono per
caso — "Vino**pro**tect", "Foto**pro**tector" (creme solari Caudalie/ISDIN),
"**Pro**ctolyn" (crema emorroidi). Con oltre 15 righe a punteggio identico,
i risultati sono limitati a 8: le creme solari e la crema emorroidi
comparse PRIMA nel foglio Prodotti hanno riempito tutti gli 8 posti,
espellendo dai risultati sia "Oral-B Pro 1" che "Oral-B Pro 3".

**Fix:** il confronto ora richiede che il token di ricerca corrisponda a una
PAROLA INTERA (dopo la stessa stemmatura singolare/plurale) nel nome o nella
categoria del prodotto, non più a una sottostringa libera ovunque nel testo.
"pro" trova così la parola "pro" (es. in "Pro-Expert", "Pro 1", "Pro 3") ma
non più "protect" o "proctolyn", che non sono la parola "pro" ma parole
diverse che iniziano per caso con le stesse tre lettere.

Verificato offline contro l'intero catalogo reale di `Prodotti` (120 righe):
la query "pro 1 pro3" ora restituisce tutti gli 8 prodotti Oral-B della
linea Pro, inclusi Pro 1 e Pro 3, zero falsi positivi da Vinosun/
Fotoprotector/Proctolyn; riverificate anche le query già corrette in
precedenza ("spazzolini elettrici", "oral b", "creme viso", "testine di
ricambio") senza regressioni. Pubblicato con lo stesso protocollo unpublish
→ edit → verifica su bozza → publish.

## "Batteria?" dopo un confronto tra prodotti: il bot chiede di nuovo il nome (4 settembre)

Test del titolare subito dopo il fix "parola intera" sul listino: chiesto
"Differenze tra pro 1 e pro 3?" (risposta corretta, confronto e caratteristiche
tecniche grazie all'eccezione del punto precedente), poi "Batteria?" — il bot
ha risposto "Intende una batteria per un dispositivo specifico...?" invece di
riferirsi ai due spazzolini appena discussi. Alla richiesta più esplicita
"Tra i due spazzolini a confronto quale è la durata della batteria" ha
rifatto lo stesso errore, chiedendo di nuovo i nomi o una foto.

**Verificato PRIMA di ipotizzare un bug di memoria**, come da prassi di
questa bonifica: recuperato dai log reali il contenuto esatto passato al
modello (nodo "Simple Memory") nel momento in cui ha ricevuto "Batteria?".
La cronologia conteneva 20 messaggi, e includeva PER INTERO lo scambio
immediatamente precedente su "Differenze tra pro 1 e pro 3?", con entrambi i
prodotti nominati esplicitamente dal bot due messaggi prima. **Non è quindi
un problema di memoria/contesto tecnico** (contextWindowLength del nodo
Simple Memory è 12, la cronologia era completa e correttamente presente): il
modello aveva il dato davanti e non l'ha usato per collegare la domanda
ellittica ("Batteria?") ai prodotti appena discussi.

**Fix (nodo "AI Agent", `options.systemMessage`):** aggiunta un'istruzione
esplicita in due punti — in TONO (regola generale) e in LISTINO (caso
specifico) — che impone di riferire SEMPRE una domanda breve o ellittica
("batteria?", "prezzo?", "quale dura di più?", "tra i due...") ai
prodotti/servizi che il bot stesso ha appena nominato nel messaggio
precedente, controllando la cronologia immediatamente sopra prima di
richiedere di nuovo il nome. Stessa tecnica già usata per il salto del
promemoria: non un problema deterministico risolvibile nel codice, ma
un'istruzione esplicita che riduce la probabilità che il modello lo ignori.

Pubblicato con protocollo unpublish → edit → verifica su bozza → publish.
**Non ancora verificato in una conversazione reale successiva** (a differenza
degli altri fix di oggi, qui non è possibile un test offline: è
comportamento del modello, non logica deterministica) — da confermare al
prossimo test del titolare con un follow-up breve dopo aver nominato dei
prodotti.

## Riordino categoria sheet Prodotti (4 settembre)

Segnalazione del titolare: la scheda `Prodotti` del gestionale mescola senza
criterio farmaci da banco, spazzolini Oral-B e intere linee di cosmesi
(Caudalie, ISDIN), e la colonna `categoria` stessa è incoerente — a volte
un'etichetta singola ("Dolore", "Viso"), a volte "marca - linea - formato"
("Caudalie - Vinoperfect (schiarente) - 30 ml"), a volte
"categoria - principio attivo - confezione" ("Dolore/febbre - Paracetamolo -
10 supposte 1000mg"). Confermato controllando tutte le 119 righe.

**Decisione presa col titolare:** restare su un'unica scheda (niente schede
separate per genere, che avrebbero richiesto ampliare il sub-workflow
"Consulta listino" con nuovi nodi di lettura ad ogni categoria aggiunta,
visto che il bot già cerca su tutte le righe come un pool unico — dividere
in più schede non gli avrebbe dato nessun vantaggio di ricerca, solo più
manutenzione), ma pulire la colonna `categoria` con 7 etichette coerenti:
Farmaco da banco, Igiene orale, Cosmesi viso, Cosmesi corpo, Solare,
Integratore, Marca. Il dettaglio marca/linea/formato che stava nella vecchia
categoria è stato spostato in coda a `note`, non perso.

**Esecuzione:** creato uno script n8n una tantum
("ArilùFarma · Riordino categoria Prodotti", stesso pattern delle bonifiche
precedenti — creato, eseguito una volta con successo su tutte le 119 righe
confermato dalla risposta dell'API Google Sheets, poi archiviato) invece di
modificare le celle a mano. Tabella completa vecchia→nuova categoria salvata
in `riordino-categoria-prodotti-2026-09-04.md`, incluse le righe borderline
(soprattutto viso/corpo nelle linee Caudalie/ISDIN) segnalate per una
verifica del titolare, che di farmacia se ne intende più di me.

**Nota tecnica:** il sub-workflow "Consulta listino" mette in cache i dati
per 15 minuti (`$getWorkflowStaticData`): un test del bot fatto entro 15
minuti da una query precedente potrebbe ancora mostrare la vecchia
categoria fino allo scadere della cache. Non serve nessuna azione, si
autorisolve.

## "Ne avete altri?" risponde con prodotti a caso (4 settembre)

Test del titolare: "Avete spazzolino?" → risposta corretta (solo Oral-B,
grazie al riordino categoria di poco prima). Poi "Sì grazie, mi dice anche
se ne avete altri" → il bot ha risposto con Armolipid, Vicks Sinex, Crema
Caudalie, Listerine, Normolip: un farmaco, uno spray nasale, due creme e un
collutorio, niente a che vedere con gli spazzolini appena discussi.

**Verificato sui log reali PRIMA di sospettare il riordino categoria appena
fatto** (che invece ha funzionato perfettamente): la chiamata
`Consulta_listino` per "spazzolino" nel primo turno ha restituito
esattamente e solo gli 8 prodotti Oral-B pertinenti, nessun farmaco o crema
mischiato — la ricerca è pulita. Il problema è nel turno successivo: per
"mi dice anche se ne avete altri", l'AI Agent ha fatto **zero chiamate a
Consulta_listino** (confermato da `tool_calls.completed: 0` nei log) e ha
risposto citando prodotti che stavano nella cronologia della conversazione
per un motivo completamente diverso — probabilmente residui di uno scambio
precedente su un altro argomento, dato che la memoria (`Simple Memory`,
finestra di 12 messaggi) è condivisa per lo stesso numero di telefono
durante tutta la sessione di test, non si azzera ad ogni "argomento".

Stesso tipo di problema del "Batteria?" di prima (il modello non collega
correttamente il turno breve al contesto), ma qui più delicato: ha citato
prezzi reali (non inventati) ma per prodotti sbagliati, dando l'impressione
di una risposta autorevole quando invece è fuori tema.

**Fix (nodo "AI Agent", sezione LISTINO):** aggiunta un'istruzione esplicita
— quando il cliente chiede "altri/altro/un'alternativa" subito dopo un
risultato del listino, il bot DEVE richiamare Consulta_listino con una query
più ampia ma sullo STESSO argomento appena discusso (es. da "spazzolino" a
"spazzolino elettrico" o "igiene orale"), e non deve mai rispondere con
prodotti letti in uno scambio precedente su un argomento diverso solo
perché compaiono in cronologia, anche se i prezzi citati sarebbero reali.

Pubblicato con protocollo unpublish → edit → verifica su bozza → publish.
Come per il fix del "Batteria?", non testabile offline (comportamento del
modello, non logica deterministica): da confermare al prossimo test reale.

## File in questa cartella

| File | Contenuto |
|---|---|
| `arilufarma-whatsapp-bot.json` | export del workflow principale, riallineato al live (era fermo al 22 agosto, 19 nodi contro 41) |
| `stato-prenotazione.js` | sorgente del nodo Code `Stato prenotazione` |
| `dedup-messaggi-pulizia-memoria.js` | sorgente del nodo Code omonimo |
| `segna-cliente-visto.js` | sorgente del nodo Code omonimo |
| `consulta-listino-filtra-corrispondenze.js` | sorgente del nodo Code `Filtra corrispondenze` del sub-workflow `ArilùFarma · Consulta listino` (ID `Sld2FlyBwuEHKYsY`) |
| `arilufarma-reminder.json` | workflow dei promemoria |

Nota: `arilufarma-consulta-listino.json` era elencato qui ma non è mai stato
effettivamente esportato nel repo — solo il singolo nodo Code rilevante
(`consulta-listino-filtra-corrispondenze.js`, sopra) è stato salvato finora.
