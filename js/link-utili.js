const NOMI_TABELLA = ["LinkUtili", "linkutili", "Link_Utili", "link_utili"];
const COLONNE_PREDEFINITE = ["CATEGORIA", "LINK", "DESCRIZIONE", "NOTE", "STATO"];
const COLONNA_AZIONI = "__azioni";
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
const bottoneChiudiUrl = document.getElementById("bottone-chiudi-url");
const dialogoUrl = document.getElementById("dialogo-url");
const testoUrl = document.getElementById("testo-url");

let colonne = COLONNE_PREDEFINITE.slice();
let cacheRighe = [];
let inModifica = false;
let rigaEsistente = false;
let rigaAperta = null;
let utenteId = null;
let nomeColonnaUtente = null;
const chiusiCategoria = {};

function tabellaApi() {
  return getSupabase().from(nomeTabella);
}

function tabellaNonTrovata(error) {
  const testo = String((error && error.message) || error || "");
  return /schema cache|could not find the table/i.test(testo);
}

function messaggioTabella(error) {
  if (tabellaNonTrovata(error)) {
    return "La tabella LinkUtili c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/link-utili-app.sql, aspetta 10 secondi e ricarica questa pagina.";
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

function nomeColonnaCompatto(nome) {
  return String(nome || "")
    .toLowerCase()
    .replace(/[_\s-]/g, "");
}

function trovaColonna(nomeLogico) {
  const compatto = nomeColonnaCompatto(nomeLogico);
  return (
    colonne.find(function (nome) {
      return nomeColonnaCompatto(nome) === compatto;
    }) || null
  );
}

function colonneDaRighe(righe) {
  const daDati = [];
  (righe || []).forEach(function (riga) {
    Object.keys(riga || {}).forEach(function (chiave) {
      if (daDati.indexOf(chiave) === -1) {
        daDati.push(chiave);
      }
    });
  });
  return daDati.length ? daDati : COLONNE_PREDEFINITE.slice();
}

function valoreUtile(valore) {
  return valore !== null && valore !== undefined && valore !== "";
}

function eColonnaNascosta(nome) {
  const basso = String(nome).toLowerCase();
  const compatto = nomeColonnaCompatto(nome);
  return (
    basso === "created_at" ||
    basso === "user_id" ||
    basso === "utente" ||
    compatto === "id" ||
    compatto === "idlinkutili" ||
    compatto === "idlink"
  );
}

function colonnaId() {
  const preferite = ["id", "idlinkutili", "idlink"];
  for (let i = 0; i < preferite.length; i += 1) {
    const trovata = colonne.find(function (nome) {
      return nomeColonnaCompatto(nome) === preferite[i];
    });
    if (trovata) {
      return trovata;
    }
  }
  return "id";
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  if (col && valoreUtile(riga[col])) {
    return riga[col];
  }
  const chiavi = Object.keys(riga);
  for (let i = 0; i < chiavi.length; i += 1) {
    const compatto = nomeColonnaCompatto(chiavi[i]);
    if (compatto === "id" || compatto.indexOf("id") === 0) {
      if (valoreUtile(riga[chiavi[i]])) {
        return riga[chiavi[i]];
      }
    }
  }
  return "";
}

function colonnaCategoria() {
  return trovaColonna("CATEGORIA") || trovaColonna("Categoria");
}

function colonnaLink() {
  return trovaColonna("LINK") || trovaColonna("Link") || trovaColonna("Url");
}

function colonnaDescrizione() {
  return trovaColonna("DESCRIZIONE") || trovaColonna("Descrizione");
}

function colonnaNote() {
  return trovaColonna("NOTE") || trovaColonna("Note");
}

function eColonnaLink(nome) {
  const compatto = nomeColonnaCompatto(nome);
  return compatto === "link" || compatto === "url" || compatto === "sito";
}

function valoreCategoria(riga) {
  const col = colonnaCategoria();
  if (!col) {
    return "(senza categoria)";
  }
  const valore = riga[col];
  if (!valoreUtile(valore) || String(valore).trim() === "") {
    return "(senza categoria)";
  }
  return String(valore).trim();
}

function categoriaChiusa(nomeGruppo) {
  return chiusiCategoria[nomeGruppo] !== false;
}

function colonneTabella() {
  const visibili = colonne.filter(function (nome) {
    return (
      !eColonnaNascosta(nome) &&
      nome !== colonnaCategoria() &&
      nome !== colonnaNote() &&
      nome !== colonnaLink()
    );
  });
  const ordine = [];
  const descr = colonnaDescrizione();
  if (descr) {
    ordine.push(descr);
  }
  if (colonnaLink()) {
    ordine.push(COLONNA_AZIONI);
  }
  visibili.forEach(function (nome) {
    if (ordine.indexOf(nome) === -1) {
      ordine.push(nome);
    }
  });
  return ordine;
}

function colonneForm() {
  return colonne.filter(function (nome) {
    return !eColonnaNascosta(nome);
  });
}

function colonneModificabili() {
  return colonneForm();
}

function tipoCampo(nome) {
  const basso = String(nome).toLowerCase();
  if (/note|commento|testo|dettaglio/.test(basso) && !eColonnaLink(nome)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /categoria|stato|tipo/.test(basso);
}

function hrefDalLink(valore) {
  const testo = String(valore || "").trim();
  if (!testo) {
    return "";
  }
  if (/^(javascript|data):/i.test(testo)) {
    return "";
  }
  if (/^(https?:\/\/|mailto:)/i.test(testo)) {
    return testo;
  }
  if (/^www\./i.test(testo) || /^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(testo)) {
    return "https://" + testo;
  }
  return testo;
}

function mostraUrl(url) {
  if (!dialogoUrl || !testoUrl) {
    window.alert(url || "Nessun indirizzo");
    return;
  }
  testoUrl.textContent = url || "Nessun indirizzo";
  dialogoUrl.showModal();
}

function testoCella(nome, valore) {
  if (valore === null || valore === undefined || valore === "") {
    return "—";
  }
  if (typeof valore === "object") {
    return JSON.stringify(valore);
  }
  return String(valore);
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

function confrontaRighe(a, b) {
  const descr = colonnaDescrizione();
  if (descr) {
    const confronto = confrontaTesto(a[descr] || "", b[descr] || "");
    if (confronto) {
      return confronto;
    }
  }
  const link = colonnaLink();
  if (link) {
    return confrontaTesto(a[link] || "", b[link] || "");
  }
  return 0;
}

function righeVisibili() {
  const query = testoRicerca();
  let elenco = cacheRighe;
  if (query) {
    elenco = cacheRighe.filter(function (riga) {
      return rigaCorrisponde(riga, query);
    });
  }
  return elenco.slice().sort(confrontaRighe);
}

function raggruppaPerCategoria(righe) {
  const gruppi = {};
  righe.forEach(function (riga) {
    const nomeGruppo = valoreCategoria(riga);
    if (!gruppi[nomeGruppo]) {
      gruppi[nomeGruppo] = [];
    }
    gruppi[nomeGruppo].push(riga);
  });
  return gruppi;
}

function ordinaCategorie(nomi) {
  return nomi.slice().sort(function (a, b) {
    if (a === "(senza categoria)") {
      return 1;
    }
    if (b === "(senza categoria)") {
      return -1;
    }
    return confrontaTesto(a, b);
  });
}

function applicaChiusure(forzaAperti) {
  corpoTabella.querySelectorAll("[data-categoria]").forEach(function (riga) {
    const nomeGruppo = riga.getAttribute("data-categoria");
    const tipo = riga.getAttribute("data-tipo");
    const nascosta = !forzaAperti && tipo === "dati" && categoriaChiusa(nomeGruppo);
    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-gruppo button").forEach(function (bottone) {
    const nomeGruppo = bottone.closest("tr").getAttribute("data-categoria");
    const aperto = forzaAperti || !categoriaChiusa(nomeGruppo);
    bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
    const conteggio = bottone.closest("tr").getAttribute("data-conteggio");
    const extra = conteggio ? " (" + conteggio + ")" : "";
    bottone.textContent = (aperto ? "▼ " : "▶ ") + nomeGruppo + extra;
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
  const nuovaRiga = !rigaEsistente;
  bottoneMatita.hidden = inModifica;
  bottoneSalva.hidden = !inModifica;
  bottoneElimina.hidden = !inModifica || nuovaRiga || !campoId.value;
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
  const visibili = colonneForm();

  if (visibili.length === 0) {
    const avviso = document.createElement("p");
    avviso.className = "messaggio errore";
    avviso.textContent =
      "In questa tabella non ci sono colonne da compilare. Controlla Table Editor e poi ricarica.";
    campiDinamici.appendChild(avviso);
    return;
  }

  visibili.forEach(function (nome) {
    const label = document.createElement("label");
    label.className = "campo";
    const span = document.createElement("span");
    span.textContent = etichetta(nome);
    const tipo = tipoCampo(nome);
    const valoreAttuale = riga && riga[nome] != null ? String(riga[nome]) : "";

    label.appendChild(span);
    if (usaCombo(nome) && tipo === "text") {
      label.appendChild(creaCombo(nome, valoreAttuale));
    } else {
      const input = document.createElement(tipo === "textarea" ? "textarea" : "input");
      if (tipo === "textarea") {
        input.rows = 5;
      } else {
        input.type = "text";
        input.autocomplete = "off";
        if (eColonnaLink(nome)) {
          input.inputMode = "url";
          input.placeholder = "https://...";
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
    const testo = campo ? campo.value.trim() : "";
    payload[nome] = testo || null;
  });
  if (nomeColonnaUtente && utenteId) {
    payload[nomeColonnaUtente] = utenteId;
  }
  const colId = colonnaId();
  if (payload[colId] !== undefined) {
    delete payload[colId];
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
  const idTrovato = riga ? idDellaRiga(riga) : "";
  campoId.value = valoreUtile(idTrovato) ? String(idTrovato) : "";
  rigaEsistente = !!(riga && cacheRighe.indexOf(riga) !== -1);
  rigaAperta = rigaEsistente ? riga : null;
  costruisciCampi(riga);
  impostaCampiBloccati(!inModifica);
  aggiornaBarraAzioni();
  mostraDialogoDallInizio();
}

function riempiCellaAzioni(td, riga) {
  const colLink = colonnaLink();
  const valore = colLink ? riga[colLink] : "";
  const urlVisibile = valoreUtile(valore) ? String(valore).trim() : "";
  const href = hrefDalLink(urlVisibile);

  const wrap = document.createElement("div");
  wrap.className = "azioni-link";

  const bottoneApri = document.createElement("button");
  bottoneApri.type = "button";
  bottoneApri.className = "bottone-apri-link";
  bottoneApri.textContent = "Apri link";
  if (href) {
    bottoneApri.setAttribute("data-href", href);
  } else {
    bottoneApri.disabled = true;
  }

  const bottoneVedi = document.createElement("button");
  bottoneVedi.type = "button";
  bottoneVedi.className = "bottone-vedi-link";
  bottoneVedi.textContent = "Vedi link";
  if (urlVisibile) {
    bottoneVedi.setAttribute("data-url", urlVisibile);
  } else {
    bottoneVedi.disabled = true;
  }

  wrap.appendChild(bottoneApri);
  wrap.appendChild(bottoneVedi);
  td.className = "cella-azioni";
  td.appendChild(wrap);
}

function classeCella(nome) {
  if (nome === COLONNA_AZIONI) {
    return "cella-azioni";
  }
  if (nome === colonnaDescrizione()) {
    return "cella-descrizione";
  }
  if (nomeColonnaCompatto(nome) === "stato") {
    return "cella-stato";
  }
  return "";
}

function riempiCella(td, nome, valore) {
  td.textContent = testoCella(nome, valore);
}

function disegnaIntestazione() {
  testataColonne.innerHTML = "";
  const tr = document.createElement("tr");
  colonneTabella().forEach(function (nome) {
    const th = document.createElement("th");
    th.textContent = nome === COLONNA_AZIONI ? "Link" : etichetta(nome);
    const classe = classeCella(nome);
    if (classe) {
      th.className = classe;
    }
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
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/link-utili-app.sql.";
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

  const gruppi = raggruppaPerCategoria(visibili);
  const categorie = ordinaCategorie(Object.keys(gruppi));
  const numColonne = Math.max(colonneTabella().length, 1);

  categorie.forEach(function (nomeGruppo) {
    const trGruppo = document.createElement("tr");
    trGruppo.className = "riga-gruppo";
    trGruppo.setAttribute("data-tipo", "gruppo");
    trGruppo.setAttribute("data-categoria", nomeGruppo);
    trGruppo.setAttribute("data-conteggio", String(gruppi[nomeGruppo].length));
    const tdGruppo = document.createElement("td");
    tdGruppo.colSpan = numColonne;
    const bottoneGruppo = document.createElement("button");
    bottoneGruppo.type = "button";
    bottoneGruppo.textContent = "▼ " + nomeGruppo + " (" + gruppi[nomeGruppo].length + ")";
    tdGruppo.appendChild(bottoneGruppo);
    trGruppo.appendChild(tdGruppo);
    corpoTabella.appendChild(trGruppo);

    gruppi[nomeGruppo].slice().sort(confrontaRighe).forEach(function (riga) {
      const tr = document.createElement("tr");
      tr.className = "riga-dati";
      tr.setAttribute("data-tipo", "dati");
      tr.setAttribute("data-id", String(idDellaRiga(riga)));
      tr.setAttribute("data-indice", String(cacheRighe.indexOf(riga)));
      tr.setAttribute("data-categoria", nomeGruppo);
      colonneTabella().forEach(function (nome) {
        const td = document.createElement("td");
        const classe = classeCella(nome);
        if (classe) {
          td.className = classe;
        }
        if (nome === COLONNA_AZIONI) {
          riempiCellaAzioni(td, riga);
        } else {
          riempiCella(td, nome, riga[nome]);
        }
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
      nomeColonnaUtente = trovaColonna("Utente") || trovaColonna("user_id");
      try {
        disegnaTabella();
      } catch (error) {
        mostraStato(messaggioErrore(error));
      }
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

if (bottoneNuovo) {
  bottoneNuovo.addEventListener("click", function () {
    if (erroreCaricamento) {
      mostraStato(erroreCaricamento);
      return;
    }
    rigaEsistente = false;
    apriDialogo({}, true);
  });
}

if (campoRicerca) {
  campoRicerca.addEventListener("input", function () {
    disegnaTabella();
  });
}

bottoneAnnulla.addEventListener("click", function () {
  if (inModifica && rigaEsistente) {
    inModifica = false;
    costruisciCampi(rigaAperta || {});
    impostaCampiBloccati(true);
    aggiornaBarraAzioni();
    mostraErroreForm("");
    return;
  }
  dialogo.close();
});

if (bottoneChiudiUrl && dialogoUrl) {
  bottoneChiudiUrl.addEventListener("click", function () {
    dialogoUrl.close();
  });
}

bottoneMatita.addEventListener("click", function () {
  inModifica = true;
  impostaCampiBloccati(false);
  aggiornaBarraAzioni();
});

bottoneElimina.addEventListener("click", async function () {
  if (!campoId.value) {
    mostraErroreForm("Manca la colonna id. In SQL Editor esegui sql/link-utili-app.sql, poi ricarica.");
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
    const nomeGruppo = bottoneGruppo.closest("tr").getAttribute("data-categoria");
    chiusiCategoria[nomeGruppo] = categoriaChiusa(nomeGruppo) ? false : true;
    applicaChiusure(!!testoRicerca());
    return;
  }

  const bottoneApri = evento.target.closest(".bottone-apri-link");
  if (bottoneApri) {
    const href = bottoneApri.getAttribute("data-href");
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
    return;
  }

  const bottoneVedi = evento.target.closest(".bottone-vedi-link");
  if (bottoneVedi) {
    mostraUrl(bottoneVedi.getAttribute("data-url") || "");
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
    const id = rigaDati.getAttribute("data-id");
    trovata = cacheRighe.find(function (elemento) {
      return String(idDellaRiga(elemento)) === String(id);
    });
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

  bottoneSalva.disabled = true;
  const payload = leggiForm();
  let risultato;

  if (rigaEsistente) {
    if (!campoId.value) {
      bottoneSalva.disabled = false;
      mostraErroreForm(
        "Per modificare serve la colonna id. In SQL Editor esegui sql/link-utili-app.sql, aspetta 10 secondi e ricarica."
      );
      return;
    }
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
