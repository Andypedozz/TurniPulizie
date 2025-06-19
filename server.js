const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/")));

const PORT = 3002;

let turni;

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generaTurniGreedy(params) {
  const giorniSettimana = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"];
  const nPersone = params.nPersone;
  const dipendenti = params.dipendenti;
  const fisso = params.fisso;

  const turni = {};
  const giorniPrecedenti = {}; // Per controllare giorni consecutivi

  // Inizializza struttura turni
  for (const giorno of giorniSettimana) {
    turni[giorno] = [];
  }

  // Preprocess: mappa nome → giorni liberi
  const liberiMap = {};
  for (const d of dipendenti) {
    liberiMap[d.nome] = new Set(d.gg_liberi || []);
  }

  // Inizializza giorni precedenti
  for (const d of dipendenti) {
    giorniPrecedenti[d.nome] = null; // Nessun giorno ancora assegnato
  }

  for (let i = 0; i < giorniSettimana.length; i++) {
    const giorno = giorniSettimana[i];

    // Step 1: Pre-assegna il dipendente fisso, se questo è il suo giorno
    if (giorno === fisso.giorno) {
      turni[giorno].push(fisso.nome);
      giorniPrecedenti[fisso.nome] = giorno; // segna come assegnato
    }

    // Step 2: Crea lista candidati validi
    const candidati = dipendenti
      .map(d => d.nome)
      .filter(nome => {
        // già assegnato oggi?
        if (turni[giorno].includes(nome)) return false;
        // ha giorno libero?
        if (liberiMap[nome].has(giorno)) return false;

        // ha pulito ieri?
        const giornoPrecedente = giorniSettimana[i - 1];
        if (giornoPrecedente && turni[giornoPrecedente]?.includes(nome)) return false;

        return true;
      });

    // Step 3: Aggiungi candidati fino a riempire nPersone
    for (const nome of candidati) {
      if (turni[giorno].length < nPersone) {
        turni[giorno].push(nome);
        giorniPrecedenti[nome] = giorno;
      } else {
        break;
      }
    }

    // Step 4: Se mancano persone → errore o placeholder
    if (turni[giorno].length < nPersone) {
      turni[giorno].push("Turno non coperto");
    }
  }

  return turni;
}


function generaTurniBacktracking(params) {
    const giorniSettimana = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];
    const nPersone = params.nPersone;
    const dipendenti = params.dipendenti.map(d => d.nome);
    const liberiMap = Object.fromEntries(params.dipendenti.map(d => [d.nome, new Set(d.gg_liberi)]));
    const fisso = params.fisso;

    const turni = {};
    const turniCount = {}; // Per bilanciare i turni
    const giorniPrecedenti = {}; // Per evitare giorni consecutivi

    dipendenti.forEach(nome => {
        turniCount[nome] = 0;
        giorniPrecedenti[nome] = null;
    });

    for (let i = 0; i < giorniSettimana.length; i++) {
        const giorno = giorniSettimana[i];
        turni[giorno] = [];

        // Step 1: Assegna fisso
        if (giorno === fisso.giorno) {
            turni[giorno].push(fisso.nome);
            turniCount[fisso.nome]++;
            giorniPrecedenti[fisso.nome] = giorno;
        }

        // Step 2: Trova candidati
        const candidati = dipendenti
        .filter(nome => {
            if (turni[giorno].includes(nome)) return false;
            if (liberiMap[nome].has(giorno)) return false;
            const giornoPrecedente = giorniSettimana[i - 1];
            if (giornoPrecedente && turni[giornoPrecedente]?.includes(nome)) return false;
            return true;
        })
        .sort((a, b) => turniCount[a] - turniCount[b]); // Priorità a chi ha fatto meno turni

        // Step 3: Assegna candidati
        for (const nome of candidati) {
            if (turni[giorno].length < nPersone) {
                turni[giorno].push(nome);
                turniCount[nome]++;
                giorniPrecedenti[nome] = giorno;
            } else {
                break;
            }
        }

        // Step 4: Fallback se non abbastanza persone
        while (turni[giorno].length < nPersone) {
            turni[giorno].push("Turno non coperto");
        }
    }

    return turni;
}



app.post("/nuoviTurni", (req, res) => {
    const params = req.body;
    turni = generaTurniGreedy(params);
    res.json(turni);
})

app.get("/turni", (req, res) => {
    res.json(turni);
})

app.get("/turniCsv", (req, res) => {

});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "src/index.html"));
})

app.listen(PORT, () => {
    console.log("Server attivo sulla porta: "+PORT);
})