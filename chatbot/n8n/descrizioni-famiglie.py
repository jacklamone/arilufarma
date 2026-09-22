# -*- coding: utf-8 -*-
"""
Riempie la colonna 'descrizione' del catalogo per le famiglie di prodotti che
hanno un nome COSTRUITO A SCHEMA, dove la descrizione si ricava dal nome
stesso senza che nessun modello debba riconoscere il prodotto.

USO
    python3 descrizioni-famiglie.py prodotti.csv prodotti-con-descrizioni.csv

PERCHE' A REGOLE E NON CON L'IA
    Tre ditte da sole valgono 778 articoli su 3.787 — un quinto del catalogo —
    e sono esattamente quelle che oggi il cliente non riesce a trovare, perche'
    nessuno digitera' mai "Venere 70 Col NU Cam 4" o "Utilissimi 0210 12 D+1,50".
    I loro nomi pero' sono codici regolari: linea, denari, colore, taglia per le
    calze; motivo e materiale per gli orecchini; gradazione per gli occhiali.
    Una regola li decodifica tutti allo stesso modo, e' verificabile riga per
    riga e non puo' inventare niente. Un modello, su 778 varianti quasi
    identiche, darebbe descrizioni incoerenti fra loro a parita' di prodotto.

    Le altre famiglie — cosmetica, integratori, dispositivi — non hanno schema
    e restano al passaggio con l'IA.

COSA NON FA
    Non tocca le righe che gia' hanno una descrizione, e non ne scrive nessuna
    quando lo schema non e' riconosciuto: meglio una cella vuota che una
    descrizione sbagliata.
"""

import csv
import re
import sys

# --- calzetteria Solidea ---------------------------------------------------
COLORI = {
    'ne': 'nero', 'nero': 'nero', 'bi': 'bianco', 'bianco': 'bianco',
    'nu': 'nude', 'mo': 'moka', 'moka': 'moka', 'cam': 'cammello',
    'camel': 'cammello', 'bro': 'bronzo', 'fumo': 'fumo', 'green': 'verde',
    'rub': 'rubino', 'papr': 'paprika', 'gla': 'glace', 'glace': 'glace',
    'blu': 'blu', 'navy': 'blu navy', 'miele': 'miele', 'champagne': 'champagne',
    'antracite': 'antracite', 'forest': 'verde foresta', 'blusc': 'blu scuro',
    'jasmine': 'jasmine',
    # Colori scritti in due parole: vanno provati prima dei singoli, altrimenti
    # "Blu Scu" veniva letto come il solo 'blu'.
    'blu scu': 'blu scuro', 'bl scu': 'blu scuro', 'blu na': 'blu navy',
    'blu n': 'blu navy', 'blu navy': 'blu navy',
}
TAGLIE = {'1': '1/S', '1s': '1/S', '2': '2/M', '2m': '2/M', '3': '3/L',
          '4': '4/XL', '4l': '4/L', 'xl': 'XL', 's': 'S', 'm': 'M', 'l': 'L'}


def descrivi_calza(nome):
    n = nome.lower()
    # Le due linee sanitarie hanno un uso preciso e vanno dette com'e'.
    if 'antitrombo' in n:
        return 'Calza antitrombo a compressione graduata, uso sanitario.'
    if 'diabetic' in n:
        capo = 'Gambaletto' if 'knee' in n else 'Calza'
        return ('%s non costrittivo per piede diabetico, senza elastico di '
                'costrizione.' % capo)
    # Capi che non sono calzetteria: hanno parole proprie e uso proprio.
    if 'abdom' in n or re.search(r'\bband\b', n):
        return 'Fascia addominale contenitiva a compressione graduata.'
    if 'hips' in n:
        return ('Pantaloncino modellante a compressione graduata, per fianchi '
                'e glutei.')
    if 'legg' in n:
        return 'Leggings a compressione graduata. Per gambe pesanti e stanche.'
    if 'socks' in n or 'calzin' in n:
        return 'Calzini a compressione graduata.'
    # Tipo di capo, quando il nome lo dice.
    if 'knee' in n or 'gamb' in n:
        capo = 'Gambaletto'
    elif re.search(r'\bcal\b|areg|\baut\b|autoreg', n):
        capo = 'Calza autoreggente'
    elif re.search(r'\bcol\b|collant', n):
        capo = 'Collant'
    else:
        # Molte linee Solidea non scrivono il tipo di capo nel nome (Burlesque,
        # Rossella, Pyramid...). Invece di indovinare fra collant e
        # autoreggente si usa la parola generica che direbbe un cliente, che e'
        # anche quella che digitera' nella ricerca.
        capo = 'Calze'
    pezzi = [capo + ' a compressione graduata']
    den = re.search(r'\b(\d{2,3})\s*op|\b(\d{2,3})\b', n)
    if den:
        d = den.group(1) or den.group(2)
        if d in ('20', '30', '40', '70', '100', '140', '280'):
            pezzi.append('%s denari' % d)
    if re.search(r'\bop\b', n):
        pezzi.append('coprente')
    elif 'sheer' in n or 'velat' in n:
        pezzi.append('velato')
    if 'rete' in n:
        pezzi.append('a rete')
    if 'pois' in n:
        pezzi.append('fantasia a pois')
    # Parola INTERA: 'lace' e' contenuto in 'glace', che e' un colore. Senza il
    # confine di parola "Miss Relax 100 Gamb Glace" usciva "con balza in pizzo".
    if re.search(r'\blace\b|\bpizzo\b', n):
        pezzi.append('con balza in pizzo')
    if 'glitter' in n:
        pezzi.append('con glitter')
    if 'open toe' in n or re.search(r'\bot\b', n):
        pezzi.append('punta aperta')
    if 'model' in n:
        pezzi.append('modellante')
    if 'anticell' in n:
        pezzi.append('effetto massaggiante')
    if 'bamboo' in n:
        pezzi.append('in fibra di bambu')
    if 'merino' in n:
        pezzi.append('in lana merino')
    # Dal piu' lungo al piu' corto: 'blu' e' prefisso di 'blusc' e vinceva lui.
    for chiave, colore in sorted(COLORI.items(), key=lambda kv: -len(kv[0])):
        if re.search(r'\b%s\b' % chiave, n):
            pezzi.append('colore ' + colore)
            break
    testo = ', '.join(pezzi)
    return testo[0].upper() + testo[1:] + '. Per gambe pesanti e stanche.'


# --- orecchini e bigiotteria Sanico ---------------------------------------
MATERIALI = {'ss': 'acciaio chirurgico', 'gp': 'placcato oro',
             'titanio': 'titanio', 'tit': 'titanio'}


def descrivi_orecchino(nome):
    n = nome.lower()
    if 'bracciale' in n and 'naus' in n:
        return 'Bracciale ad agopressione contro la nausea.'
    if not re.search(r'orecc|orec\b', n):
        return ''
    sterile = bool(re.search(r'\binv\b|inverness', n))
    kid = 'kid' in n
    pezzi = ['Orecchini']
    if sterile:
        pezzi.append('sterili per foro lobi, sistema Inverness')
    if kid:
        pezzi.append('linea bambino')
    for chiave, mat in MATERIALI.items():
        if re.search(r'\b%s\b' % chiave, n):
            pezzi.append('in ' + mat)
            break
    testo = ', '.join(pezzi)
    return testo + '.'


# --- occhiali da lettura Aurigane ------------------------------------------
def descrivi_occhiali(nome):
    m = re.search(r'\+\s*(\d)[,.]?(\d{1,2})?', nome)
    if not m:
        return ''
    intero = m.group(1)
    dec = (m.group(2) or '00').ljust(2, '0')
    return ('Occhiali da lettura premontati, gradazione +%s,%s.' % (intero, dec))


REGOLE = [
    ('SOLIDEA', descrivi_calza),
    ('SANICO', descrivi_orecchino),
    ('AURIGANE', descrivi_occhiali),
]


def main(sorgente, destinazione):
    righe = list(csv.DictReader(open(sorgente, encoding='utf-8')))
    scritte = collections_counter = {}
    non_riconosciute = []
    for r in righe:
        if r.get('descrizione'):
            continue
        for marchio, regola in REGOLE:
            if marchio in r['ditta'].upper():
                d = regola(r['nome'])
                if d:
                    r['descrizione'] = d
                    scritte[marchio] = scritte.get(marchio, 0) + 1
                else:
                    non_riconosciute.append(r['nome'])
                break
    with open(destinazione, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(righe[0].keys()))
        w.writeheader()
        w.writerows(righe)
    tot = sum(scritte.values())
    print('Descrizioni scritte a regola: %d' % tot)
    for k in sorted(scritte):
        print('  %-12s %4d' % (k, scritte[k]))
    print('Schema non riconosciuto (restano vuote): %d' % len(non_riconosciute))
    for n in non_riconosciute[:15]:
        print('    %s' % n)
    vuote = sum(1 for r in righe if not r.get('descrizione'))
    print('\nTotale righe: %d  |  con descrizione: %d  |  ancora vuote: %d'
          % (len(righe), len(righe) - vuote, vuote))
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
