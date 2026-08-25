const NOME_TABELLA = "Password";

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
const chiusiSezione = {};
const chiusiPortale = {};

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

function colonneTabella() {
  const senzaId = colonne.filter(function (nome) {
    return nome !== "id";
  });
  const sezione = trovaColonna("Sezione");
  const portale = trovaColonna("Portale");
  const resto = senzaId.filter(function (nome) {
    return nome !== sezione && nome !== portale;
  });
  const ordinate = [];
  if (sezione) {
    ordinate.push(sezione);
  }
  if (portale) {
    ordinate.push(portale);
  }
  return ordinate.concat(resto);
}

function colonneModificabili() {
  return colonne.filter(function (nome) {
    return nome !== "id" && nome !== "created_at";
  });
}

function testoCella(valore) {
  if (valore === null || valore === undefined || valore === "") {
    return "—";
  }
  if (typeof valore === "object") {
    return JSON.stringify(valore);
  }
  return String(valore);
}

function valoreGruppo(riga, nomeLogico) {
  const colonna = trovaColonna(nomeLogico);
  if (!colonna) {
    return "(senza " + nomeLogico + ")";
  }
  const valore = riga[colonna];
  if (valore === null || valore === undefined || valore === "") {
    return "(senza " + nomeLogico + ")";
  }
  return String(valore);
}

function chiavePortale(sezione, portale) {
  return sezione + "||" + portale;
}

function confrontaTesto(a, b) {
  return String(a).localeCompare(String(b), "it", {
    numeric: true,
    sensitivity: "base",
  });
}

function sezioneChiusa(sezione) {
  return chiusiSezione[sezione] !== false;
}

function portaleChiuso(chiave) {
  return chiusiPortale[chiave] !== false;
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
  if (!query) {
    return cacheRighe;
  }
  return cacheRighe.filter(function (riga) {
    return rigaCorrisponde(riga, query);
  });
}

function aggiornaStato(quanteVisibili) {
  const query = testoRicerca();
  if (!cacheRighe.length) {
    stato.textContent = "";
    return;
  }
  if (query) {
    stato.textContent =
      quanteVisibili + " risultati su " + cacheRighe.length + " per «" + campoRicerca.value.trim() + "»";
    return;
  }
  stato.textContent = cacheRighe.length + " righe, raggruppate per Sezione e Portale";
}

function raggruppaRighe(righe) {
  const sezioni = {};
  righe.forEach(function (riga) {
    const sezione = valoreGruppo(riga, "Sezione");
    const portale = valoreGruppo(riga, "Portale");
    if (!sezioni[sezione]) {
      sezioni[sezione] = {};
    }
    if (!sezioni[sezione][portale]) {
      sezioni[sezione][portale] = [];
    }
    sezioni[sezione][portale].push(riga);
  });
  return sezioni;
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
    const lungo = /note|descrizione|testo|contenuto|dettaglio|commento/i.test(nome);
    const input = document.createElement(lungo ? "textarea" : "input");
    if (!lungo) {
      input.type = "text";
    } else {
      input.rows = 3;
    }
    input.name = nome;
    input.id = "campo-" + nome;
    input.value = riga && riga[nome] != null ? String(riga[nome]) : "";
    label.appendChild(span);
    label.appendChild(input);
    campiDinamici.appendChild(label);
  });
}

function leggiForm() {
  const payload = {};
  colonneModificabili().forEach(function (nome) {
    const campo = document.getElementById("campo-" + nome);
    payload[nome] = campo ? campo.value : "";
  });
  return payload;
}

function apriDialogo(riga, modificaSubito) {
  mostraErroreForm("");
  inModifica = !!modificaSubito;
  campoId.value = riga && riga.id ? riga.id : "";
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
  corpoTabella.querySelectorAll("[data-sezione]").forEach(function (riga) {
    const sezione = riga.getAttribute("data-sezione");
    const portale = riga.getAttribute("data-portale");
    const tipo = riga.getAttribute("data-tipo");
    let nascosta = false;

    if (!forzaAperti) {
      if (tipo !== "sezione" && sezioneChiusa(sezione)) {
        nascosta = true;
      }
      if (tipo === "dati" && portaleChiuso(chiavePortale(sezione, portale))) {
        nascosta = true;
      }
    }

    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-sezione button").forEach(function (bottone) {
    const sezione = bottone.closest("tr").getAttribute("data-sezione");
    const aperto = forzaAperti || !sezioneChiusa(sezione);
    bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
    bottone.textContent = (aperto ? "▼ " : "▶ ") + sezione;
  });

  corpoTabella.querySelectorAll(".riga-portale button").forEach(function (bottone) {
    const riga = bottone.closest("tr");
    const chiave = chiavePortale(riga.getAttribute("data-sezione"), riga.getAttribute("data-portale"));
    const aperto = forzaAperti || !portaleChiuso(chiave);
    bottone.setAttribute("aria-expanded", aperto ? "true" : "false");
    bottone.textContent = (aperto ? "▼ " : "▶ ") + riga.getAttribute("data-portale");
  });
}

function disegnaTabella() {
  corpoTabella.innerHTML = "";
  disegnaIntestazione();

  const visibili = righeVisibili();
  aggiornaStato(visibili.length);

  if (cacheRighe.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Math.max(colonneTabella().length, 1);
    td.className = "vuoto-cella";
    td.textContent =
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/password-app.sql.";
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

  const gruppi = raggruppaRighe(visibili);
  const sezioni = Object.keys(gruppi).sort(confrontaTesto);
  const numColonne = Math.max(colonneTabella().length, 1);

  sezioni.forEach(function (sezione) {
    const trSezione = document.createElement("tr");
    trSezione.className = "riga-sezione";
    trSezione.setAttribute("data-tipo", "sezione");
    trSezione.setAttribute("data-sezione", sezione);
    const tdSezione = document.createElement("td");
    tdSezione.colSpan = numColonne;
    const bottoneSezione = document.createElement("button");
    bottoneSezione.type = "button";
    bottoneSezione.textContent = "▼ " + sezione;
    tdSezione.appendChild(bottoneSezione);
    trSezione.appendChild(tdSezione);
    corpoTabella.appendChild(trSezione);

    const portali = Object.keys(gruppi[sezione]).sort(confrontaTesto);
    portali.forEach(function (portale) {
      const trPortale = document.createElement("tr");
      trPortale.className = "riga-portale";
      trPortale.setAttribute("data-tipo", "portale");
      trPortale.setAttribute("data-sezione", sezione);
      trPortale.setAttribute("data-portale", portale);
      const tdPortale = document.createElement("td");
      tdPortale.colSpan = numColonne;
      const bottonePortale = document.createElement("button");
      bottonePortale.type = "button";
      bottonePortale.textContent = "▼ " + portale;
      tdPortale.appendChild(bottonePortale);
      trPortale.appendChild(tdPortale);
      corpoTabella.appendChild(trPortale);

      gruppi[sezione][portale].forEach(function (riga) {
        const tr = document.createElement("tr");
        tr.className = "riga-dati";
        tr.setAttribute("data-tipo", "dati");
        tr.setAttribute("data-id", riga.id);
        tr.setAttribute("data-sezione", sezione);
        tr.setAttribute("data-portale", portale);
        colonneTabella().forEach(function (nome) {
          const td = document.createElement("td");
          td.textContent = testoCella(riga[nome]);
          tr.appendChild(td);
        });
        corpoTabella.appendChild(tr);
      });
    });
  });

  applicaChiusure(!!testoRicerca());
}

async function caricaRighe() {
  stato.textContent = "Caricamento...";
  const { data, error } = await getSupabase().from(NOME_TABELLA).select("*");
  if (error) {
    stato.textContent = messaggioErrore(error);
    return;
  }

  cacheRighe = data || [];
  colonne = colonneDaRighe(cacheRighe);
  disegnaTabella();
}

bottoneNuovo.addEventListener("click", function () {
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
      return String(riga.id) === String(campoId.value);
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
  const cancellazione = await getSupabase().from(NOME_TABELLA).delete().eq("id", campoId.value);
  if (cancellazione.error) {
    mostraErroreForm(messaggioErrore(cancellazione.error));
    return;
  }
  dialogo.close();
  await caricaRighe();
});

corpoTabella.addEventListener("click", function (evento) {
  const bottoneGruppo = evento.target.closest(".riga-sezione button, .riga-portale button");
  if (bottoneGruppo) {
    const riga = bottoneGruppo.closest("tr");
    const tipo = riga.getAttribute("data-tipo");
    if (tipo === "sezione") {
      const sezione = riga.getAttribute("data-sezione");
      chiusiSezione[sezione] = sezioneChiusa(sezione) ? false : true;
    } else {
      const chiave = chiavePortale(riga.getAttribute("data-sezione"), riga.getAttribute("data-portale"));
      chiusiPortale[chiave] = portaleChiuso(chiave) ? false : true;
    }
    applicaChiusure(!!testoRicerca());
    return;
  }

  const rigaDati = evento.target.closest("tr.riga-dati");
  if (!rigaDati) {
    return;
  }
  const id = rigaDati.getAttribute("data-id");
  const trovata = cacheRighe.find(function (elemento) {
    return String(elemento.id) === String(id);
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
    risultato = await getSupabase().from(NOME_TABELLA).update(payload).eq("id", campoId.value);
  } else {
    risultato = await getSupabase().from(NOME_TABELLA).insert(payload);
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
    emailUtente.textContent = utente.email || "Utente collegato";
    await caricaRighe();
  } catch (error) {
    stato.textContent = messaggioErrore(error);
  }
}

avvia();
