# Assistente WhatsApp ArilùFarma — guida di installazione

Chatbot WhatsApp della parafarmacia, come promesso nella sezione
*Assistente* del sito: richieste galeniche guidate, prenotazioni in
agenda, risposte a qualsiasi ora sul numero **327 3615213**.

## Architettura

```
Cliente su WhatsApp
        │
        ▼
Meta WhatsApp Cloud API  ──webhook──►  n8n (self-hosted, Contabo VPS)
        ▲                                  │
        └────────── risposte ──────────────┤
                                           ├──► Google Sheets   (gestionale: sessioni,
                                           │                     richieste, prenotazioni, log)
                                           ├──► Google Calendar (agenda appuntamenti)
                                           └──► WhatsApp del Dott. Conti (notifiche)
```

Cosa fa il bot (workflow `n8n/arilufarma-whatsapp-bot.json`):

- **Menu interattivo** al primo messaggio: preparato galenico,
  prenotazione, orari/contatti, parla con noi.
- **🧪 Richiesta galenica**: raccoglie la descrizione in testo libero,
  la salva nel foglio Google e avvisa il Dott. Conti su WhatsApp.
- **📅 Prenotazione** (analisi o consulenza): legge l'agenda su Google
  Calendar, propone i primi orari liberi nei 7 giorni successivi
  (rispettando gli orari di apertura), crea l'evento in calendario e
  conferma al cliente.
- **👤 Passaggio a operatore**: avvisa il titolare e il bot tace per
  24 ore su quella chat (o finché il cliente scrive `menu`).
- **⏰ Promemoria** (workflow separato): il giorno prima dell'appuntamento
  il cliente riceve un promemoria automatico su WhatsApp.
- **Registro messaggi** completo su Google Sheets.

Contenuto della cartella:

| File | Cosa è |
|------|--------|
| `docker-compose.yml` | n8n + Caddy (HTTPS automatico) per il VPS |
| `Caddyfile` | configurazione del reverse proxy |
| `.env.example` | modello delle variabili d'ambiente (da copiare in `.env` **solo sul VPS**) |
| `n8n/arilufarma-whatsapp-bot.json` | workflow principale del bot (da importare) |
| `n8n/arilufarma-reminder.json` | workflow dei promemoria appuntamento (da importare) |
| `fogli-google.md` | struttura del foglio Google (il "gestionale") |

> ⚠️ **Nessun segreto in questo repository.** Token, chiavi e `.env`
> vivono solo sul VPS. Ricorda che tutto ciò che finisce su `main`
> viene pubblicato su Netlify.

---

## 1 · Cosa serve prima di iniziare

- [ ] **VPS Contabo** — basta il taglio più piccolo (Cloud VPS 10,
      ~5 €/mese), con **Ubuntu 24.04**.
- [ ] **Un sottodominio** per il bot, es. `bot.parafarmaciasassari.it`
      (serve l'accesso al DNS del dominio).
- [ ] **Account Meta Business** verificato o verificabile della
      parafarmacia (business.facebook.com).
- [ ] **Il numero WhatsApp del bot: 327 3615213.** ⚠️ Se oggi quel
      numero è usato con l'app *WhatsApp Business* sul telefono, andrà
      **migrato alla Cloud API**: durante la registrazione su Meta il
      numero viene scollegato dall'app. Le chat esistenti sul telefono
      non si trasferiscono. Concordare il momento del passaggio col
      titolare. In alternativa: fare tutti i test con il numero di prova
      gratuito che Meta fornisce, e migrare il numero vero solo al go-live.
- [ ] **Account Google** della parafarmacia (per Sheets e Calendar).

## 2 · VPS Contabo

1. Ordina il VPS su contabo.com scegliendo **Ubuntu 24.04** come immagine
   e la regione europea. Ricevi via email l'IP e la password di root.
2. Primo accesso e messa in sicurezza:

   ```bash
   ssh root@IP_DEL_VPS

   apt update && apt upgrade -y

   # utente di lavoro
   adduser arilu
   usermod -aG sudo arilu

   # firewall: solo SSH, HTTP e HTTPS
   apt install -y ufw
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   ```

3. Installa Docker (procedura ufficiale):

   ```bash
   curl -fsSL https://get.docker.com | sh
   usermod -aG docker arilu
   ```

4. Consigliato: chiavi SSH al posto della password e
   `PasswordAuthentication no` in `/etc/ssh/sshd_config`.

## 3 · DNS

Nel pannello DNS del dominio crea un record:

```
Tipo A    bot.parafarmaciasassari.it    →    IP_DEL_VPS
```

Attendi la propagazione (da minuti a qualche ora). Verifica con
`ping bot.parafarmaciasassari.it`.

## 4 · Installazione di n8n

Da utente `arilu` sul VPS:

```bash
sudo mkdir -p /opt/arilubot && sudo chown arilu:arilu /opt/arilubot
cd /opt/arilubot

# copia qui i file di questa cartella: docker-compose.yml, Caddyfile, .env.example
# (via git clone del repo, oppure scp dalla tua macchina)

cp .env.example .env
openssl rand -hex 32   # → incolla il risultato in N8N_ENCRYPTION_KEY
openssl rand -hex 16   # → incolla il risultato in META_VERIFY_TOKEN
nano .env              # compila BOT_DOMAIN e le due chiavi appena generate
                       # (le variabili META_* e GOOGLE_* si compilano ai passi 5-6)

docker compose up -d
```

Apri `https://bot.parafarmaciasassari.it`: Caddy avrà già ottenuto il
certificato HTTPS e n8n ti chiede di creare l'**account proprietario**
(email + password robusta: è la porta d'ingresso a tutto, salvala nel
password manager dell'agenzia).

Dopo ogni modifica al file `.env`: `docker compose up -d` (ricrea i
container con le nuove variabili).

## 5 · Meta / WhatsApp Cloud API

### 5.1 App Meta

1. Vai su [developers.facebook.com](https://developers.facebook.com) →
   **My Apps → Create App** → tipo **Business**.
2. Nome app: `ArilùFarma Assistente`; collegala al Business Manager
   della parafarmacia.
3. Nella dashboard dell'app: **Add product → WhatsApp → Set up**.

### 5.2 Numero di telefono

**Fase di test (adesso).** In **WhatsApp → API Setup** Meta assegna in
automatico un **numero di prova** come *mittente* del bot (non si può
scegliere): è il numero a cui scriveranno i tester. In modalità di prova
il bot può però rispondere **solo ai numeri registrati come destinatari**
(max 5). Registra qui il numero di test concordato **+39 329 7751951**:
in **API Setup → riquadro "To" → Manage phone number list → Add phone
number**, poi conferma col codice che Meta invia via WhatsApp/SMS.
Aggiungi allo stesso modo ogni altro telefono che userai per provare
(incluso quello impostato in `TITOLARE_WA_ID`, vedi §5.6).

> In questa fase **non** tocchiamo il numero reale 327 3615213: resta sul
> sito e si migra solo al go-live.

**Go-live (più avanti).** Aggiungi il numero vero **327 3615213** da
**WhatsApp → Phone numbers → Add phone number** (verifica via SMS/chiamata;
vedi l'avvertenza sulla migrazione al punto 1). Imposta il display name
«ArilùFarma» — Meta lo deve approvare. A quel punto i destinatari di prova
non servono più: il bot può rispondere a chiunque scriva.

Copia l'**ID del numero di telefono** (Phone number ID, un numero lungo)
in `META_PHONE_NUMBER_ID` nel `.env`.

### 5.3 Token permanente (non quello di 24 ore!)

Il token che appare in API Setup **scade dopo 24 ore**: va bene solo per
i primissimi test. Per il token definitivo:

1. [business.facebook.com](https://business.facebook.com) →
   **Impostazioni Business → Utenti → Utenti di sistema** → crea un
   utente di sistema (es. `arilubot`, ruolo Amministratore).
2. **Aggiungi risorse** → assegna all'utente di sistema l'app
   `ArilùFarma Assistente` (controllo totale) e l'account WhatsApp.
3. **Genera token** → seleziona l'app, scadenza **Mai**, permessi
   `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Copia il token in `META_ACCESS_TOKEN` nel `.env` (e nel password
   manager: Meta non lo mostra più).

### 5.4 Importa e attiva il workflow

1. In n8n: **Workflows → Import from file** →
   `n8n/arilufarma-whatsapp-bot.json`.
2. Crea le credenziali Google (passo 6) e assegnale ai nodi che le
   chiedono (i nodi Google Sheets e i due nodi HTTP del calendario).
3. **Attiva il workflow** (interruttore in alto a destra): l'URL di
   produzione del webhook diventa
   `https://bot.parafarmaciasassari.it/webhook/whatsapp`.

### 5.5 Webhook

Nella dashboard dell'app Meta → **WhatsApp → Configuration → Webhook**:

- **Callback URL**: `https://bot.parafarmaciasassari.it/webhook/whatsapp`
- **Verify token**: il valore di `META_VERIFY_TOKEN` del tuo `.env`
- Clicca **Verify and save** (il workflow deve essere **attivo**,
  altrimenti la verifica fallisce).
- In **Webhook fields** abbonati a **`messages`**.

### 5.6 Template per le notifiche al titolare (consigliato)

WhatsApp permette messaggi "liberi" solo entro 24 ore dall'ultimo
messaggio ricevuto da quel contatto. Perché il Dott. Conti riceva le
notifiche **sempre**, serve un template approvato:

1. Business Manager → **Account WhatsApp → Gestione messaggi** (WhatsApp
   Manager) → **Template di messaggio → Crea template**.
2. Categoria **Utility**, lingua **Italiano**, nome `notifica_arilufarma`.
3. Corpo:

   ```
   🔔 {{1}}
   {{2}}
   Apri il gestionale per i dettagli.
   ```

4. Dopo l'approvazione (in genere pochi minuti/ore) metti il nome del
   template in `META_TEMPLATE_NOTIFICA` e il numero del titolare in
   `TITOLARE_WA_ID` (formato `39327…`, senza `+`).

Senza template il bot ripiega su un messaggio normale, che arriva solo
se il titolare ha scritto al bot nelle ultime 24 ore.

> **In fase di test** imposta `TITOLARE_WA_ID=393297751951` (il numero di
> test), così le notifiche del titolare le vedi tu. ⚠️ Con il numero di
> prova di Meta questo numero **deve** essere anche tra i destinatari di
> prova (§5.2), altrimenti le notifiche non partono. Al go-live sostituisci
> con il numero vero del Dott. Conti.

## 6 · Google Sheets e Google Calendar

### 6.1 Progetto Google Cloud

1. [console.cloud.google.com](https://console.cloud.google.com) → nuovo
   progetto `arilufarma-bot` (con l'account Google della parafarmacia).
2. **API e servizi → Libreria**: abilita **Google Sheets API** e
   **Google Calendar API**.
3. **Schermata consenso OAuth**: tipo **Esterno**, compila i campi
   minimi. In **Utenti di test** aggiungi l'account Google della
   parafarmacia (lo stato "In fase di test" va benissimo: l'app la
   usiamo solo noi).
4. **Credenziali → Crea credenziali → ID client OAuth** → tipo
   **Applicazione web**. Come **URI di reindirizzamento autorizzato**
   incolla quello che n8n mostra quando crei la credenziale (formato
   `https://bot.parafarmaciasassari.it/rest/oauth2-credential/callback`).
5. Copia **Client ID** e **Client Secret**.

### 6.2 Credenziali in n8n

In n8n → **Credentials → Add credential**:

1. **Google Sheets OAuth2 API**: incolla Client ID/Secret → **Sign in
   with Google** con l'account della parafarmacia → autorizza.
2. **Google Calendar OAuth2 API**: stessa procedura.
3. Apri il workflow e assegna le credenziali:
   - i 4 nodi **Google Sheets** (`Registra messaggio`, `Leggi sessione`,
     `Salva prenotazione`, `Salva richiesta galenica`, `Aggiorna sessione`)
     → credenziale Sheets;
   - i 2 nodi HTTP del calendario (`Eventi in agenda`,
     `Crea evento in agenda`) → credenziale Calendar.

### 6.3 Foglio e calendario

1. Crea il foglio Google seguendo **`fogli-google.md`** (4 schede con
   nomi e colonne esatti) e metti l'ID del file in `GOOGLE_SHEET_ID`.
2. Scegli il calendario per gli appuntamenti (consigliato: crearne uno
   dedicato «ArilùFarma · Appuntamenti», così il bot vede solo gli
   impegni della parafarmacia). Metti l'**ID calendario**
   (Impostazioni del calendario → Integrazione) in `GOOGLE_CALENDAR_ID`.
3. `docker compose up -d` per ricaricare il `.env`.

## 7 · Personalizzazioni da fare prima del go-live

Due punti del workflow contengono **gli orari di apertura** (ora
impostati a Lun–Ven 9:00–13:00 / 16:00–20:00, Sab 9:00–13:00 —
**da verificare col titolare**):

- nodo `Cervello del bot` → costante `ORARI_TESTO` (il testo mostrato
  al cliente in "Orari e contatti");
- nodo `Filtra slot liberi` → costante `ORARI` (le fasce in cui il bot
  propone appuntamenti) e `DURATA_MIN` (durata slot, ora 30 minuti).

Rileggi anche i testi dei messaggi nel `Cervello del bot` e adattali se
il titolare preferisce un altro tono.

## 8 · Collaudo

⚠️ In fase di test il numero di prova di Meta risponde **solo ai numeri
registrati come destinatari** (§5.2): verifica che **+39 329 7751951** e il
numero in `TITOLARE_WA_ID` siano nella lista. Se qualcosa non arriva, la
causa quasi sempre è un numero non whitelistato.

Con il workflow attivo, dal telefono di test **+39 329 7751951** scrivi al
numero di prova del bot:

- [ ] «Ciao» → arriva il menu con le 4 voci.
- [ ] **Orari e contatti** → arrivano orari, indirizzo, telefono.
- [ ] **Preparato galenico** → descrivi una richiesta → conferma al
      cliente + riga in `RichiesteGaleniche` + notifica al titolare.
- [ ] **Prenota → Analisi** → arriva la lista degli orari liberi →
      scegline uno → conferma + evento su Google Calendar + riga in
      `Prenotazioni`.
- [ ] Crea a mano un evento in calendario e verifica che quello slot
      **non** venga più proposto.
- [ ] **Parla con noi** → notifica al titolare; il bot non risponde più
      finché non scrivi «menu».
- [ ] Scrivi una frase a caso → il bot ripropone il menu.
- [ ] Ogni messaggio compare nella scheda `Messaggi`.

In caso di problemi: in n8n apri **Executions** e guarda l'esecuzione
fallita (mostra nodo per nodo dati e errore).

## 9 · Go-live

1. Migra il numero **327 3615213** alla Cloud API (passo 5.2) e ripeti
   il collaudo.
2. Verifica il **Business Manager** della parafarmacia (documenti
   aziendali): senza verifica il numero può avviare conversazioni verso
   massimo 250 contatti unici al giorno — le **risposte** ai clienti che
   scrivono per primi invece non hanno limiti, quindi per il nostro caso
   d'uso il bot funziona comunque.
3. Profilo WhatsApp Business (foto, descrizione, sito, orari) da
   WhatsApp Manager.
4. Il sito è già pronto: tutte le CTA puntano a `wa.me/393273615213`.

## 10 · Costi ricorrenti

| Voce | Costo |
|------|-------|
| Contabo Cloud VPS 10 | ~5 €/mese |
| n8n self-hosted (Community) | 0 € |
| Conversazioni WhatsApp avviate dal cliente (servizio) | 0 € |
| Template Utility (notifiche titolare) | pochi centesimi a invio |
| Google Sheets/Calendar | 0 € |

## 11 · Manutenzione

```bash
cd /opt/arilubot

docker compose logs -f n8n        # log in diretta
docker compose pull && docker compose up -d   # aggiorna n8n (circa 1 volta al mese)

# backup (dati n8n + certificati): salvare fuori dal VPS
docker run --rm -v arilubot_n8n_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/n8n-backup-$(date +%F).tar.gz -C /data .
```

- Il **token Meta permanente** non scade, ma se viene rigenerato va
  aggiornato nel `.env`.
- Se l'account **Netlify** esaurisce i crediti il *sito* non si
  aggiorna, ma il bot non c'entra: gira sul VPS ed è indipendente.

## 12 · Promemoria appuntamenti (workflow separato)

Il file `n8n/arilufarma-reminder.json` è un **secondo workflow**,
indipendente dal bot: ogni giorno alle **18:00** legge la scheda
`Prenotazioni`, trova gli appuntamenti del **giorno dopo** e invia a ogni
cliente un promemoria su WhatsApp. Gira una volta al giorno, quindi ogni
appuntamento riceve **un solo** promemoria (nessun doppione).

Poiché il promemoria parte il giorno prima — quasi sempre **oltre le 24
ore** dall'ultimo messaggio del cliente — serve un **template approvato**:

1. WhatsApp Manager → **Template di messaggio → Crea template**.
2. Categoria **Utility**, lingua **Italiano**, nome `promemoria_arilufarma`.
3. Corpo (3 variabili):

   ```
   Ciao {{1}} 👋 ti ricordiamo il tuo appuntamento in ArilùFarma:
   {{2}} domani {{3}}. Se non puoi venire, scrivici qui. A presto!
   ```

4. Dopo l'approvazione, metti il nome in `META_TEMPLATE_PROMEMORIA` nel
   `.env` e riavvia (`docker compose up -d`).

**Attivazione:** importa il file come il workflow principale, assegna le
stesse credenziali Google (nodo `Leggi prenotazioni`), poi **attiva** il
workflow. Attivalo solo **dopo** aver collaudato il bot. Per provarlo
subito senza aspettare le 18:00, apri il workflow e usa **Execute
Workflow**: manda i promemoria per gli appuntamenti di domani.

> Senza template il workflow ripiega su un messaggio normale, che però
> arriva solo se il cliente ha scritto al bot nelle ultime 24 ore: per i
> promemoria veri il template è di fatto necessario.

## Sviluppi futuri (non inclusi in questa versione)

- **Risposte AI** per le domande libere (nodo AI Agent di n8n con
  l'API di Claude) al posto del fallback "non ho capito".
- **Catalogo prodotti** su una scheda del foglio, per rispondere a
  "avete X?".
- **Disdetta/spostamento** appuntamenti self-service dal bot.
