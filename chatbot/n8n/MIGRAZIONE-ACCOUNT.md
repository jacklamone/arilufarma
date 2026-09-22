# Migrazione a un account Google della farmacia

Procedura per portare foglio e calendario dall'account personale di chi ha
avviato il progetto a un account della farmacia, lasciando all'agenzia solo un
accesso revocabile.

Scritta il 22 settembre 2026 per ArilùFarma. **È il modello per ogni farmacia
successiva**: cambiano solo gli indirizzi.

## Gli attori

| Account | Cos'è | Dove finisce |
|---|---|---|
| `contigiacomo@gmail.com` | personale, oggi proprietario di tutto | **esce da tutto**, ultimo passo |
| `arilufarma@gmail.com` | della parafarmacia | **proprietario** di foglio e calendario |
| `intellectasolutions0@gmail.com` | tecnico dell'agenzia | Editor — è con questo che entra n8n |

Le credenziali n8n coinvolte sono due, e **non vanno sostituite: vanno
riautorizzate sullo stesso identificativo**, così nessuno dei venti nodi che le
usano va toccato.

| Credenziale | Id | Tipo |
|---|---|---|
| Google Sheets account | `LTDP9ep1K7yYgdac` | googleSheetsOAuth2Api |
| Google Calendar account | `DB2xEmeilwaFsdoX` | googleCalendarOAuth2Api |

## L'ordine conta

Il principio: **in nessun momento il bot deve trovarsi senza accesso.** Per
questo si aggiunge sempre prima di togliere, e l'account personale esce solo
alla fine, quando non serve più a nessuno.

### 1. Foglio — trasferimento di proprietà · lo fa il titolare

Il trasferimento di proprietà **non esiste nelle app da telefono**: va fatto dal
browser su computer.

1. `drive.google.com` → tasto destro su *ArilùFarma · Gestionale bot* → Condividi
2. Menu accanto a `arilufarma@gmail.com` → **Trasferisci proprietà**
3. L'account ArilùFarma riceve una mail e **deve accettare**

**L'ID del file non cambia** (`1Cisfepz44RSAvT5Tazh…`): i 16 nodi che leggono e
scrivono il foglio continuano a funzionare senza modifiche. Il vecchio
proprietario resta Editor in automatico, quindi il bot non si accorge di niente.

> **Non rimuovere `contigiacomo` dalla condivisione adesso**: è ancora la
> credenziale con cui n8n entra. Esce al passo 6.

### 2. Calendario — si ricrea, non si trasferisce · lo fa il titolare

Google Calendar **non permette di trasferire la proprietà** di un calendario
secondario. Si può solo condividerlo, ma resterebbe dell'account personale e
sparirebbe se quell'account venisse chiuso.

Quindi: da `arilufarma@gmail.com` si crea un calendario nuovo (es. «Farmacia»)
e lo si condivide con **entrambi**:

- `intellectasolutions0@gmail.com` → *Apportare modifiche agli eventi*
- `contigiacomo@gmail.com` → *Apportare modifiche agli eventi* (temporaneo,
  serve solo finché la credenziale n8n non è stata riautorizzata)

Poi si copia l'ID del calendario: Impostazioni del calendario → *Integra
calendario* → **ID calendario**, nella forma `…@group.calendar.google.com`.

**Non importare gli eventi vecchi.** Sono prove, e reimportandoli cambierebbero
comunque identificativo (vedi sotto).

### 3. Sostituzione dell'ID calendario nei workflow · lo fa l'agenzia

Cinque nodi, tutti nel chatbot principale:

`Prenota_appuntamento` · `Controlla_disponibilita` · `Cancella_appuntamento` ·
`Sposta_appuntamento` · `Leggi eventi calendario`

Si modifica la bozza a bot acceso, si confronta, si pubblica. Nessuna
interruzione.

### 4. Riautorizzazione delle credenziali n8n · lo fa l'agenzia

Nell'interfaccia n8n, per entrambe le credenziali: *Connect* → accedere con
`intellectasolutions0@gmail.com`. È un passaggio OAuth via browser, non si può
fare da fuori.

Da questo momento il bot entra come agenzia, non più come account personale.

### 5. Verifica su dati reali

Una prenotazione completa dal numero di test, poi si controlla l'evento creato
in calendario: il campo `creator` deve riportare
`intellectasolutions0@gmail.com` e non più `contigiacomo@gmail.com`.

Finché quel campo non cambia, la migrazione **non è finita**.

### 6. Uscita dell'account personale · lo fa il titolare

Solo ora, e in quest'ordine:

1. rimuovere `contigiacomo` dalla condivisione del calendario nuovo
2. rimuovere `contigiacomo` dalla condivisione del foglio

### 7. Pulizia

- righe di prova nel foglio Prenotazioni: gli `event_id` puntano a eventi del
  calendario vecchio, che non esiste più per il bot
- calendario vecchio: si può archiviare o eliminare

## La cosa che va vista prima, non dopo

Ricreando il calendario **cambiano anche gli identificativi dei singoli
eventi**. Quegli identificativi noi li salviamo nel foglio Prenotazioni, colonna
`event_id`, e sono esattamente quelli che il bot usa per annullare e spostare.

Dopo la migrazione ogni `event_id` salvato prima punta al nulla: alla richiesta
di annullare una prenotazione presa in precedenza il bot risponderebbe «non
risulta a questo numero».

Oggi sono tutti dati di test e non importa. **Dopo il lancio sarebbe un guaio
serio**, e non ci sarebbe modo di rimediare se non ricostruendo a mano la
corrispondenza fra vecchi e nuovi eventi. È il motivo per cui questa migrazione
va fatta prima di aprire al pubblico — e per ogni farmacia nuova va fatta
**prima** di prendere la prima prenotazione vera.

## Perché tutto questo

Non è pignoleria amministrativa: è la condizione che regge la frase da dire a
una farmacia, *«il numero è suo, l'account Google è suo, i dati dei suoi
pazienti sono nel suo Drive, noi abbiamo un accesso che lei può togliere quando
vuole»*.

Se il bot entra con la casella personale di qualcuno dell'agenzia, quella frase
è falsa. Se entra con un account tecnico dell'agenzia su file di proprietà della
farmacia, è vera per costruzione.

Vale anche per la seconda farmacia e per la decima: **stesso account tecnico,
stesse due credenziali, un foglio in più condiviso**. È quello che permette di
tenere un workflow solo invece di dieci copie.
