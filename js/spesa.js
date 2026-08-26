const NOMI_TABELLA = ["Spesa", "spesa"];
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
let nomeColonnaImporto = null;
const chiusiAnno = {};
const chiusiSupermercato = {};

function tabellaApi() {
  return getSupabase().from(nomeTabella);
}

function tabellaNonTrovata(error) {
  const testo = String((error && error.message) || error || "");
  return /schema cache|could not find the table/i.test(testo);
}

function messaggioTabella(error) {
  if (tabellaNonTrovata(error)) {
    return "La tabella Spesa c'è, ma Supabase non l'ha ancora messa nell'elenco dell'app. In SQL Editor esegui sql/spesa-app.sql, aspetta 10 secondi e ricarica questa pagina.";
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
  return basso === "id" || basso === "created_at" || basso === "user_id" || basso === "idspesa";
}

function colonnaId() {
  return trovaColonna("IDSPESA") || trovaColonna("IdSpesa") || trovaColonna("id") || "id";
}

function idDellaRiga(riga) {
  if (!riga) {
    return "";
  }
  const col = colonnaId();
  const candidati = [riga[col], riga.IDSPESA, riga.idspesa, riga.IdSpesa, riga.id, riga.Id];
  for (let i = 0; i < candidati.length; i += 1) {
    const valore = candidati[i];
    if (valore !== null && valore !== undefined && valore !== "") {
      return valore;
    }
  }
  return "";
}

function colonnaSupermercato() {
  return trovaColonna("Super") || trovaColonna("Supermercato") || trovaColonna("Negozio");
}

function colonnaImporto() {
  const daSpesa = trovaColonna("spesa") || trovaColonna("Spesa");
  if (daSpesa) {
    nomeColonnaImporto = daSpesa;
    return daSpesa;
  }
  if (nomeColonnaImporto && colonne.indexOf(nomeColonnaImporto) !== -1) {
    return nomeColonnaImporto;
  }
  const preferite = ["Importo", "Imp", "Euro", "Valore", "Prezzo", "Costo", "Totale", "Soldi", "Cifra"];
  for (let i = 0; i < preferite.length; i += 1) {
    const trovata = trovaColonna(preferite[i]);
    if (trovata) {
      nomeColonnaImporto = trovata;
      return trovata;
    }
  }
  const daNome = colonne.find(function (nome) {
    const basso = String(nome).toLowerCase();
    return /importo|^imp$|^spesa$|euro|prezzo|costo|totale|valore|soldi|cifra/.test(basso);
  });
  if (daNome) {
    nomeColonnaImporto = daNome;
    return daNome;
  }
  nomeColonnaImporto = colonnaImportoDaValori();
  return nomeColonnaImporto;
}

function colonnaImportoDaValori() {
  const id = colonnaId();
  const data = colonnaData();
  const superCol = colonnaSupermercato();
  let migliore = null;
  let meglioNumerici = 0;
  colonne.forEach(function (nome) {
    if (eColonnaNascosta(nome) || nome === id || nome === data || nome === superCol) {
      return;
    }
    if (tipoCampo(nome) === "date" || tipoCampo(nome) === "textarea") {
      return;
    }
    let numerici = 0;
    cacheRighe.forEach(function (riga) {
      const valore = riga[nome];
      if (valore === null || valore === undefined || String(valore).trim() === "") {
        return;
      }
      if (typeof valore === "number" && Number.isFinite(valore)) {
        numerici += 1;
        return;
      }
      const testo = String(valore).trim();
      if (/^[-]?\d+([.,]\d+)?$/.test(testo) || numeroDaValore(valore) !== 0) {
        numerici += 1;
      }
    });
    if (numerici > meglioNumerici) {
      meglioNumerici = numerici;
      migliore = nome;
    }
  });
  return meglioNumerici > 0 ? migliore : null;
}

function colonnaData() {
  return (
    trovaColonna("Data") ||
    colonne.find(function (nome) {
      return tipoCampo(nome) === "date";
    }) ||
    trovaColonna("created_at") ||
    null
  );
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
  const col = colonnaImporto();
  if (!col) {
    return 0;
  }
  return numeroDaValore(riga[col]);
}

function formattaEuro(n) {
  return Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

function isoDaValoreData(valore) {
  if (valore instanceof Date && !isNaN(valore.getTime())) {
    return valore.toISOString().slice(0, 10);
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
  const data = new Date(testo);
  if (!isNaN(data.getTime()) && data.getFullYear() > 1900) {
    return data.toISOString().slice(0, 10);
  }
  return "";
}

function annoDaValoreData(valore) {
  const iso = isoDaValoreData(valore);
  if (iso) {
    return iso.slice(0, 4);
  }
  const testo = String(valore || "");
  const trovato = testo.match(/\b((?:19|20)\d{2})\b/);
  return trovato ? trovato[1] : "";
}

function annoDellaRiga(riga) {
  const col = colonnaData();
  if (!col) {
    return "(senza anno)";
  }
  return annoDaValoreData(riga[col]) || "(senza anno)";
}

function supermercatoDellaRiga(riga) {
  const col = colonnaSupermercato();
  if (!col) {
    return "(senza supermercato)";
  }
  const valore = riga[col];
  if (valore === null || valore === undefined || String(valore).trim() === "") {
    return "(senza supermercato)";
  }
  return String(valore);
}

function chiaveSupermercato(anno, supermercato) {
  return anno + "||" + supermercato;
}

function annoChiuso(anno) {
  return chiusiAnno[anno] !== false;
}

function supermercatoChiuso(chiave) {
  return chiusiSupermercato[chiave] !== false;
}

function colonneTabella() {
  const supermercato = colonnaSupermercato();
  const visibili = colonne.filter(function (nome) {
    return !eColonnaNascosta(nome) && nome !== supermercato;
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
  if (/importo|^imp$|^spesa$|prezzo|euro|valore|soldi|cifra|litri|km|chilometr|quantit|numero|costo/.test(basso)) {
    return "number";
  }
  if (/note|descrizione|commento|testo/.test(basso)) {
    return "textarea";
  }
  return "text";
}

function usaCombo(nome) {
  const basso = String(nome).toLowerCase();
  return /tipo|categoria|negozio|supermercato|^super$|pagamento|metodo|voce|fornitore|marca|sezione/.test(
    basso
  );
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
    const iso = isoDaValoreData(valore);
    const trovato = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (trovato) {
      return trovato[3] + "/" + trovato[2] + "/" + trovato[1];
    }
  }
  if (colonnaImporto() && nome === colonnaImporto()) {
    return formattaEuro(numeroDaValore(valore));
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
    return isoDaValoreData(b[colData]).localeCompare(isoDaValoreData(a[colData]));
  });
}

function sommaImporti(righe) {
  return righe.reduce(function (tot, riga) {
    return tot + importoRiga(riga);
  }, 0);
}

function raggruppaSpese(righe) {
  const anni = {};
  righe.forEach(function (riga) {
    const anno = annoDellaRiga(riga);
    const supermercato = supermercatoDellaRiga(riga);
    if (!anni[anno]) {
      anni[anno] = {};
    }
    if (!anni[anno][supermercato]) {
      anni[anno][supermercato] = [];
    }
    anni[anno][supermercato].push(riga);
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
    return String(b).localeCompare(String(a), "it", { numeric: true });
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
    const supermercato = riga.getAttribute("data-supermercato");
    const tipo = riga.getAttribute("data-tipo");
    let nascosta = false;
    if (!forzaAperti) {
      if (tipo !== "anno" && annoChiuso(anno)) {
        nascosta = true;
      }
      if (tipo === "dati" && supermercatoChiuso(chiaveSupermercato(anno, supermercato))) {
        nascosta = true;
      }
    }
    riga.classList.toggle("riga-nascosta", nascosta);
  });

  corpoTabella.querySelectorAll(".riga-anno button").forEach(function (bottone) {
    const riga = bottone.closest("tr");
    const anno = riga.getAttribute("data-anno");
    const aperto = forzaAperti || !annoChiuso(anno);
    riempiBottoneGruppo(bottone, aperto, anno, Number(riga.getAttribute("data-totale") || 0));
  });

  corpoTabella.querySelectorAll(".riga-supermercato button").forEach(function (bottone) {
    const riga = bottone.closest("tr");
    const anno = riga.getAttribute("data-anno");
    const supermercato = riga.getAttribute("data-supermercato");
    const aperto = forzaAperti || !supermercatoChiuso(chiaveSupermercato(anno, supermercato));
    riempiBottoneGruppo(
      bottone,
      aperto,
      supermercato,
      Number(riga.getAttribute("data-totale") || 0)
    );
  });
}

function creaRigaGruppo(className, tipo, anno, supermercato, etichettaGruppo, totale) {
  const tr = document.createElement("tr");
  tr.className = className;
  tr.setAttribute("data-tipo", tipo);
  tr.setAttribute("data-anno", anno);
  tr.setAttribute("data-totale", String(totale));
  if (supermercato) {
    tr.setAttribute("data-supermercato", supermercato);
  }
  const td = document.createElement("td");
  td.colSpan = Math.max(colonneTabella().length, 1);
  const bottone = document.createElement("button");
  bottone.type = "button";
  riempiBottoneGruppo(bottone, true, etichettaGruppo, totale);
  td.appendChild(bottone);
  tr.appendChild(td);
  return tr;
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
      "Nessuna riga visibile. Se in Table Editor ci sono dati, esegui sql/spesa-app.sql.";
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

  const gruppi = raggruppaSpese(visibili);
  const anni = ordinaAnni(Object.keys(gruppi));
  const colData = colonnaData();

  anni.forEach(function (anno) {
    const perSuper = gruppi[anno];
    const supermercati = Object.keys(perSuper).sort(confrontaTesto);
    const righeAnno = supermercati.reduce(function (acc, nome) {
      return acc.concat(perSuper[nome]);
    }, []);
    corpoTabella.appendChild(
      creaRigaGruppo("riga-anno", "anno", anno, "", anno, sommaImporti(righeAnno))
    );

    supermercati.forEach(function (supermercato) {
      const righeSuper = perSuper[supermercato].slice().sort(function (a, b) {
        if (!colData) {
          return 0;
        }
        return isoDaValoreData(b[colData]).localeCompare(isoDaValoreData(a[colData]));
      });
      corpoTabella.appendChild(
        creaRigaGruppo(
          "riga-supermercato",
          "supermercato",
          anno,
          supermercato,
          supermercato,
          sommaImporti(righeSuper)
        )
      );

      righeSuper.forEach(function (riga) {
        const tr = document.createElement("tr");
        tr.className = "riga-dati";
        tr.setAttribute("data-tipo", "dati");
        tr.setAttribute("data-anno", anno);
        tr.setAttribute("data-supermercato", supermercato);
        tr.setAttribute("data-id", String(idDellaRiga(riga)));
        tr.setAttribute("data-indice", String(cacheRighe.indexOf(riga)));
        colonneTabella().forEach(function (nome) {
          const td = document.createElement("td");
          td.textContent = testoCella(nome, riga[nome]);
          if (colonnaImporto() && nome === colonnaImporto()) {
            td.className = "cella-importo";
          }
          tr.appendChild(td);
        });
        corpoTabella.appendChild(tr);
      });
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
      nomeColonnaImporto = null;
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

function apriNuovaSpesa() {
  if (erroreCaricamento) {
    mostraStato(erroreCaricamento);
    return;
  }
  if (colonneModificabili().length === 0) {
    mostraStato(
      "Mancano le colonne. Aggiungi almeno una riga in Table Editor (con Data, ecc.) e poi ricarica."
    );
    return;
  }
  apriDialogo({}, true);
}

function apriNuovaSeRichiesto() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("nuovo") !== "1") {
    return;
  }
  if (window.history.replaceState) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  apriNuovaSpesa();
}

bottoneNuovo.addEventListener("click", function () {
  apriNuovaSpesa();
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
  const bottoneGruppo = evento.target.closest(".riga-anno button, .riga-supermercato button");
  if (bottoneGruppo) {
    const riga = bottoneGruppo.closest("tr");
    const tipo = riga.getAttribute("data-tipo");
    if (tipo === "anno") {
      const anno = riga.getAttribute("data-anno");
      chiusiAnno[anno] = annoChiuso(anno) ? false : true;
    } else {
      const chiave = chiaveSupermercato(
        riga.getAttribute("data-anno"),
        riga.getAttribute("data-supermercato")
      );
      chiusiSupermercato[chiave] = supermercatoChiuso(chiave) ? false : true;
    }
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
