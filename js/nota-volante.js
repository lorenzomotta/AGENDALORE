const NOMI_TABELLA = ["NotaVolante", "notavolante", "Nota_Volante", "nota_volante"];
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
const campoArchiviate = document.getElementById("campo-archiviate");

let colonne = ["id"];
let cacheRighe = [];
let inModifica = false;
let utenteId = null;
let nomeColonnaUtente = null;
const chiusiGruppo = {};

function tabellaApi() {
  return getSupabase().from(nomeTabella);
}

function tabellaNonTrovata(error) {
  const testo = String((error && error.message) || error || "");
  return /schema cache|could not find the table/i.test(testo);
}

function messaggioTabella(error) {
  if (tabellaNonTrovata(error)) {
    return "La tabella NotaVolante c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/nota-volante-app.sql, aspetta 10 secondi e ricarica questa pagina.";
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
  if (basso === "created_at" || basso === "user_id" || basso === "id") {
    return true;
  }
  return basso === "idappunto";
}

function colonnaTipoAppunto() {
  return trovaColonna("TipoAppunto");
}

function colonnaStato() {
  return trovaColonna("Stato");
}

function colonnaId() {
  return trovaColonna("IDAPPUNTO") || trovaColonna("id") || "IDAPPUNTO";
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  const candidati = [riga[col], riga.IDAPPUNTO, riga.idappunto, riga.IdAppunto, riga.id, riga.Id];
  for (let i = 0; i < candidati.length; i += 1) {
    const valore = candidati[i];
    if (valore !== null && valore !== undefined && valore !== "") {
      return valore;
    }
  }
  return "";
}

function rigaConStessoId(idCercato) {
  const id = String(idCercato);
  return cacheRighe.find(function (riga) {
    return String(idDellaRiga(riga)) === id;
  });
}

function colonneTabella() {
  const tipoAppunto = colonnaTipoAppunto();
  const stato = colonnaStato();
  const visibili = colonne.filter(function (nome) {
    return !eColonnaNascosta(nome) && nome !== tipoAppunto && nome !== stato;
  });
  const data = trovaColonna("Data");
  const titolo = trovaColonna("Titolo");
  const prima = data || titolo;
  if (!prima) {
    return visibili;
  }
  return [prima].concat(
    visibili.filter(function (nome) {
      return nome !== prima;
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
  if ((/data|date/.test(basso) && !/aggiorn/.test(basso)) || basso === "giorno") {
    return "date";
  }
  if (/^ora$|orario/.test(basso)) {
    return "time";
  }
  if (/importo|prezzo|euro|litri|km|chilometr|quantit|numero|costo/.test(basso)) {
    return "number";
  }
  if (/tipo/.test(basso)) {
    return "text";
  }
  if (/nota|note|descrizione|commento|testo|contenuto/.test(basso)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /tipo|categoria|argomento|sezione|^stato$/.test(basso);
}

function valorePerCampo(nome, valore) {
  if (valore === null || valore === undefined) {
    return "";
  }
  const testo = String(valore);
  const tipo = tipoCampo(nome);
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

function mostraArchiviate() {
  return !!(campoArchiviate && campoArchiviate.checked);
}

function eArchiviata(riga) {
  const col = colonnaStato();
  if (!col) {
    return false;
  }
  return String(riga[col] || "").trim().toUpperCase() === "ARCHIVIATA";
}

function valoreGruppo(riga) {
  const col = colonnaTipoAppunto();
  if (!col) {
    return "(senza tipo)";
  }
  const valore = riga[col];
  if (valore === null || valore === undefined || String(valore).trim() === "") {
    return "(senza tipo)";
  }
  return String(valore);
}

function gruppoChiuso(nomeGruppo) {
  return chiusiGruppo[nomeGruppo] !== false;
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
  const archiviate = mostraArchiviate();
  let elenco = cacheRighe.filter(function (riga) {
    return archiviate ? eArchiviata(riga) : !eArchiviata(riga);
  });
  if (query) {
    elenco = elenco.filter(function (riga) {
      return rigaCorrisponde(riga, query);
    });
  }
  const colData = trovaColonna("Data") || trovaColonna("created_at") || trovaColonna("Titolo");
  return elenco.slice().sort(function (a, b) {
    if (!colData) {
      return 0;
    }
    return String(b[colData] || "").localeCompare(String(a[colData] || ""));
  });
}

function raggruppaPerTipo(righe) {
  const gruppi = {};
  righe.forEach(function (riga) {
    const nomeGruppo = valoreGruppo(riga);
    if (!gruppi[nomeGruppo]) {
      gruppi[nomeGruppo] = [];
    }
    gruppi[nomeGruppo].push(riga);
  });
  return gruppi;
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
  if (String(nomeColonna).toLowerCase() === "stato") {
    visti.ARCHIVIATA = true;
  }
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

function applicaChiusure(forzaAperti) {
  corpoTabella.querySelectorAll("[data-tipo-nota]").forEach(function (riga) {
    const nomeGruppo = riga.getAttribute("data-tipo-nota");
    const tipo = riga.getAttribute("data-tipo");
    const nascosta = !forzaAperti && tipo === "dati" && gruppoChiuso(nomeGruppo);
    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-gruppo button").forEach(function (bottone) {
    const nomeGruppo = bottone.closest("tr").getAttribute("data-tipo-nota");
    const aperto = forzaAperti || !gruppoChiuso(nomeGruppo);
    bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
    bottone.textContent = (aperto ? "▼ " : "▶ ") + nomeGruppo;
  });
}

function messaggioVuoto() {
  if (testoRicerca()) {
    return "Nessun risultato per questa ricerca.";
  }
  if (mostraArchiviate()) {
    return "Nessuna nota archiviata.";
  }
  return "Nessuna nota da mostrare. Spunta «Mostra archiviate» per vedere quelle con Stato ARCHIVIATA.";
}

function rigaNuova() {
  const riga = {};
  const colStato = colonnaStato();
  if (colStato && mostraArchiviate()) {
    riga[colStato] = "ARCHIVIATA";
  }
  return riga;
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
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/nota-volante-app.sql.";
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  if (visibili.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(colonneTabella().length, 1);
    td.className = "vuoto-cella";
    td.textContent = messaggioVuoto();
    tr.appendChild(td);
    corpoTabella.appendChild(tr);
    return;
  }

  const gruppi = raggruppaPerTipo(visibili);
  const tipi = Object.keys(gruppi).sort(confrontaTesto);
  const numColonne = Math.max(colonneTabella().length, 1);

  tipi.forEach(function (nomeGruppo) {
    const trGruppo = document.createElement("tr");
    trGruppo.className = "riga-gruppo";
    trGruppo.setAttribute("data-tipo", "gruppo");
    trGruppo.setAttribute("data-tipo-nota", nomeGruppo);
    const tdGruppo = document.createElement("td");
    tdGruppo.colSpan = numColonne;
    const bottoneGruppo = document.createElement("button");
    bottoneGruppo.type = "button";
    bottoneGruppo.textContent = "▼ " + nomeGruppo;
    tdGruppo.appendChild(bottoneGruppo);
    trGruppo.appendChild(tdGruppo);
    corpoTabella.appendChild(trGruppo);

    gruppi[nomeGruppo].forEach(function (riga) {
      const tr = document.createElement("tr");
      tr.className = "riga-dati";
      tr.setAttribute("data-tipo", "dati");
      tr.setAttribute("data-id", String(idDellaRiga(riga)));
      tr.setAttribute("data-indice", String(cacheRighe.indexOf(riga)));
      tr.setAttribute("data-tipo-nota", nomeGruppo);
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

function apriNuovaNota() {
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
  apriDialogo(rigaNuova(), true);
}

function apriNuovaSeRichiesto() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("nuovo") !== "1") {
    return;
  }
  if (window.history.replaceState) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  apriNuovaNota();
}

bottoneNuovo.addEventListener("click", function () {
  apriNuovaNota();
});

if (campoRicerca) {
  campoRicerca.addEventListener("input", function () {
    disegnaTabella();
  });
}

if (campoArchiviate) {
  campoArchiviate.addEventListener("change", function () {
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
    const nomeGruppo = bottoneGruppo.closest("tr").getAttribute("data-tipo-nota");
    chiusiGruppo[nomeGruppo] = gruppoChiuso(nomeGruppo) ? false : true;
    applicaChiusure(!!testoRicerca());
    return;
  }

  const rigaDati = evento.target.closest("tr.riga-dati");
  if (!rigaDati || rigaDati.classList.contains("riga-nascosta")) {
    return;
  }
  const indiceGrezzo = rigaDati.getAttribute("data-indice");
  const indice = Number(indiceGrezzo);
  let trovata = null;
  if (
    indiceGrezzo !== null &&
    indiceGrezzo !== "" &&
    Number.isInteger(indice) &&
    indice >= 0 &&
    indice < cacheRighe.length
  ) {
    trovata = cacheRighe[indice];
  }
  if (!trovata) {
    trovata = rigaConStessoId(rigaDati.getAttribute("data-id"));
  }
  if (!trovata) {
    return;
  }
  apriDialogo(trovata, false);
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
    apriNuovaSeRichiesto();
  } catch (error) {
    mostraStato(messaggioErrore(error));
  }
}

avvia();
