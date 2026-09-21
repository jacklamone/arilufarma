# -*- coding: utf-8 -*-
"""
Converte l'esportazione inventario di WinFarm nel foglio Prodotti del
gestionale del chatbot.

USO
    python3 winfarm-to-prodotti.py inventario.TXT prodotti.csv

IL FILE DI PARTENZA (verificato sull'esportazione del 1 settembre 2026)
    Separatore TAB, ogni campo racchiuso fra virgolette doppie, codifica
    Windows-1252, decimali con la virgola, date gg/mm/aaaa.
    36 colonne, l'ultima riga utile seguita da quattro righe di totali
    "***** TOTALE ... *****" che vanno scartate.
    Le ultime otto colonne ripetono ragione sociale e indirizzo della
    parafarmacia su ogni riga: si buttano.
    I prezzi compaiono due volte, in lire e in euro. Si usa solo l'euro.

IL FILTRO
    Si tengono SOLO le righe con CLASSE vuota, cioe' tutto cio' che non e'
    un medicinale (classe A o C), un omeopatico (O) o un veterinario (V).
    Motivo: l'esportazione non dice quali medicinali si vendono senza
    ricetta e quali no, e il bot non puo' distinguerli da solo. Nel file del
    1 settembre restano 3.787 prodotti su 4.280.
    Quando WinFarm ci dara' il campo del regime di fornitura, questo filtro
    si riapre all'automedicazione (vedi BONIFICA-2026-09.md).

IL PREZZO
    Si usa P.VEND.(euro), il prezzo che il cliente paga davvero, non
    P.LIST.(euro) che e' il listino del fornitore. Sul 7 Erbe dentifricio,
    per dire, listino 3,40 e vendita 3,00.

LA CHIAVE
    COD.MIN. (codice ministeriale, 9 cifre). Nel file del 1 settembre e'
    presente su tutte le righe e non ha duplicati: e' la colonna su cui
    agganciare gli aggiornamenti futuri senza incrociare per nome.

VERIFICA
    Lo script ricalcola il valore di magazzino dai singoli prodotti e lo
    confronta con i totali che WinFarm scrive in fondo al file. Se i due
    numeri non coincidono, la lettura e' sbagliata da qualche parte e lo
    script si ferma.
"""

import csv
import sys
import unicodedata

COLONNE_ATTESE = 36
SEP = '\t'

# Parole che in un nome di prodotto restano maiuscole o minuscole come sono:
# passandole per il title case verrebbero storpiate ("FPR" -> "Fpr").
SIGLE = {
    'FPR', 'SPF', 'UI', 'UV', 'ML', 'MG', 'GR', 'PH', 'LED', 'USB', 'TV',
    'CH', 'AD', 'BB', 'OS', 'IBS', 'MD', 'DHA', 'ATP', 'SOS', 'XL', 'XS',
    'HD', 'PM', 'AM', 'ECG', 'HBA1C', 'FFP2', 'HP',
}


def leggi(percorso):
    """Legge il TXT di WinFarm e restituisce (intestazione, righe, totali)."""
    with open(percorso, 'rb') as f:
        testo = f.read().decode('cp1252')
    righe = [r.rstrip('\r') for r in testo.split('\n') if r.strip()]
    campi = [r.split(SEP) for r in righe]
    intestazione = [c.strip().strip('"').strip() for c in campi[0]]
    dati, totali = [], []
    for c in campi[1:]:
        (dati if len(c) == COLONNE_ATTESE else totali).append(c)
    return intestazione, dati, [t[0] for t in totali]


def valore(riga, intestazione, nome):
    return riga[intestazione.index(nome)].strip('"').strip()


def numero(testo):
    """'1.234,50' -> 1234.5 ; vuoto o illeggibile -> 0.0"""
    t = (testo or '').replace('.', '').replace(',', '.')
    try:
        return float(t)
    except ValueError:
        return 0.0


def prezzo_italiano(valore_euro):
    return ('%.2f' % valore_euro).replace('.', ',')


def nome_leggibile(grezzo):
    """'TACHIPIRINA*30CPR DIV 500MG' -> 'Tachipirina 30CPR Div 500MG'

    Tocco leggero: l'asterisco che WinFarm usa come separatore diventa uno
    spazio, e il MAIUSCOLO FISSO diventa leggibile. Le sigle e i formati
    (50ML, 30CPR) restano come sono: storpiarli renderebbe il nome peggiore,
    non migliore. La descrizione davvero rivolta al cliente non e' questa: la
    genera il passaggio con l'IA nella colonna 'descrizione'.
    """
    testo = grezzo.replace('*', ' ')
    parole = [p for p in testo.split() if p]
    fuori = []
    for p in parole:
        if p.upper() in SIGLE or any(ch.isdigit() for ch in p):
            fuori.append(p)
        elif len(p) <= 2:
            fuori.append(p.upper())
        else:
            fuori.append(p.capitalize())
    return ' '.join(fuori)


def converti(sorgente, destinazione):
    intestazione, dati, totali = leggi(sorgente)
    print('File di partenza : %s' % sorgente)
    print('  colonne        : %d' % len(intestazione))
    print('  righe prodotto : %d' % len(dati))
    print('  righe totali   : %d  %s' % (len(totali), totali))

    # --- verifica di lettura: i nostri conti devono tornare con i suoi ------
    dichiarato = None
    for t in totali:
        if 'TOTALE PREZZO VENDITA' in t:
            dichiarato = numero(t.split(':')[1].replace('*', '').strip())
    calcolato = sum(numero(valore(r, intestazione, 'P.VEND.(€)'))
                    * numero(valore(r, intestazione, 'G.TOT')) for r in dati)
    print('\nVerifica valore di magazzino')
    print('  dichiarato da WinFarm : %s' % prezzo_italiano(dichiarato or 0))
    print('  ricalcolato da noi    : %s' % prezzo_italiano(calcolato))
    if dichiarato is None or abs(calcolato - dichiarato) > 0.01:
        print('\n  ERRORE: i totali non coincidono, la lettura del file non e'
              ' affidabile.')
        return 1
    print('  coincidono.')

    # --- filtro --------------------------------------------------------------
    tenuti, scartati = [], {}
    for r in dati:
        classe = valore(r, intestazione, 'CLASSE')
        if classe:
            scartati[classe] = scartati.get(classe, 0) + 1
            continue
        tenuti.append(r)
    print('\nFiltro: si tengono solo le righe con CLASSE vuota')
    for k in sorted(scartati):
        print('  scartati classe %-2s : %5d' % (k, scartati[k]))
    print('  TENUTI              : %5d' % len(tenuti))

    # --- controlli di integrita' --------------------------------------------
    minsan = [valore(r, intestazione, 'COD.MIN.') for r in tenuti]
    doppi = sorted({m for m in minsan if minsan.count(m) > 1})
    senza_nome = [m for m, r in zip(minsan, tenuti)
                  if not valore(r, intestazione, 'DESCRIZIONE')]
    senza_prezzo = [(valore(r, intestazione, 'DESCRIZIONE'),
                     valore(r, intestazione, 'DESCRIZIONE DITTA'))
                    for r in tenuti
                    if numero(valore(r, intestazione, 'P.VEND.(€)')) <= 0]
    print('\nControlli')
    print('  codici Minsan duplicati : %d %s' % (len(doppi), doppi[:5] or ''))
    print('  prodotti senza nome     : %d' % len(senza_nome))
    print('  prodotti senza prezzo   : %d' % len(senza_prezzo))
    for n, d in senza_prezzo:
        print('      %-32s %s' % (n, d))

    # --- scrittura -----------------------------------------------------------
    # Esce SOLO cio' che serve al bot per rispondere a un cliente.
    #
    # Restano fuori, di proposito:
    #   COSTO e COSTO N.  - quanto la parafarmacia paga il prodotto. Al
    #                       cliente non serve e non e' roba che deve girare.
    #   P.LIST.           - listino del fornitore, diverso dal prezzo pagato.
    #   totali finali     - li leggiamo solo per verificare la lettura del
    #                       file, non vengono mai scritti.
    #   ragione sociale, P.IVA, indirizzo - WinFarm li ripete su ogni riga,
    #                       sono dati dell'azienda e non c'entrano col listino.
    #   IVA, SUD.MERC., ATC, Degrassi, gr. terapeutico - codici interni al
    #                       gestionale, inutili per rispondere a una domanda.
    #   nome gestionale grezzo - ridondante: la riga si ritrova col Minsan.
    #
    # GIACENZA -> DISPONIBILE. Non scriviamo quanti pezzi ci sono, ma solo se
    # il prodotto c'e' o no. Due motivi. Il primo: una colonna con le quantita'
    # esatte di 3.787 prodotti, accanto ai prezzi, e' la fotografia del
    # magazzino della parafarmacia, e per rispondere a un cliente non serve.
    # Il secondo: la quantita' viene da un'esportazione della notte prima,
    # quindi "ne restano 2" e' una precisione che non possiamo garantire,
    # mentre "disponibile" e' onesto.
    intestazione_uscita = ['minsan', 'nome', 'ditta', 'prezzo',
                           'disponibile', 'descrizione', 'aggiornato']
    data_export = valore(dati[0], intestazione, 'DATA') if dati else ''
    with open(destinazione, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(intestazione_uscita)
        for r in tenuti:
            grezzo = valore(r, intestazione, 'DESCRIZIONE')
            in_casa = numero(valore(r, intestazione, 'G.TOT')) > 0
            w.writerow([
                valore(r, intestazione, 'COD.MIN.'),
                nome_leggibile(grezzo),
                valore(r, intestazione, 'DESCRIZIONE DITTA'),
                prezzo_italiano(numero(valore(r, intestazione, 'P.VEND.(€)'))),
                'si' if in_casa else 'no',
                '',                       # descrizione: la riempie il passaggio IA
                data_export,
            ])
    print('\nScritto %s : %d righe + intestazione' % (destinazione, len(tenuti)))
    print('  colonne: %s' % ', '.join(intestazione_uscita))
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(converti(sys.argv[1], sys.argv[2]))
