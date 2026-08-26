const NOMI_TABELLA = ["Evaquazioni", "evaquazioni", "Evacuazioni", "evacuazioni"];
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

function tabellaApi() {
  return getSupabase().from(nomeTabella);
}

function tabellaNonTrovata(error) {
  const testo = String((error && error.message) || error || "");
  return /schema cache|could not find the table/i.test(testo);
}

function messaggioTabella(error) {
  if (tabellaNonTrovata(error)) {
    return "La tabella Evaquazioni c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/evaquazioni-app.sql, aspetta 10 secondi e ricarica questa pagina.";
  }
  return messaggioErrore(error);
}

function mostraErroreForm(testo) {
  erroreForm.hidden = !testo;
  erroreForm.textContent = testo || "";
}

function etichetta(nome) {
  if (eColonnaDifficolta(nome)) {
    return "DIFFICOLTA (1-5)";
  }
  return String(nome).replace(/_/g, " ").replace(/'/g, "");
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
  return (
    basso === "id" ||
    basso === "created_at" ||
    basso === "user_id" ||
    basso === "idevaquazioni" ||
    basso === "idevacuazioni"
  );
}

function eColonnaDifficolta(nome) {
  return /difficolt/.test(String(nome).toLowerCase());
}

function eColonnaConsistenza(nome) {
  return /consistenza/.test(String(nome).toLowerCase());
}

function eColonnaDataOra(nome) {
  const basso = String(nome).toLowerCase();
  return basso === "data" || basso === "datetime" || /dataora|timestamp/.test(basso);
}

function colonnaId() {
  return (
    trovaColonna("IDEVAQUAZIONI") ||
    trovaColonna("IDEVACUAZIONI") ||
    trovaColonna("id") ||
    "id"
  );
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  const candidati = [
    riga[col],
    riga.IDEVAQUAZIONI,
    riga.IDEVACUAZIONI,
    riga.idevaquazioni,
    riga.id,
    riga.Id,
  ];
  for (let i = 0; i < candidati.length; i += 1) {
    const valore = candidati[i];
    if (valore !== null && valore !== undefined && valore !== "") {
      return valore;
    }
  }
  return "";
}

function dueCifre(n) {
  const testo = String(n);
  return testo.length === 1 ? "0" + testo : testo;
}

function dataOraAdessoCampo() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    dueCifre(d.getMonth() + 1) +
    "-" +
    dueCifre(d.getDate()) +
    "T" +
    dueCifre(d.getHours()) +
    ":" +
    dueCifre(d.getMinutes())
  );
}

function valoreDataOraLocale(valore) {
  const testo = String(valore || "").trim();
  if (!testo) {
    return "";
  }
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
  trovato = testo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (trovato) {
    return trovato[1] + "-" + trovato[2] + "-" + trovato[3] + "T00:00";
  }
  return "";
}

function dataOraPerDatabase(testo) {
  const locale = String(testo || "").trim();
  if (!locale) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(locale)) {
    return locale.replace("T", " ") + ":00";
  }
  return locale;
}

function colonneTabella() {
  const visibili = colonne.filter(function (nome) {
    return !eColonnaNascosta(nome);
  });
  const data = colonne.find(function (nome) {
    return eColonnaDataOra(nome);
  });
  if (!data) {
    return visibili;
  }
  return [data].concat(
    visibili.filter(function (nome) {
      return nome !== data;
    })
  );
}

function colonneModificabili() {
  return colonne.filter(function (nome) {
    return !eColonnaNascosta(nome);
  });
}

function tipoCampo(nome) {
  const basso = String(nome).toLowerCase();
  if (eColonnaDifficolta(nome)) {
    return "select-difficolta";
  }
  if (eColonnaConsistenza(nome)) {
    return "select-consistenza";
  }
  if (eColonnaDataOra(nome)) {
    return "datetime-local";
  }
  if ((/data|date/.test(basso) && !/aggiorn/.test(basso)) || basso === "giorno") {
    return "date";
  }
  if (/^ora$|orario/.test(basso)) {
    return "time";
  }
  if (/tempo|minut|importo|prezzo|euro|litri|km|chilometr|quantit|numero|costo/.test(basso)) {
    return "number";
  }
  if (/note|descrizione|commento|testo/.test(basso)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /tipo|forma/.test(basso);
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
  const colData =
    colonne.find(function (nome) {
      return eColonnaDataOra(nome);
    }) ||
    trovaColonna("Data") ||
    trovaColonna("created_at");
  return elenco.slice().sort(function (a, b) {
    if (!colData) {
      return 0;
    }
    return String(valoreDataOraLocale(b[colData]) || b[colData] || "").localeCompare(
      String(valoreDataOraLocale(a[colData]) || a[colData] || "")
    );
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

function creaSelectDifficolta(nome, valoreAttuale) {
  const select = document.createElement("select");
  select.id = "campo-" + nome;
  select.name = nome;
  const vuoto = document.createElement("option");
  vuoto.value = "";
  vuoto.textContent = "Scegli da 1 a 5";
  select.appendChild(vuoto);
  for (let i = 1; i <= 5; i += 1) {
    const opzione = document.createElement("option");
    opzione.value = String(i);
    opzione.textContent = String(i);
    if (String(valoreAttuale) === String(i)) {
      opzione.selected = true;
    }
    select.appendChild(opzione);
  }
  return select;
}

function creaSelectConsistenza(nome, valoreAttuale) {
  const opzioni = ["TRANCI", "PALLINI", "LISCIA", "SCIOLTA"];
  const select = document.createElement("select");
  select.id = "campo-" + nome;
  select.name = nome;
  const attuale = String(valoreAttuale || "").trim().toUpperCase();
  const vuoto = document.createElement("option");
  vuoto.value = "";
  vuoto.textContent = "Scegli consistenza";
  select.appendChild(vuoto);
  opzioni.forEach(function (valore) {
    const opzione = document.createElement("option");
    opzione.value = valore;
    opzione.textContent = valore;
    if (attuale === valore) {
      opzione.selected = true;
    }
    select.appendChild(opzione);
  });
  if (attuale && opzioni.indexOf(attuale) === -1) {
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
  const modificabili = colonneModificabili();

  if (modificabili.length === 0) {
    const avviso = document.createElement("p");
    avviso.className = "messaggio errore";
    avviso.textContent =
      "In questa tabella c'è solo la colonna id. In Table Editor aggiungi le colonne e poi ricarica.";
    campiDinamici.appendChild(avviso);
    return;
  }

  modificabili.forEach(function (nome) {
    const label = document.createElement("label");
    label.className = "campo";
    const span = document.createElement("span");
    span.textContent = etichetta(nome);
    const tipo = tipoCampo(nome);
    const nuova = !riga || String(idDellaRiga(riga) || "") === "";
    let valoreAttuale = riga ? valorePerCampo(nome, riga[nome]) : "";
    if (nuova && eColonnaDataOra(nome) && !valoreAttuale) {
      valoreAttuale = dataOraAdessoCampo();
    }

    label.appendChild(span);
    if (tipo === "select-difficolta") {
      label.appendChild(creaSelectDifficolta(nome, valoreAttuale));
    } else if (tipo === "select-consistenza") {
      label.appendChild(creaSelectConsistenza(nome, valoreAttuale));
    } else if (usaCombo(nome) && tipo === "text") {
      label.appendChild(creaCombo(nome, valoreAttuale));
    } else {
      const input = document.createElement(tipo === "textarea" ? "textarea" : "input");
      if (tipo === "textarea") {
        input.rows = 3;
      } else {
        input.type = tipo;
        input.autocomplete = "off";
        if (tipo === "number") {
          input.step = "any";
          input.inputMode = "decimal";
        }
      }
      input.id = "campo-" + nome;
      input.name = nome;
      input.value = valoreAttuale;
      label.appendChild(input);
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
    if (tipo === "number" || tipo === "select-difficolta") {
      if (!testo) {
        payload[nome] = null;
      } else {
        const numero = Number(testo.replace(",", "."));
        payload[nome] = Number.isFinite(numero) ? numero : testo;
      }
    } else if (tipo === "datetime-local") {
      payload[nome] = dataOraPerDatabase(testo) || dataOraPerDatabase(dataOraAdessoCampo());
    } else {
      payload[nome] = testo;
    }
  });
  if (nomeColonnaUtente && utenteId) {
    payload[nomeColonnaUtente] = utenteId;
  }
  return payload;
}

function apriDialogo(riga, modificaSubito) {
  mostraErroreForm("");
  inModifica = !!modificaSubito;
  campoId.value = riga ? String(idDellaRiga(riga) || "") : "";
  costruisciCampi(riga);
  impostaCampiBloccati(!inModifica);
  aggiornaBarraAzioni();
  dialogo.showModal();
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
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/evaquazioni-app.sql.";
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

  visibili.forEach(function (riga) {
    const tr = document.createElement("tr");
    tr.className = "riga-dati";
    tr.setAttribute("data-id", String(idDellaRiga(riga)));
    colonneTabella().forEach(function (nome) {
      const td = document.createElement("td");
      td.textContent = testoCella(nome, riga[nome]);
      tr.appendChild(td);
    });
    corpoTabella.appendChild(tr);
  });
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
  const rigaDati = evento.target.closest("tr.riga-dati");
  if (!rigaDati) {
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
