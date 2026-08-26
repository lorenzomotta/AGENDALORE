const NOMI_TABELLA = ["CartellaClinica", "cartellaclinica", "Cartella_Clinica", "cartella_clinica"];
let nomeTabella = NOMI_TABELLA[0];
let erroreCaricamento = "";

const emailUtente = document.getElementById("email-utente");
const bottoneEsci = document.getElementById("bottone-esci");
const stato = document.getElementById("stato");
const testataColonne = document.getElementById("testata-colonne");
const corpoTabella = document.getElementById("corpo-tabella");
const bottoneNuovo = document.getElementById("bottone-nuovo");
const dialogo = document.getElementById("dialogo");
const formRiga = document.getElementById("form-riga");
const titoloDialogo = document.getElementById("titolo-dialogo");
const campoId = document.getElementById("id-riga");
const campiDinamici = document.getElementById("campi-dinamici");
const erroreForm = document.getElementById("errore-form");
const bottoneAnnulla = document.getElementById("bottone-annulla");
const bottoneElimina = document.getElementById("bottone-elimina");
const bottoneMatita = document.getElementById("bottone-matita");
const bottoneSalva = document.getElementById("bottone-salva");
const campoRicerca = document.getElementById("campo-ricerca");

let colonne = ["id"];
let cacheRighe = [];
let inModifica = false;
let utenteId = null;
let nomeColonnaUtente = null;
const chiusiAnno = {};

function tabellaApi() {
  return getSupabase().from(nomeTabella);
}

function tabellaNonTrovata(error) {
  const testo = String((error && error.message) || error || "");
  return /schema cache|could not find the table/i.test(testo);
}

function messaggioTabella(error) {
  if (tabellaNonTrovata(error)) {
    return "La tabella CartellaClinica c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/cartella-clinica-app.sql, aspetta 10 secondi e ricarica questa pagina.";
  }
  return messaggioErrore(error);
}

function mostraErroreForm(testo) {
  erroreForm.hidden = !testo;
  erroreForm.textContent = testo || "";
}

function etichetta(nome) {
  return String(nome).replace(/_/g, " ");
}

function trovaColonna(nomeLogico) {
  const basso = String(nomeLogico).toLowerCase();
  return (
    colonne.find(function (nome) {
      return String(nome).toLowerCase() === basso;
    }) || null
  );
}

function colonneDaRighe(righe) {
  const viste = {};
  (righe || []).forEach(function (riga) {
    Object.keys(riga || {}).forEach(function (chiave) {
      viste[chiave] = true;
    });
  });
  const elenco = Object.keys(viste);
  return elenco.length ? elenco : ["id"];
}

function eColonnaNascosta(nome) {
  const basso = String(nome).toLowerCase();
  return basso === "id" || basso === "created_at" || basso === "user_id";
}

function colonnaId() {
  return trovaColonna("ID") || trovaColonna("id") || "ID";
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  const candidati = [riga[col], riga.ID, riga.Id, riga.id];
  for (let i = 0; i < candidati.length; i += 1) {
    const valore = candidati[i];
    if (valore !== null && valore !== undefined && valore !== "") {
      return valore;
    }
  }
  return "";
}

function colonnaAnno() {
  return trovaColonna("ANNO") || trovaColonna("Anno") || trovaColonna("anno");
}

function colonnaData() {
  return trovaColonna("DATA") || trovaColonna("Data") || trovaColonna("data");
}

function annoDallaData(valore) {
  const locale = valoreDataOraLocale(valore);
  if (locale) {
    return locale.slice(0, 4);
  }
  const testo = String(valore || "").trim();
  const iso = testo.match(/^(\d{4})-/);
  if (iso) {
    return iso[1];
  }
  const trovato = testo.match(/(\d{4})/);
  return trovato ? trovato[1] : "";
}

function annoDellaRiga(riga) {
  const colAnno = colonnaAnno();
  if (colAnno) {
    const valore = riga[colAnno];
    if (valore !== null && valore !== undefined && String(valore).trim() !== "") {
      return String(valore).trim();
    }
  }
  const colData = colonnaData();
  if (colData) {
    return annoDallaData(riga[colData]) || "(senza anno)";
  }
  return "(senza anno)";
}

function annoChiuso(anno) {
  return chiusiAnno[anno] !== false;
}

function eColonnaAutomatica(nome) {
  const colAnno = colonnaAnno();
  return !!colAnno && nome === colAnno;
}

function annoCorrente() {
  return String(new Date().getFullYear());
}

function colonneTabella() {
  const visibili = colonne.filter(function (nome) {
    return !eColonnaNascosta(nome) && !eColonnaAutomatica(nome);
  });
  const data = colonnaData();
  if (!data) {
    return visibili;
  }
  return [data].concat(
    visibili.filter(function (nome) {
      return nome !== data;
    })
  );
}

function colonneForm() {
  return colonne.filter(function (nome) {
    return !eColonnaNascosta(nome);
  });
}

function colonneModificabili() {
  return colonneForm().filter(function (nome) {
    return !eColonnaAutomatica(nome);
  });
}

function tipoCampo(nome) {
  const basso = String(nome).toLowerCase();
  if (eColonnaDataOra(nome)) {
    return "datetime-local";
  }
  if ((/data|date/.test(basso) && !/aggiorn/.test(basso)) || basso === "giorno") {
    return "date";
  }
  if (/^ora$|orario/.test(basso)) {
    return "time";
  }
  if (basso === "mese") {
    return "select-mese";
  }
  if (basso === "anno" || /importo|prezzo|euro|valore|dose|quantit|numero|costo/.test(basso)) {
    return "number";
  }
  if (/note|descrizione|commento|testo|referto|esito|diagnosi/.test(basso)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /tipo|esame|medico|dottore|struttura|reparto|specialit|ospedale/.test(basso);
}

const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function meseNormalizzato(valore) {
  const testo = String(valore || "").trim();
  if (!testo) {
    return "";
  }
  const cifre = testo.replace(/^0+/, "");
  const numero = Number(cifre);
  if (cifre && Number.isInteger(numero) && numero >= 1 && numero <= 12) {
    return MESI[numero - 1];
  }
  const basso = testo.toLowerCase();
  for (let i = 0; i < MESI.length; i += 1) {
    const nomeMese = MESI[i].toLowerCase();
    if (basso === nomeMese || basso === nomeMese.slice(0, 3)) {
      return MESI[i];
    }
  }
  return testo;
}

function eColonnaDataOra(nome) {
  const basso = String(nome).toLowerCase();
  if (basso !== "data" && basso !== "datetime") {
    return false;
  }
  return cacheRighe.some(function (riga) {
    return /\d{2}:\d{2}/.test(String(riga[nome] || ""));
  });
}

function dueCifre(n) {
  const testo = String(n);
  return testo.length === 1 ? "0" + testo : testo;
}

function valoreDataOraLocale(valore) {
  const testo = String(valore || "").trim();
  var trovato = testo.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (trovato) {
    return trovato[1] + "-" + trovato[2] + "-" + trovato[3] + "T" + trovato[4] + ":" + trovato[5];
  }
  trovato = testo.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})[ T](\d{1,2}):(\d{2})/);
  if (trovato) {
    return (
      trovato[3] +
      "-" +
      dueCifre(trovato[2]) +
      "-" +
      dueCifre(trovato[1]) +
      "T" +
      dueCifre(trovato[4]) +
      ":" +
      trovato[5]
    );
  }
  return "";
}

function valorePerCampo(nome, valore) {
  if (valore === null || valore === undefined) {
    return "";
  }
  const testo = String(valore);
  const tipo = tipoCampo(nome);
  if (tipo === "datetime-local") {
    return valoreDataOraLocale(valore);
  }
  if (tipo === "date") {
    const trovato = testo.match(/^(\d{4}-\d{2}-\d{2})/);
    return trovato ? trovato[1] : testo;
  }
  if (tipo === "time") {
    return testo.slice(0, 5);
  }
  return testo;
}

function testoCella(nome, valore) {
  if (valore === null || valore === undefined || valore === "") {
    return "—";
  }
  if (typeof valore === "object") {
    return JSON.stringify(valore);
  }
  const tipo = tipoCampo(nome);
  const testo = String(valore);
  if (tipo === "datetime-local") {
    const locale = valoreDataOraLocale(valore);
    if (locale) {
      const parti = locale.split("T");
      const d = parti[0].split("-");
      return d[2] + "/" + d[1] + "/" + d[0] + " " + parti[1];
    }
  }
  if (tipo === "date") {
    const trovato = testo.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (trovato) {
      return trovato[3] + "/" + trovato[2] + "/" + trovato[1];
    }
  }
  if (tipo === "select-mese") {
    return meseNormalizzato(testo) || testo;
  }
  return testo;
}

function confrontaTesto(a, b) {
  return String(a).localeCompare(String(b), "it", {
    numeric: true,
    sensitivity: "base",
  });
}

function testoRicerca() {
  return campoRicerca ? campoRicerca.value.trim().toLowerCase() : "";
}

function rigaCorrisponde(riga, query) {
  if (!query) {
    return true;
  }
  return Object.keys(riga || {}).some(function (chiave) {
    const valore = riga[chiave];
    if (valore === null || valore === undefined) {
      return false;
    }
    const testo = typeof valore === "object" ? JSON.stringify(valore) : String(valore);
    return testo.toLowerCase().includes(query);
  });
}

function righeVisibili() {
  const query = testoRicerca();
  let elenco = cacheRighe;
  if (query) {
    elenco = cacheRighe.filter(function (riga) {
      return rigaCorrisponde(riga, query);
    });
  }
  const colData = colonnaData();
  return elenco.slice().sort(function (a, b) {
    if (!colData) {
      return 0;
    }
    return String(b[colData] || "").localeCompare(String(a[colData] || ""));
  });
}

function raggruppaPerAnno(righe) {
  const gruppi = {};
  righe.forEach(function (riga) {
    const anno = annoDellaRiga(riga);
    if (!gruppi[anno]) {
      gruppi[anno] = [];
    }
    gruppi[anno].push(riga);
  });
  return gruppi;
}

function ordinaAnni(anni) {
  return anni.slice().sort(function (a, b) {
    if (a === "(senza anno)") {
      return 1;
    }
    if (b === "(senza anno)") {
      return -1;
    }
    return String(b).localeCompare(String(a), "it", { numeric: true });
  });
}

function applicaChiusure(forzaAperti) {
  corpoTabella.querySelectorAll("[data-anno]").forEach(function (riga) {
    const anno = riga.getAttribute("data-anno");
    const tipo = riga.getAttribute("data-tipo");
    const nascosta = !forzaAperti && tipo === "dati" && annoChiuso(anno);
    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-gruppo button").forEach(function (bottone) {
    const anno = bottone.closest("tr").getAttribute("data-anno");
    const aperto = forzaAperti || !annoChiuso(anno);
    bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
    bottone.textContent = (aperto ? "▼ " : "▶ ") + anno;
  });
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

function impostaCampiBloccati(bloccati) {
  colonneModificabili().forEach(function (nome) {
    const campo = document.getElementById("campo-" + nome);
    if (campo) {
      campo.disabled = bloccati;
    }
  });
}

function aggiornaBarraAzioni() {
  const nuovaRiga = !campoId.value;
  bottoneMatita.hidden = inModifica;
  bottoneSalva.hidden = !inModifica;
  bottoneElimina.hidden = !inModifica || nuovaRiga;
  bottoneAnnulla.textContent = inModifica ? "Annulla" : "Chiudi";
  titoloDialogo.textContent = nuovaRiga ? "Nuova riga" : inModifica ? "Modifica riga" : "Dettaglio";
}

function valoriUniciColonna(nomeColonna) {
  const visti = {};
  cacheRighe.forEach(function (riga) {
    const valore = riga[nomeColonna];
    if (valore === null || valore === undefined || String(valore).trim() === "") {
      return;
    }
    visti[String(valore)] = true;
  });
  return Object.keys(visti).sort(confrontaTesto);
}

function creaCombo(nome, valoreAttuale) {
  const wrap = document.createElement("div");
  wrap.className = "combo";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "campo-" + nome;
  input.name = nome;
  input.autocomplete = "off";
  input.value = valoreAttuale || "";
  input.placeholder = "Tocca per scegliere, oppure scrivi un nome nuovo";

  const lista = document.createElement("ul");
  lista.className = "combo-lista";
  lista.hidden = true;

  function disegnaOpzioni(filtro) {
    const tutti = valoriUniciColonna(nome);
    const q = (filtro || "").trim().toLowerCase();
    lista.innerHTML = "";

    tutti.forEach(function (valore) {
      if (q && valore.toLowerCase().indexOf(q) === -1) {
        return;
      }
      const voce = document.createElement("li");
      voce.textContent = valore;
      voce.addEventListener("mousedown", function (evento) {
        evento.preventDefault();
        input.value = valore;
        lista.hidden = true;
      });
      lista.appendChild(voce);
    });

    const scritto = (filtro || "").trim();
    const giaCe = tutti.some(function (valore) {
      return valore.toLowerCase() === scritto.toLowerCase();
    });
    if (scritto && !giaCe) {
      const voceNuova = document.createElement("li");
      voceNuova.className = "combo-nuova";
      voceNuova.textContent = "Aggiungi «" + scritto + "»";
      voceNuova.addEventListener("mousedown", function (evento) {
        evento.preventDefault();
        input.value = scritto;
        lista.hidden = true;
      });
      lista.appendChild(voceNuova);
    }

    lista.hidden = lista.childNodes.length === 0;
  }

  input.addEventListener("focus", function () {
    if (input.disabled) {
      return;
    }
    disegnaOpzioni("");
  });
  input.addEventListener("input", function () {
    disegnaOpzioni(input.value);
  });
  input.addEventListener("blur", function () {
    window.setTimeout(function () {
      lista.hidden = true;
    }, 180);
  });

  wrap.appendChild(input);
  wrap.appendChild(lista);
  return wrap;
}

function creaSelectMese(nome, valoreAttuale) {
  const select = document.createElement("select");
  select.id = "campo-" + nome;
  select.name = nome;
  const attuale = meseNormalizzato(valoreAttuale);
  const vuoto = document.createElement("option");
  vuoto.value = "";
  vuoto.textContent = "Scegli il mese";
  select.appendChild(vuoto);
  MESI.forEach(function (mese) {
    const opzione = document.createElement("option");
    opzione.value = mese;
    opzione.textContent = mese;
    if (attuale === mese) {
      opzione.selected = true;
    }
    select.appendChild(opzione);
  });
  if (attuale && MESI.indexOf(attuale) === -1) {
    const extra = document.createElement("option");
    extra.value = attuale;
    extra.textContent = attuale;
    extra.selected = true;
    select.appendChild(extra);
  }
  return select;
}

function costruisciCampi(riga) {
  campiDinamici.innerHTML = "";
  const visibili = colonneForm();

  if (visibili.length === 0) {
    const avviso = document.createElement("p");
    avviso.className = "messaggio errore";
    avviso.textContent =
      "In questa tabella c'è solo la colonna id. In Table Editor aggiungi le colonne e poi ricarica.";
    campiDinamici.appendChild(avviso);
    return;
  }

  visibili.forEach(function (nome) {
    const label = document.createElement("label");
    label.className = "campo";
    const span = document.createElement("span");
    span.textContent = etichetta(nome);
    const tipo = tipoCampo(nome);
    const automatico = eColonnaAutomatica(nome);
    let valoreAttuale = riga ? valorePerCampo(nome, riga[nome]) : "";
    if (automatico && !valoreAttuale) {
      valoreAttuale = annoCorrente();
    }

    label.appendChild(span);
    if (tipo === "select-mese") {
      label.appendChild(creaSelectMese(nome, valoreAttuale));
    } else if (!automatico && usaCombo(nome) && tipo === "text") {
      label.appendChild(creaCombo(nome, valoreAttuale));
    } else {
      const input = document.createElement(tipo === "textarea" ? "textarea" : "input");
      if (tipo === "textarea") {
        input.rows = 5;
      } else {
        input.type = tipo;
        input.autocomplete = "off";
        if (tipo === "number") {
          input.step = "1";
          input.inputMode = "numeric";
        }
      }
      input.id = "campo-" + nome;
      input.name = nome;
      input.value = valoreAttuale;
      if (automatico) {
        input.readOnly = true;
        input.disabled = true;
        input.tabIndex = -1;
      }
      label.appendChild(input);
    }
    if (automatico) {
      const nota = document.createElement("small");
      nota.className = "nota-campo";
      nota.textContent = "Lo scrive il database da solo (anno di oggi). Non si può cambiare.";
      label.appendChild(nota);
    }
    campiDinamici.appendChild(label);
  });
}

function leggiForm() {
  const payload = {};
  colonneModificabili().forEach(function (nome) {
    const campo = document.getElementById("campo-" + nome);
    if (!campo) {
      payload[nome] = "";
      return;
    }
    const tipo = tipoCampo(nome);
    const testo = campo.value.trim();
    if (tipo === "number") {
      if (!testo) {
        payload[nome] = null;
      } else {
        const numero = Number(testo.replace(",", "."));
        payload[nome] = Number.isFinite(numero) ? numero : testo;
      }
    } else if (tipo === "datetime-local") {
      payload[nome] = testo ? testo.replace("T", " ") + ":00" : null;
    } else {
      payload[nome] = testo;
    }
  });
  const colAnno = colonnaAnno();
  if (colAnno && payload[colAnno] !== undefined) {
    delete payload[colAnno];
  }
  if (nomeColonnaUtente && utenteId) {
    payload[nomeColonnaUtente] = utenteId;
  }
  return payload;
}

function mostraDialogoDallInizio() {
  dialogo.showModal();
  titoloDialogo.focus({ preventScroll: true });
  dialogo.scrollTop = 0;
  window.requestAnimationFrame(function () {
    dialogo.scrollTop = 0;
  });
  window.setTimeout(function () {
    dialogo.scrollTop = 0;
  }, 0);
}

function apriDialogo(riga, modificaSubito) {
  mostraErroreForm("");
  inModifica = !!modificaSubito;
  campoId.value = riga ? String(idDellaRiga(riga) || "") : "";
  costruisciCampi(riga);
  impostaCampiBloccati(!inModifica);
  aggiornaBarraAzioni();
  mostraDialogoDallInizio();
}

function disegnaIntestazione() {
  testataColonne.innerHTML = "";
  const tr = document.createElement("tr");
  colonneTabella().forEach(function (nome) {
    const th = document.createElement("th");
    th.textContent = etichetta(nome);
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
    td.colSpan = Math.max(colonneTabella().length, 1);
    td.className = "vuoto-cella";
    td.textContent =
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/cartella-clinica-app.sql.";
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  if (visibili.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(colonneTabella().length, 1);
    td.className = "vuoto-cella";
    td.textContent = "Nessun risultato per questa ricerca.";
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  const gruppi = raggruppaPerAnno(visibili);
  const anni = ordinaAnni(Object.keys(gruppi));
  const numColonne = Math.max(colonneTabella().length, 1);

  anni.forEach(function (anno) {
    const trGruppo = document.createElement("tr");
    trGruppo.className = "riga-gruppo";
    trGruppo.setAttribute("data-tipo", "gruppo");
    trGruppo.setAttribute("data-anno", anno);
    const tdGruppo = document.createElement("td");
    tdGruppo.colSpan = numColonne;
    const bottoneGruppo = document.createElement("button");
    bottoneGruppo.type = "button";
    bottoneGruppo.textContent = "▼ " + anno;
    tdGruppo.appendChild(bottoneGruppo);
    trGruppo.appendChild(tdGruppo);
    corpoTabella.appendChild(trGruppo);

    gruppi[anno].forEach(function (riga) {
      const tr = document.createElement("tr");
      tr.className = "riga-dati";
      tr.setAttribute("data-tipo", "dati");
      tr.setAttribute("data-id", String(idDellaRiga(riga)));
      tr.setAttribute("data-anno", anno);
      colonneTabella().forEach(function (nome) {
        const td = document.createElement("td");
        td.textContent = testoCella(nome, riga[nome]);
        tr.appendChild(td);
      });
      corpoTabella.appendChild(tr);
    });
  });

  applicaChiusure(!!testoRicerca());
}

async function caricaRighe() {
  erroreCaricamento = "";
  mostraStato("");
  let ultimoErrore = null;

  for (let i = 0; i < NOMI_TABELLA.length; i += 1) {
    const prova = NOMI_TABELLA[i];
    const { data, error } = await getSupabase().from(prova).select("*");
    if (!error) {
      nomeTabella = prova;
      cacheRighe = data || [];
      colonne = colonneDaRighe(cacheRighe);
      nomeColonnaUtente = trovaColonna("user_id");
      disegnaTabella();
      return;
    }
    ultimoErrore = error;
    if (!tabellaNonTrovata(error)) {
      break;
    }
  }

  erroreCaricamento = messaggioTabella(ultimoErrore);
  mostraStato(erroreCaricamento);
}

bottoneNuovo.addEventListener("click", function () {
  if (erroreCaricamento) {
    mostraStato(erroreCaricamento);
    return;
  }
  if (colonneModificabili().length === 0) {
    mostraStato(
      "Mancano le colonne. Aggiungi almeno una riga in Table Editor e poi ricarica."
    );
    return;
  }
  apriDialogo({}, true);
});

if (campoRicerca) {
  campoRicerca.addEventListener("input", function () {
    disegnaTabella();
  });
}

bottoneAnnulla.addEventListener("click", function () {
  if (inModifica && campoId.value) {
    const originale = cacheRighe.find(function (riga) {
      return String(idDellaRiga(riga)) === String(campoId.value);
    });
    inModifica = false;
    costruisciCampi(originale || {});
    impostaCampiBloccati(true);
    aggiornaBarraAzioni();
    mostraErroreForm("");
    return;
  }
  dialogo.close();
});

bottoneMatita.addEventListener("click", function () {
  inModifica = true;
  impostaCampiBloccati(false);
  aggiornaBarraAzioni();
});

bottoneElimina.addEventListener("click", async function () {
  if (!campoId.value) {
    return;
  }
  const ok = window.confirm("Vuoi cancellare questa riga?");
  if (!ok) {
    return;
  }
  const cancellazione = await tabellaApi().delete().eq(colonnaId(), campoId.value);
  if (cancellazione.error) {
    mostraErroreForm(messaggioErrore(cancellazione.error));
    return;
  }
  dialogo.close();
  await caricaRighe();
});

corpoTabella.addEventListener("click", function (evento) {
  const bottoneGruppo = evento.target.closest(".riga-gruppo button");
  if (bottoneGruppo) {
    const anno = bottoneGruppo.closest("tr").getAttribute("data-anno");
    chiusiAnno[anno] = annoChiuso(anno) ? false : true;
    applicaChiusure(!!testoRicerca());
    return;
  }

  const rigaDati = evento.target.closest("tr.riga-dati");
  if (!rigaDati || rigaDati.classList.contains("riga-nascosta")) {
    return;
  }
  const id = rigaDati.getAttribute("data-id");
  const trovata = cacheRighe.find(function (elemento) {
    return String(idDellaRiga(elemento)) === String(id);
  });
  apriDialogo(trovata || { id: id }, false);
});

formRiga.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (!inModifica) {
    return;
  }
  mostraErroreForm("");

  if (colonneModificabili().length === 0) {
    mostraErroreForm("Non ci sono colonne da salvare. Aggiungile in Table Editor.");
    return;
  }

  bottoneSalva.disabled = true;
  const payload = leggiForm();
  let risultato;

  if (campoId.value) {
    risultato = await tabellaApi().update(payload).eq(colonnaId(), campoId.value);
  } else {
    const colId = colonnaId();
    if (payload[colId] !== undefined) {
      delete payload[colId];
    }
    risultato = await tabellaApi().insert(payload);
  }

  bottoneSalva.disabled = false;

  if (risultato.error) {
    mostraErroreForm(messaggioErrore(risultato.error));
    return;
  }

  dialogo.close();
  await caricaRighe();
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
    utenteId = utente.id;
    emailUtente.textContent = utente.email || "Utente collegato";
    await caricaRighe();
  } catch (error) {
    mostraStato(messaggioErrore(error));
  }
}

avvia();
