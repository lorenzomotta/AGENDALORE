const NOMI_TABELLA = ["Compleanni", "compleanni"];
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
    return "La tabella Compleanni c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/compleanni-app.sql, aspetta 10 secondi e ricarica questa pagina.";
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
  return basso === "id" || basso === "created_at" || basso === "user_id" || basso === "idcompleanno";
}

function eColonnaCalcolata(nome) {
  return String(nome).toLowerCase() === "anni";
}

function colonnaId() {
  return trovaColonna("id") || trovaColonna("IdCompleanno") || trovaColonna("IDCOMPLEANNO") || "id";
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  const candidati = [
    riga[col],
    riga.IDCOMPLEANNO,
    riga.IdCompleanno,
    riga.idcompleanno,
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

function colonnaNominativo() {
  return trovaColonna("NOMINATIVO") || trovaColonna("Nominativo") || trovaColonna("Nome");
}

function colonnaAnni() {
  return trovaColonna("anni") || trovaColonna("Anni");
}

function colonnaDataNascita() {
  return (
    trovaColonna("Data") ||
    trovaColonna("DataNascita") ||
    trovaColonna("Nascita") ||
    trovaColonna("Compleanno") ||
    colonne.find(function (nome) {
      const basso = String(nome).toLowerCase();
      return /data|nascita|compleanno/.test(basso) && basso !== "created_at";
    }) ||
    null
  );
}

function dueCifre(n) {
  const testo = String(n);
  return testo.length === 1 ? "0" + testo : testo;
}

function isoDaOggi() {
  const d = new Date();
  return d.getFullYear() + "-" + dueCifre(d.getMonth() + 1) + "-" + dueCifre(d.getDate());
}

function isoDaValoreData(valore) {
  if (valore instanceof Date && !isNaN(valore.getTime())) {
    return valore.getFullYear() + "-" + dueCifre(valore.getMonth() + 1) + "-" + dueCifre(valore.getDate());
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

function eBisestile(anno) {
  const a = Number(anno);
  return (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
}

function etaDaNascita(nascitaIso, riguardoIso) {
  const nascita = isoDaValoreData(nascitaIso);
  const riguardo = isoDaValoreData(riguardoIso) || isoDaOggi();
  if (!nascita || !riguardo) {
    return "";
  }
  const n = nascita.split("-");
  const r = riguardo.split("-");
  let eta = Number(r[0]) - Number(n[0]);
  let meseGiornoNascita = n[1] + n[2];
  if (n[1] === "02" && n[2] === "29" && !eBisestile(r[0])) {
    meseGiornoNascita = "0228";
  }
  if (r[1] + r[2] < meseGiornoNascita) {
    eta -= 1;
  }
  return eta >= 0 ? eta : 0;
}

function etaOggiDaRiga(riga) {
  const col = colonnaDataNascita();
  if (!col) {
    return "";
  }
  return etaDaNascita(riga[col], new Date());
}

function colonneTabella() {
  const visibili = colonne.filter(function (nome) {
    return !eColonnaNascosta(nome);
  });
  const nominativo = colonnaNominativo();
  const data = colonnaDataNascita();
  const anni = colonnaAnni();
  const resto = visibili.filter(function (nome) {
    return nome !== nominativo && nome !== data && nome !== anni;
  });
  const ordinate = [];
  if (nominativo) {
    ordinate.push(nominativo);
  }
  if (data) {
    ordinate.push(data);
  }
  if (anni) {
    ordinate.push(anni);
  }
  return ordinate.concat(resto);
}

function colonneModificabili() {
  return colonne.filter(function (nome) {
    return !eColonnaNascosta(nome) && !eColonnaCalcolata(nome);
  });
}

function tipoCampo(nome) {
  const basso = String(nome).toLowerCase();
  if (basso === "anni") {
    return "number";
  }
  if ((/data|date|nascita|compleanno/.test(basso) && !/aggiorn/.test(basso)) || basso === "giorno") {
    return "date";
  }
  if (/^ora$|orario/.test(basso)) {
    return "time";
  }
  if (/importo|prezzo|euro|litri|km|chilometr|quantit|numero|costo/.test(basso)) {
    return "number";
  }
  if (/note|descrizione|commento|testo/.test(basso)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /tipo|relazione|parentela|gruppo/.test(basso);
}

function valorePerCampo(nome, valore) {
  if (valore === null || valore === undefined) {
    return "";
  }
  const testo = String(valore);
  const tipo = tipoCampo(nome);
  if (tipo === "date") {
    return isoDaValoreData(valore) || testo;
  }
  if (tipo === "time") {
    return testo.slice(0, 5);
  }
  return testo;
}

function testoCella(nome, riga) {
  if (eColonnaCalcolata(nome)) {
    const eta = etaOggiDaRiga(riga);
    return eta === "" ? "—" : String(eta);
  }
  const valore = riga ? riga[nome] : null;
  if (valore === null || valore === undefined || valore === "") {
    return "—";
  }
  if (typeof valore === "object") {
    return JSON.stringify(valore);
  }
  const tipo = tipoCampo(nome);
  const testo = String(valore);
  if (tipo === "date") {
    const iso = isoDaValoreData(valore);
    if (iso) {
      const parti = iso.split("-");
      return parti[2] + "/" + parti[1] + "/" + parti[0];
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
  const pezzi = Object.keys(riga || {}).map(function (chiave) {
    const valore = riga[chiave];
    if (valore === null || valore === undefined) {
      return "";
    }
    return typeof valore === "object" ? JSON.stringify(valore) : String(valore);
  });
  const eta = etaOggiDaRiga(riga);
  if (eta !== "") {
    pezzi.push(String(eta), String(eta) + " anni");
  }
  return pezzi.join(" ").toLowerCase().includes(query);
}

function chiaveCalendario(riga) {
  const col = colonnaDataNascita();
  const iso = col ? isoDaValoreData(riga[col]) : "";
  return iso ? iso.slice(5) : "99-99";
}

function righeVisibili() {
  const query = testoRicerca();
  let elenco = cacheRighe;
  if (query) {
    elenco = cacheRighe.filter(function (riga) {
      return rigaCorrisponde(riga, query);
    });
  }
  const colNome = colonnaNominativo();
  return elenco.slice().sort(function (a, b) {
    const perGiorno = confrontaTesto(chiaveCalendario(a), chiaveCalendario(b));
    if (perGiorno !== 0) {
      return perGiorno;
    }
    if (!colNome) {
      return 0;
    }
    return confrontaTesto(a[colNome] || "", b[colNome] || "");
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
    const valoreAttuale = riga ? valorePerCampo(nome, riga[nome]) : "";

    label.appendChild(span);
    if (usaCombo(nome) && tipo === "text") {
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

  const labelAnni = document.createElement("label");
  labelAnni.className = "campo";
  const spanAnni = document.createElement("span");
  spanAnni.textContent = "anni";
  const inputAnni = document.createElement("input");
  inputAnni.type = "number";
  inputAnni.id = "campo-anni-calcolati";
  inputAnni.name = "anni-calcolati";
  inputAnni.readOnly = true;
  inputAnni.disabled = true;
  inputAnni.tabIndex = -1;
  const notaAnni = document.createElement("small");
  notaAnni.className = "nota-campo";
  notaAnni.textContent = "Calcolato in automatico dalla data di nascita";
  labelAnni.appendChild(spanAnni);
  labelAnni.appendChild(inputAnni);
  labelAnni.appendChild(notaAnni);
  campiDinamici.appendChild(labelAnni);

  const colData = colonnaDataNascita();
  const campoData = colData ? document.getElementById("campo-" + colData) : null;
  if (campoData) {
    campoData.addEventListener("input", aggiornaAnniNelForm);
    campoData.addEventListener("change", aggiornaAnniNelForm);
  }
  aggiornaAnniNelForm();
}

function aggiornaAnniNelForm() {
  const campoAnni = document.getElementById("campo-anni-calcolati");
  if (!campoAnni) {
    return;
  }
  const colData = colonnaDataNascita();
  const campoData = colData ? document.getElementById("campo-" + colData) : null;
  const eta = campoData ? etaDaNascita(campoData.value, isoDaOggi()) : "";
  campoAnni.value = eta === "" ? "" : String(eta);
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
    } else {
      payload[nome] = testo;
    }
  });
  const colAnni = colonnaAnni();
  const colData = colonnaDataNascita();
  if (colAnni) {
    const eta = etaDaNascita(colData ? payload[colData] : "", isoDaOggi());
    payload[colAnni] = eta === "" ? null : eta;
  }
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
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/compleanni-app.sql.";
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
      td.textContent = testoCella(nome, riga);
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
      "Mancano le colonne. Aggiungi almeno una riga in Table Editor (con NOMINATIVO e data di nascita) e poi ricarica."
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
