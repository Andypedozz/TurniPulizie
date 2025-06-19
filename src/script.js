function getData() {
    const config = {};
    const dipendenti = [];

    const nameTags = document.querySelectorAll('[name="nome"]');
    const ggTags = document.querySelectorAll('[name="giorniLiberi"]');
    
    const names = []
    nameTags.forEach(tag => {
        names.push(tag.value);
    })

    const freeDays = []
    ggTags.forEach(tag => {
        const days = tag.value.split(",");
        freeDays.push(days);
    })
    
    for(let i = 0; i < names.length; i++) {
        dipendenti.push({ nome: names[i], gg_liberi: freeDays[i]})
    }
    
    const dipendenteFisso = document.getElementById("nomeFisso").value;
    const giornoFisso = document.getElementById("giornoFisso").value;
    const fisso = {
        nome : dipendenteFisso,
        giorno : giornoFisso
    }
    
    config["nPersone"] = 2;
    config["dipendenti"] = dipendenti;
    config["fisso"] = fisso;
    return config;
}

function renderData(turni) {
    
    const section = document.getElementById("tabella-turni");
    section.innerHTML = "";

    const h2 = document.createElement("h2");
    h2.textContent = "Tabella Turni Settimanali";
    section.appendChild(h2);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = "<th>Giorno</th><th>Persone Assegnate</th>";
    table.appendChild(headerRow);

    for (const [giorno, nomi] of Object.entries(turni)) {
        const row = document.createElement("tr");

        const cellGiorno = document.createElement("td");
        cellGiorno.textContent = giorno;
        cellGiorno.style.padding = "8px";
        cellGiorno.style.border = "1px solid #ccc";

        const cellNomi = document.createElement("td");
        cellNomi.textContent = nomi.join(", ");
        cellNomi.style.padding = "8px";
        cellNomi.style.border = "1px solid #ccc";

        row.appendChild(cellGiorno);
        row.appendChild(cellNomi);
        table.appendChild(row);
    }

    section.appendChild(table);
}

function generaTurni() {
    const params = getData();

    const url = "/nuoviTurni";
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        renderData(data);
    })
}