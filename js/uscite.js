const COLONNE_TABELLA = ["Data", "Oggetto", "Interlocutore", "Importo"];

const emailUtente = document.getElementById("email-utente");
const bottoneEsci = document.getElementById("bottone-esci");
const stato = document.getElementById("stato");
const testataColonne = document.getElementById("testata-colonne");
const corpoTabella = document.getElementById("corpo-tabella");
const campoRicerca = document.getElementById("campo-ricerca");
const dialogo = document.getElementById("dialogo");
const titoloDialogo = document.getElementById("titolo-dialogo");
const dettaglioQuando = document.getElementById("dettaglio-quando");
const dettaglioTitolo = document.getElementById("dettaglio-titolo");
const dettaglioTipo = document.getElementById("dettaglio-tipo");
const dettaglioInterlocutore = document.getElementById("dettaglio-interlocutore");
const dettaglioEsecutore = document.getElementById("dettaglio-esecutore");
const dettaglioImporto = document.getElementById("dettaglio-importo");
const dettaglioStato = document.getElementById("dettaglio-stato");
const dettaglioNote = document.getElementById("dettaglio-note");
const bottoneChiudi = document.getElementById("bottone-chiudi");

let cacheRighe = [];
const chiusiAnno = {};

function valoreColonna(riga, nomeLogico) {
  if (!riga) {
    return "";
  }
  const basso = String(nomeLogico).toLowerCase();
  const chiave = Object.keys(riga).find(function (nome) {
    return String(nome).toLowerCase() === basso;
  });
  if (!chiave || riga[chiave] == null) {
    return "";
  }
  return String(riga[chiave]).trim();
}

function ePagato(riga) {
  return valoreColonna(riga, "StatoPagamento").toUpperCase() === "PAGATO";
}

function isoDaValoreData(valore) {
  if (valore instanceof Date && !isNaN(valore.getTime())) {
    const mese = String(valore.getMonth() + 1).padStart(2, "0");
    const giorno = String(valore.getDate()).padStart(2, "0");
    return valore.getFullYear() + "-" + mese + "-" + giorno;
  }
  const testo = String(valore || "").trim();
  if (!testo) {
    return "";
  }
  var trovato = testo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (trovato) {
    return trovato[1] + "-" + trovato[2] + "-" + trovato[3];
  }
  trovato = testo.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (trovato) {
    const giorno = trovato[1].length === 1 ? "0" + trovato[1] : trovato[1];
    const mese = trovato[2].length === 1 ? "0" + trovato[2] : trovato[2];
    return trovato[3] + "-" + mese + "-" + giorno;
  }
  return "";
}

function formattaData(valore) {
  const iso = isoDaValoreData(valore);
  const trovato = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!trovato) {
    return valore ? String(valore) : "—";
  }
  return trovato[3] + "/" + trovato[2] + "/" + trovato[1];
}

function formattaOra(valore) {
  const testo = String(valore || "").trim();
  return testo ? testo.slice(0, 5) : "";
}

function annoDaIso(iso) {
  return iso ? iso.slice(0, 4) : "(senza anno)";
}

function annoDellaRiga(riga) {
  return annoDaIso(isoDaValoreData(riga.data));
}

function numeroDaValore(valore) {
  if (valore === null || valore === undefined || valore === "") {
    return 0;
  }
  if (typeof valore === "number") {
    return Number.isFinite(valore) ? valore : 0;
  }
  let testo = String(valore).trim();
  if (!testo) {
    return 0;
  }
  testo = testo.replace(/[€$£]/g, "").replace(/\s/g, "");
  const haVirgola = testo.indexOf(",") !== -1;
  const haPunto = testo.indexOf(".") !== -1;
  if (haVirgola && haPunto) {
    if (testo.lastIndexOf(",") > testo.lastIndexOf(".")) {
      testo = testo.replace(/\./g, "").replace(",", ".");
    } else {
      testo = testo.replace(/,/g, "");
    }
  } else if (haVirgola) {
    testo = testo.replace(",", ".");
  }
  const n = Number(testo);
  return Number.isFinite(n) ? n : 0;
}

function importoRiga(riga) {
  return numeroDaValore(valoreColonna(riga, "Importo"));
}

function formattaEuro(n) {
  return Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

function testoOTrattino(valore) {
  const testo = String(valore || "").trim();
  return testo || "—";
}

function testoRicerca() {
  return campoRicerca ? campoRicerca.value.trim().toLowerCase() : "";
}

function rigaCorrisponde(riga, query) {
  if (!query) {
    return true;
  }
  const pezzi = [
    formattaData(riga.data),
    formattaOra(riga.ora),
    riga.titolo,
    valoreColonna(riga, "TipoAppuntamento"),
    valoreColonna(riga, "Interlocutore"),
    valoreColonna(riga, "Esecutore"),
    valoreColonna(riga, "Importo"),
    formattaEuro(importoRiga(riga)),
    valoreColonna(riga, "StatoPagamento"),
    valoreColonna(riga, "note"),
  ];
  return pezzi.join(" ").toLowerCase().includes(query);
}

function confrontaPerAnnoEData(a, b) {
  const isoA = isoDaValoreData(a.data);
  const isoB = isoDaValoreData(b.data);
  const perData = isoA.localeCompare(isoB);
  if (perData !== 0) {
    return perData;
  }
  return formattaOra(a.ora).localeCompare(formattaOra(b.ora));
}

function righeVisibili() {
  const query = testoRicerca();
  let elenco = cacheRighe;
  if (query) {
    elenco = cacheRighe.filter(function (riga) {
      return rigaCorrisponde(riga, query);
    });
  }
  return elenco.slice().sort(confrontaPerAnnoEData);
}

function sommaImporti(righe) {
  return righe.reduce(function (tot, riga) {
    return tot + importoRiga(riga);
  }, 0);
}

function raggruppaPerAnno(righe) {
  const anni = {};
  righe.forEach(function (riga) {
    const anno = annoDellaRiga(riga);
    if (!anni[anno]) {
      anni[anno] = [];
    }
    anni[anno].push(riga);
  });
  return anni;
}

function ordinaAnni(elenco) {
  return elenco.slice().sort(function (a, b) {
    if (a === "(senza anno)") {
      return 1;
    }
    if (b === "(senza anno)") {
      return -1;
    }
    return String(a).localeCompare(String(b), "it", { numeric: true });
  });
}

function annoChiuso(anno) {
  return chiusiAnno[anno] === true;
}

function mostraStato(testo) {
  if (!testo) {
    stato.hidden = true;
    stato.textContent = "";
    return;
  }
  stato.hidden = false;
  stato.textContent = testo;
}

async function assicuratiLogin() {
  const sessione = await getSessione();
  if (!sessione || !sessione.user) {
    window.location.replace("index.html");
    return null;
  }
  return sessione.user;
}

function testoCella(nome, riga) {
  if (nome === "Data") {
    return formattaData(riga.data);
  }
  if (nome === "Oggetto") {
    return testoOTrattino(riga.titolo);
  }
  if (nome === "Interlocutore") {
    return testoOTrattino(valoreColonna(riga, "Interlocutore"));
  }
  if (nome === "Importo") {
    return formattaEuro(importoRiga(riga));
  }
  return "—";
}

function riempiBottoneGruppo(bottone, aperto, etichettaGruppo, totale) {
  bottone.innerHTML = "";
  bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
  const nome = document.createElement("span");
  nome.className = "gruppo-nome";
  nome.textContent = (aperto ? "▼ " : "▶ ") + etichettaGruppo;
  const tot = document.createElement("span");
  tot.className = "gruppo-totale";
  tot.textContent = formattaEuro(totale);
  bottone.appendChild(nome);
  bottone.appendChild(tot);
}

function applicaChiusure(forzaAperti) {
  corpoTabella.querySelectorAll("[data-anno]").forEach(function (riga) {
    const anno = riga.getAttribute("data-anno");
    const tipo = riga.getAttribute("data-tipo");
    const nascosta = !forzaAperti && tipo === "dati" && annoChiuso(anno);
    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-anno button").forEach(function (bottone) {
    const riga = bottone.closest("tr");
    const anno = riga.getAttribute("data-anno");
    const aperto = forzaAperti || !annoChiuso(anno);
    riempiBottoneGruppo(bottone, aperto, anno, Number(riga.getAttribute("data-totale") || 0));
  });
}

function creaRigaGruppo(anno, totale) {
  const tr = document.createElement("tr");
  tr.className = "riga-anno";
  tr.setAttribute("data-tipo", "anno");
  tr.setAttribute("data-anno", anno);
  tr.setAttribute("data-totale", String(totale));
  const td = document.createElement("td");
  td.colSpan = COLONNE_TABELLA.length;
  const bottone = document.createElement("button");
  bottone.type = "button";
  riempiBottoneGruppo(bottone, true, anno, totale);
  td.appendChild(bottone);
  tr.appendChild(td);
  return tr;
}

function disegnaIntestazione() {
  testataColonne.innerHTML = "";
  const tr = document.createElement("tr");
  COLONNE_TABELLA.forEach(function (nome) {
    const th = document.createElement("th");
    th.textContent = nome;
    tr.appendChild(th);
  });
  testataColonne.appendChild(tr);
}

function disegnaTabella() {
  corpoTabella.innerHTML = "";
  disegnaIntestazione();

  const visibili = righeVisibili();
  mostraStato("");

  if (cacheRighe.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = COLONNE_TABELLA.length;
    td.className = "vuoto-cella";
    td.textContent = "Nessun evento agenda con stato pagamento PAGATO.";
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  if (visibili.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = COLONNE_TABELLA.length;
    td.className = "vuoto-cella";
    td.textContent = "Nessun risultato per questa ricerca.";
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  const gruppi = raggruppaPerAnno(visibili);
  const anni = ordinaAnni(Object.keys(gruppi));

  anni.forEach(function (anno) {
    const righeAnno = gruppi[anno].slice().sort(confrontaPerAnnoEData);
    corpoTabella.appendChild(creaRigaGruppo(anno, sommaImporti(righeAnno)));

    righeAnno.forEach(function (riga) {
      const tr = document.createElement("tr");
      tr.className = "riga-dati";
      tr.setAttribute("data-tipo", "dati");
      tr.setAttribute("data-anno", anno);
      tr.setAttribute("data-id", String(riga.id || ""));
      COLONNE_TABELLA.forEach(function (nome) {
        const td = document.createElement("td");
        td.textContent = testoCella(nome, riga);
        if (nome === "Importo") {
          td.className = "cella-importo";
        }
        tr.appendChild(td);
      });
      corpoTabella.appendChild(tr);
    });
  });

  applicaChiusure(!!testoRicerca());
}

function apriDettaglio(riga) {
  const quando = formattaData(riga.data);
  const ora = formattaOra(riga.ora);
  titoloDialogo.textContent = "Uscita";
  dettaglioQuando.textContent = ora ? quando + " · " + ora : quando;
  dettaglioTitolo.textContent = testoOTrattino(riga.titolo);
  dettaglioTipo.textContent = testoOTrattino(valoreColonna(riga, "TipoAppuntamento"));
  dettaglioInterlocutore.textContent = testoOTrattino(valoreColonna(riga, "Interlocutore"));
  dettaglioEsecutore.textContent = testoOTrattino(valoreColonna(riga, "Esecutore"));
  dettaglioImporto.textContent = formattaEuro(importoRiga(riga));
  dettaglioStato.textContent = testoOTrattino(valoreColonna(riga, "StatoPagamento"));
  dettaglioNote.textContent = testoOTrattino(valoreColonna(riga, "note") || riga.note);
  dialogo.showModal();
}

async function caricaRighe() {
  mostraStato("");
  const { data, error } = await getSupabase().from("appuntamenti").select("*");
  if (error) {
    cacheRighe = [];
    mostraStato(messaggioErrore(error));
    disegnaTabella();
    return;
  }

  cacheRighe = (data || []).filter(ePagato).sort(confrontaPerAnnoEData);
  disegnaTabella();
}

if (campoRicerca) {
  campoRicerca.addEventListener("input", function () {
    disegnaTabella();
  });
}

corpoTabella.addEventListener("click", function (evento) {
  const bottoneGruppo = evento.target.closest(".riga-anno button");
  if (bottoneGruppo) {
    const anno = bottoneGruppo.closest("tr").getAttribute("data-anno");
    const apertoOra = bottoneGruppo.getAttribute("aria-expanded") === "true";
    chiusiAnno[anno] = apertoOra;
    applicaChiusure(!!testoRicerca());
    return;
  }

  const rigaDati = evento.target.closest("tr.riga-dati");
  if (!rigaDati || rigaDati.classList.contains("riga-nascosta")) {
    return;
  }
  const id = rigaDati.getAttribute("data-id");
  const trovata = cacheRighe.find(function (elemento) {
    return String(elemento.id) === String(id);
  });
  if (trovata) {
    apriDettaglio(trovata);
  }
});

bottoneChiudi.addEventListener("click", function () {
  dialogo.close();
});

bottoneEsci.addEventListener("click", async function () {
  await getSupabase().auth.signOut();
  window.location.replace("index.html");
});

async function avvia() {
  try {
    const utente = await assicuratiLogin();
    if (!utente) {
      return;
    }
    emailUtente.textContent = utente.email || "Utente collegato";
    await caricaRighe();
  } catch (error) {
    mostraStato(messaggioErrore(error));
  }
}

avvia();
