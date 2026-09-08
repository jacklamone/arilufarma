# -*- coding: utf-8 -*-
"""Roadmap chatbot WhatsApp per parafarmacie - Intellecta Solutions."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

VERDE = colors.HexColor("#1F4A3D")
VERDE_CHIARO = colors.HexColor("#EAF1EE")
ORO = colors.HexColor("#B8935A")
GRIGIO = colors.HexColor("#3A3A3A")
GRIGIO_LEGGERO = colors.HexColor("#7A7A7A")
RIGA_ALT = colors.HexColor("#F7F7F5")

PAGINA = A4
MARGINE = 18 * mm
LARGHEZZA = PAGINA[0] - 2 * MARGINE

ss = getSampleStyleSheet()


def stile(nome, **kw):
    base = dict(fontName="Helvetica", fontSize=9.5, leading=14, textColor=GRIGIO)
    base.update(kw)
    return ParagraphStyle(nome, **base)


S_TITOLO = stile("titolo", fontName="Helvetica-Bold", fontSize=20, leading=24,
                 textColor=colors.white, spaceAfter=0)
S_SOTTOTITOLO = stile("sottotitolo", fontSize=10, leading=14,
                      textColor=colors.HexColor("#D8E3DE"))
S_H1 = stile("h1", fontName="Helvetica-Bold", fontSize=13, leading=17,
             textColor=VERDE, spaceBefore=2, spaceAfter=3)
S_H2 = stile("h2", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
             textColor=colors.HexColor("#2C5F4F"), spaceBefore=8, spaceAfter=2)
S_BODY = stile("body", alignment=TA_JUSTIFY, spaceAfter=5)
S_PICCOLO = stile("piccolo", fontSize=8.5, leading=12, textColor=GRIGIO_LEGGERO)
S_CELLA = stile("cella", fontSize=8.8, leading=12)
S_CELLA_B = stile("cellab", fontSize=8.8, leading=12, fontName="Helvetica-Bold")
S_CELLA_TIT = stile("cellatit", fontSize=8.5, leading=11,
                    fontName="Helvetica-Bold", textColor=colors.white)
S_OCCHIELLO = stile("occhiello", fontName="Helvetica-Bold", fontSize=8,
                    leading=11, textColor=ORO)
S_NOTA = stile("nota", fontSize=9, leading=13, textColor=GRIGIO)


def testata(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(VERDE)
        canvas.rect(0, PAGINA[1] - 46 * mm, PAGINA[0], 46 * mm, fill=1, stroke=0)
        canvas.setFillColor(ORO)
        canvas.rect(0, PAGINA[1] - 47.5 * mm, PAGINA[0], 1.5 * mm, fill=1, stroke=0)
        canvas.setFillColor(ORO)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(MARGINE, PAGINA[1] - 16 * mm, "INTELLECTA SOLUTIONS")
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 20)
        canvas.drawString(MARGINE, PAGINA[1] - 27 * mm,
                          "Chatbot WhatsApp per parafarmacie")
        canvas.setFillColor(colors.HexColor("#D8E3DE"))
        canvas.setFont("Helvetica", 11)
        canvas.drawString(MARGINE, PAGINA[1] - 34 * mm,
                          "Roadmap: dal primo cliente ai successivi")
        canvas.setFont("Helvetica", 8.5)
        canvas.drawString(MARGINE, PAGINA[1] - 41 * mm,
                          "Progetto pilota ArilùFarma, Sassari  ·  documento interno "
                          "dell'8 settembre 2026")
    else:
        canvas.setFillColor(VERDE)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(MARGINE, PAGINA[1] - 12 * mm,
                          "Roadmap — Chatbot WhatsApp per parafarmacie")
        canvas.setStrokeColor(ORO)
        canvas.setLineWidth(0.8)
        canvas.line(MARGINE, PAGINA[1] - 14 * mm, PAGINA[0] - MARGINE, PAGINA[1] - 14 * mm)
    canvas.setFillColor(GRIGIO_LEGGERO)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGINE, 11 * mm, "Intellecta Solutions  ·  8 settembre 2026")
    canvas.drawRightString(PAGINA[0] - MARGINE, 11 * mm, "pag. %d" % doc.page)
    canvas.setStrokeColor(colors.HexColor("#DDDDDD"))
    canvas.setLineWidth(0.5)
    canvas.line(MARGINE, 14 * mm, PAGINA[0] - MARGINE, 14 * mm)
    canvas.restoreState()


def regola(testo):
    """Titolo di sezione con filetto d'oro."""
    t = Table([[Paragraph(testo, S_H1)]], colWidths=[LARGHEZZA])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, ORO),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def tabella(intestazioni, righe, larghezze, allinea_alto=True):
    dati = [[Paragraph(h, S_CELLA_TIT) for h in intestazioni]]
    for r in righe:
        dati.append([c if hasattr(c, "wrap") else Paragraph(str(c), S_CELLA) for c in r])
    t = Table(dati, colWidths=larghezze, repeatRows=1)
    stili = [
        ("BACKGROUND", (0, 0), (-1, 0), VERDE),
        ("VALIGN", (0, 0), (-1, -1), "TOP" if allinea_alto else "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D5D5D5")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(dati)):
        if i % 2 == 0:
            stili.append(("BACKGROUND", (0, i), (-1, i), RIGA_ALT))
    t.setStyle(TableStyle(stili))
    return t


def riquadro(titolo, corpo, colore=VERDE_CHIARO, bordo=VERDE):
    interno = [Paragraph(titolo, S_OCCHIELLO), Spacer(1, 3), Paragraph(corpo, S_NOTA)]
    t = Table([[interno]], colWidths=[LARGHEZZA])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colore),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, bordo),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def punti(voci, stile_voce=None):
    st = stile_voce or S_BODY
    righe = []
    for v in voci:
        righe.append([Paragraph("•", stile("b", textColor=ORO,
                                                fontName="Helvetica-Bold")),
                      Paragraph(v, st)])
    t = Table(righe, colWidths=[6 * mm, LARGHEZZA - 6 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


story = []
A = story.append

# ---------------------------------------------------------------- copertina
A(Spacer(1, 6 * mm))

# ---------------------------------------------------------------- oggi
A(regola("Dove siamo oggi"))
A(Spacer(1, 4))
A(Paragraph(
    "Il chatbot della prima parafarmacia è <b>in funzione e in produzione</b>. "
    "Gestisce informazioni sul negozio, prenotazione dei servizi, richieste galeniche, "
    "ritiri, spostamenti e cancellazioni, promemoria automatici e consultazione del "
    "listino. È collegato a Meta Cloud API, a n8n self-hosted su VPS, a Google "
    "Sheets come gestionale e a Google Calendar per l'agenda.", S_BODY))
A(Spacer(1, 2))
A(Paragraph(
    "La giornata dell'8 settembre è stata dedicata alla bonifica: 24 interventi "
    "documentati, tutti verificati su dati di esecuzione reali. Il quadro dei guasti "
    "trovati indica con chiarezza dove intervenire.", S_BODY))
A(Spacer(1, 3 * mm))

A(tabella(
    ["Origine del problema", "N.", "Stato"],
    [["Nodo che deduce i dati della prenotazione leggendo il testo libero "
      "(espressioni regolari su ciò che scrivono cliente e bot)", "6",
      Paragraph("Tappati uno a uno.<br/><b>È la fonte da eliminare.</b>", S_CELLA)],
     ["Dati veri presenti nel gestionale ma mai letti dal bot", "2",
      Paragraph("Risolti collegando la fonte.<br/><b>Zero errori da allora.</b>", S_CELLA)],
     ["Errori di processo nello sviluppo (pubblicazione dimenticata, "
      "rollback, filtro troppo ampio)", "4",
      Paragraph("Corretti. Presi impegni di metodo.", S_CELLA)]],
    [LARGHEZZA * 0.54, LARGHEZZA * 0.08, LARGHEZZA * 0.38]))
A(Spacer(1, 4 * mm))

A(riquadro(
    "IL PRINCIPIO CHE GUIDA LA ROADMAP",
    "Il sistema oggi fa due errori speculari: <b>il codice cerca di capire la "
    "lingua</b> (regole fisse che decidono se «pelle sensibile» sia un "
    "servizio) e <b>al modello si chiede di fare i conti</b> (mezza pagina di "
    "istruzioni per confrontare orari «riga per riga»). Vanno scambiati: "
    "<b>la lingua al modello, i calcoli al codice.</b> Dove nelle istruzioni c'è "
    "scritto «verifica attentamente» manca una funzione; dove nel codice "
    "c'è una regola sulle parole, quello è lavoro del modello."))

A(PageBreak())

# ---------------------------------------------------------------- fase 1
A(regola("Fase 1 · Completare il primo cliente"))
A(Spacer(1, 4))
A(Paragraph("Obiettivo: portare ArilùFarma dal collaudo al lancio ufficiale, "
            "con un sistema che non richieda una correzione al giorno.", S_BODY))
A(Spacer(1, 3 * mm))

A(tabella(
    ["#", "Intervento", "Perché", "Impegno"],
    [["1", Paragraph("<b>Smontare la deduzione dei dati</b> dal nodo di stato. Resta "
                     "ciò che legge dati reali (agenda dal foglio, dettaglio dal "
                     "calendario, promemoria già deciso); sparisce l'inferenza di "
                     "servizio, giorno, ora e nome dal testo libero.", S_CELLA),
      "Fonte di 6 guasti su 12. Ogni toppa ne lascia un'altra possibile.",
      "Mezza giornata"],
     ["2", Paragraph("<b>Accorciare le istruzioni del bot</b> da 22.500 a circa 12.000 "
                     "caratteri. 7.000 si spostano nelle descrizioni degli strumenti, "
                     "la regola anti-sovrapposizione diventa codice, 1.900 caratteri di "
                     "toppe vecchie si cancellano.", S_CELLA),
      "Oggi per cambiare due righe se ne riscrivono 22.500: fragile da mantenere. "
      "Taglia anche il ~45% del costo fisso di ogni risposta.",
      "1 giornata"],
     ["3", Paragraph("<b>Descrizioni prodotto precompilate.</b> Un passaggio automatico "
                     "riempie una volta sola la colonna descrizione del foglio; il "
                     "farmacista rivede solo le celle rimaste vuote.", S_CELLA),
      "Sposta l'informazione dalla memoria del modello a un dato del cliente: "
      "stabile, uguale per tutti, correggibile.",
      "Mezza giornata"],
     ["4", Paragraph("<b>Lancio</b>: numero definitivo della parafarmacia al posto del "
                     "numero di test, rimozione delle righe di prova dal gestionale e "
                     "dal calendario, pubblicazione del nuovo sito.", S_CELLA),
      "È il passaggio da progetto a servizio attivo.",
      "Da concordare"]],
    [LARGHEZZA * 0.04, LARGHEZZA * 0.44, LARGHEZZA * 0.35, LARGHEZZA * 0.17]))
A(Spacer(1, 4 * mm))

A(riquadro(
    "REGOLA NON NEGOZIABILE SULLE DESCRIZIONI AUTOMATICHE",
    "Se il modello non riconosce un prodotto, <b>lascia la cella vuota</b>. Non "
    "inventa. Una cella vuota il bot la gestisce già bene («questa "
    "informazione non ce l'ho»); una descrizione inventata no. Restano comunque "
    "esclusi l'elenco completo degli ingredienti e ogni risposta su allergeni: le "
    "formule cambiano a ogni riformulazione.",
    colore=colors.HexColor("#FBF6EE"), bordo=ORO))

A(Spacer(1, 6 * mm))

# ---------------------------------------------------------------- fase 2
A(regola("Fase 2 · Dal primo al secondo cliente"))
A(Spacer(1, 4))
A(Paragraph(
    "Si affronta <b>quando la seconda parafarmacia è firmata</b>, non prima: il "
    "lavoro è in gran parte meccanico e non peggiora aspettando. Quello che va "
    "deciso subito è la disciplina.", S_BODY))
A(Spacer(1, 2 * mm))

A(riquadro(
    "LA REGOLA CHE DECIDE SE IL PRODOTTO SCALA",
    "<b>Un solo workflow per tutte le farmacie. Mai una copia per cliente.</b> "
    "Con dieci copie, i 24 interventi di una sola giornata sarebbero diventati 240, "
    "e dopo un mese si avrebbero dieci sistemi diversi tra loro, ognuno con i propri "
    "difetti e nessuno allineato."))
A(Spacer(1, 3 * mm))

A(Paragraph("Cosa cambia davvero da una farmacia all'altra", S_H2))
A(Paragraph(
    "Pochissimo: il numero WhatsApp, il foglio, il calendario, il link "
    "dell'informativa privacy. Orari, indirizzo, servizi e listino stanno già nel "
    "foglio di ciascuna. Misurato sul workflow attuale: <b>21 valori fissi in 19 nodi "
    "su 47</b> — gli altri 28 nodi sono già neutri.", S_BODY))
A(Spacer(1, 2 * mm))

A(tabella(
    ["Elemento", "Chi lo possiede", "Come funziona con un workflow solo"],
    [["Numero WhatsApp e account Meta", Paragraph("<b>La farmacia</b>", S_CELLA_B),
      "Autorizza la nostra app sul suo WhatsApp Business Account. Il webhook è lo "
      "stesso per tutte: le distingue l'identificativo del numero, già presente in "
      "ogni messaggio in arrivo."],
     ["Account Google, foglio e calendario", Paragraph("<b>La farmacia</b>", S_CELLA_B),
      "Crea i file da un modello e li condivide con un unico account tecnico "
      "dell'agenzia. Proprietà e revoca restano sue; noi usiamo una credenziale "
      "sola, ed è la condizione perché il workflow resti uno."],
     ["Registro clienti", "Intellecta",
      "Una riga per farmacia: identificativo del numero, nome, id del foglio, id del "
      "calendario, link privacy. I 21 valori fissi diventano espressioni."],
     ["Workflow, server, monitoraggio", "Intellecta",
      "Un workflow di produzione e uno di collaudo. Le modifiche passano prima dal "
      "collaudo con una farmacia sola, e vanno in produzione dopo qualche giorno."]],
    [LARGHEZZA * 0.22, LARGHEZZA * 0.15, LARGHEZZA * 0.63]))

A(Spacer(1, 7 * mm))

# ---------------------------------------------------------------- fase 3
A(regola("Fase 3 · Scalare a dieci"))
A(Spacer(1, 4))

A(Paragraph("Infrastruttura", S_H2))
A(punti([
    "n8n usa di serie un archivio leggero e un processo solo. Per dieci farmacie con "
    "traffico reale servono <b>Postgres e la modalità a coda</b> con uno o due "
    "processi di lavoro. Il VPS regge, ma va dimensionato <b>prima del terzo cliente</b>, "
    "non quando si pianta.",
    "Le esecuzioni ruotano via in circa tre giorni: il registro permanente delle "
    "conversazioni resta il foglio, e va tenuto tale.",
]))
A(Spacer(1, 2 * mm))

A(Paragraph("Attivazione di una farmacia nuova", S_H2))
A(Paragraph("Sei passi. Se restano manuali sono mezza giornata a cliente — dieci "
            "clienti, cinque giornate. Se diventano una procedura guidata sono dieci "
            "minuti. È qui che si decide se il prodotto scala.", S_BODY))
A(Spacer(1, 1 * mm))
A(tabella(
    ["Passo", "Chi", "Cosa"],
    [["1", "Farmacia", "Crea un account Google <b>dedicato</b> (non la posta personale del titolare)."],
     ["2", "Farmacia", "Copia foglio gestionale e calendario da un modello."],
     ["3", "Farmacia", "Condivide entrambi con l'account tecnico dell'agenzia."],
     ["4", "Farmacia", "Autorizza la nostra app Meta sul suo WhatsApp Business Account."],
     ["5", "Intellecta", "Aggiunge una riga al registro clienti."],
     ["6", "Entrambe", "Firma del contratto da responsabile del trattamento."]],
    [LARGHEZZA * 0.08, LARGHEZZA * 0.14, LARGHEZZA * 0.78]))
A(Spacer(1, 3 * mm))

A(Paragraph("Monitoraggio", S_H2))
A(punti([
    "Con dieci clienti non si leggono più i registri a mano: serve un "
    "<b>controllo automatico giornaliero</b> che verifichi che foglio e calendario di "
    "ciascuna farmacia siano raggiungibili e leggibili, e che avvisi <b>noi</b>, non il "
    "cliente.",
    "L'avviso errori esistente va esteso perché indichi <b>quale</b> farmacia ha "
    "avuto il problema.",
]))

A(Spacer(1, 5 * mm))

# ---------------------------------------------------------------- rischi
A(KeepTogether([regola("Da non rimandare"), Spacer(1, 4), tabella(
    ["Punto", "Perché adesso"],
    [[Paragraph("<b>Contratto da responsabile del trattamento</b> con ciascuna "
                "farmacia", S_CELLA),
      "Trattiamo appuntamenti sanitari per conto loro. Serve anche con i file di "
      "proprietà del cliente. Meglio avere il modello pronto prima del secondo "
      "cliente che rincorrerlo dopo."],
     [Paragraph("<b>Account Google dedicato</b>, mai la posta personale del titolare",
                S_CELLA),
      "Se cambia telefono o abbandona l'account, il bot si spegne senza preavviso."],
     [Paragraph("<b>Controllo automatico dei fogli</b>", S_CELLA),
      "I file sono del cliente: può rinominare una scheda o togliere la "
      "condivisione senza sapere cosa comporta."],
     [Paragraph("<b>Dimensionamento del server</b>", S_CELLA),
      "Va fatto prima del terzo cliente, non in emergenza."]],
    [LARGHEZZA * 0.32, LARGHEZZA * 0.68])]))
A(Spacer(1, 4 * mm))

A(riquadro(
    "QUELLO CHE VA DETTO CON ONESTÀ A UNA FARMACIA",
    "«Il numero è suo, l'account Google è suo, i dati dei suoi pazienti "
    "sono nel suo Drive. Noi abbiamo un accesso che lei può togliere quando "
    "vuole.»<br/><br/>"
    "È una frase vera e commercialmente forte. Restano comunque in capo "
    "all'agenzia le chiavi di collegamento, il server e il registro delle "
    "conversazioni: <b>«non gestiamo niente» non è del tutto "
    "raggiungibile</b>, e l'unica alternativa — un n8n per ogni farmacia — "
    "riporta alle dieci copie.",
    colore=colors.HexColor("#FBF6EE"), bordo=ORO))

A(Spacer(1, 5 * mm))

# ---------------------------------------------------------------- metodo
A(regola("Impegni di metodo"))
A(Spacer(1, 4))
A(punti([
    "Avvisare il cliente <b>prima</b> di ogni prova che invia un messaggio reale sul "
    "suo numero: le esecuzioni manuali inviano davvero.",
    "Mostrare il risultato <b>prima</b> di pubblicare, non dopo.",
    "Confronto riga per riga fra codice pubblicato e copia nel repository "
    "<b>sempre</b>, non solo quando si sospetta un problema.",
    "Ogni correzione verificata su <b>dati di esecuzione reali</b>, mai su ipotesi.",
]))
A(Spacer(1, 4 * mm))
A(Paragraph(
    "Il registro completo degli interventi, con le esecuzioni che li hanno motivati, "
    "è in <font face=\"Courier\">chatbot/n8n/BONIFICA-2026-09.md</font> nel "
    "repository del progetto.", S_PICCOLO))


doc = BaseDocTemplate(
    "/home/user/arilufarma/chatbot/Roadmap-chatbot-parafarmacie.pdf",
    pagesize=PAGINA, leftMargin=MARGINE, rightMargin=MARGINE,
    topMargin=MARGINE, bottomMargin=20 * mm,
    title="Roadmap chatbot WhatsApp per parafarmacie",
    author="Intellecta Solutions",
    subject="Dal primo cliente ai successivi — 8 settembre 2026",
)
frame_prima = Frame(MARGINE, 20 * mm, LARGHEZZA,
                    PAGINA[1] - 20 * mm - 52 * mm, id="prima")
frame_altre = Frame(MARGINE, 20 * mm, LARGHEZZA,
                    PAGINA[1] - 20 * mm - 20 * mm, id="altre")
doc.addPageTemplates([
    PageTemplate(id="prima", frames=[frame_prima], onPage=testata),
    PageTemplate(id="altre", frames=[frame_altre], onPage=testata),
])


class _Passa(Spacer):
    pass


# la prima pagina usa il frame ribassato, le successive quello alto
from reportlab.platypus import NextPageTemplate
story.insert(0, NextPageTemplate("altre"))

doc.build(story)
print("PDF creato")
