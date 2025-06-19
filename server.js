const express = require("express")
const app = express()
const path = require("path")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/")));

const PORT = 3002;

let turni;

function generaTurni(params) {
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
    turni = generaTurni(params);
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