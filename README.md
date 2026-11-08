# AAC-app

**AAC (Augmentative and Alternative Communication) app for Italian speakers.**

---

## Struttura del Progetto

- **frontend/** - Applicazione web statica
  - `index.html` - Pagina principale
  - `app.js` - Logica dell'applicazione (gestione categorie, frasi, sintesi vocale, localStorage per pictogrammi personalizzati)
  - `style.css` - Stili CSS con variabili per un design system coerente
  - `pictograms.json` - Database dei pictogrammi (categorie, etichette, ID immagini)
  - `assets/pictograms/` - Immagini dei pictogrammi
  - `sw.js` - Service worker per funzionalità offline
  - `manifest.json` - Configurazione PWA per installazione come app

- **offline/scripts/** - Script utility
  - `download_pictograms.py` - Script per scaricare pictogrammi da ARASAAC

## Funzionalità

- Categorie di pictogrammi: Sentimenti, Bisogni, Azioni, Persone, Luoghi
- Pulsanti "core" sempre visibili (Sì, No, Aiuto, Dolore)
- Costruzione di frasi tramite selezione di pictogrammi
- Sintesi vocale in italiano
- **Pictogrammi personalizzati** - Possibilità di aggiungere propri pictogrammi (es. nomi familiari) salvati in localStorage per dispositivo
- Funziona offline grazie al service worker
- Installabile come app nativa su iPad

## Test su Pazienti Reali

Questa app è stata testata con pazienti reali e adattata alle loro esigenze specifiche:

- **Timer di auto-cancellazione** - La barra delle frasi si cancella automaticamente dopo 45 secondi di inattività, riducendo l'onere sui medici/caregiver
- **Prevenzione selezione testo** - Disabilitata la selezione testo e il menu contestuale su long-press per evitare interazioni accidentali
- **Controllo dello scrolling** - Ottimizzato per prevenire lo scrolling accidentale causato da tremori, mantenendo la possibilità di scorrere orizzontalmente quando necessario

## Dispositivo di Riferimento

Sviluppata e testata specificamente su:
- **iPad (5ª generazione)** con Safari

> ⚠️ **Nota:** L'app è stata testata solo su questo dispositivo. Il comportamento su altri dispositivi o browser potrebbe variare.

## Pictogrammi

I pictogrammi provengono da [ARASAAC](https://arasaac.org/), una libreria gratuita di pictogrammi per la comunicazione aumentativa e alternativa.

La ricerca di icone in lingua italiana non è ottimale, quindi il fallback è in spagnolo quando non ci sono risultati italiani.

## Installazione

1. Clona il repository
2. Apri `frontend/index.html` nel browser
3. Per deployment: usa GitHub Pages (configurato nel workflow `.github/workflows/deploy.yml`)

## Licenza

I pictogrammi sono proprietà di ARASAAC. Il codice è open source.
