const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
const GIORNI_LUNGHI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

const emailUtente = document.getElementById("email-utente");
const linkDati = document.querySelector(".link-dati");
if (linkDati) {
  linkDati.setAttribute("href", "dati.html");
  linkDati.addEventListener("click", function (evento) {
    evento.preventDefault();
    window.location.assign("dati.html");
  });
}
const bottoneEsci = document.getElementById("bottone-esci");
const filtroData = document.getElementById("filtro-data");
const bottoneOggi = document.getElementById("bottone-oggi");
const bottoneIndietro = document.getElementById("bottone-indietro");
const bottoneAvanti = document.getElementById("bottone-avanti");
const etichettaPeriodo = document.getElementById("etichetta-periodo");
const etichettaGiorno = document.getElementById("etichetta-giorno");
const bloccoCerca = document.getElementById("blocco-cerca");
const bloccoCalendario = document.getElementById("blocco-calendario");
const campoRicerca = document.getElementById("campo-ricerca");
const stato = document.getElementById("stato");
const areaVista = document.getElementById("area-vista");
const bottoneNuovo = document.getElementById("bottone-nuovo");
const dialogo = document.getElementById("dialogo");
const dialogoDettaglio = document.getElementById("dialogo-dettaglio");
const dettaglioTitolo = document.getElementById("dettaglio-titolo");
const dettaglioQuando = document.getElementById("dettaglio-quando");
const dettaglioTipo = document.getElementById("dettaglio-tipo");
const dettaglioInterlocutore = document.getElementById("dettaglio-interlocutore");
const dettaglioEsecutore = document.getElementById("dettaglio-esecutore");
const dettaglioNote = document.getElementById("dettaglio-note");
const dettaglioTelefono = document.getElementById("dettaglio-telefono");
const dettaglioEmail = document.getElementById("dettaglio-email");
const dettaglioChiudi = document.getElementById("dettaglio-chiudi");
const dettaglioModifica = document.getElementById("dettaglio-modifica");
const dettaglioDuplica = document.getElementById("dettaglio-duplica");
const dettaglioCancella = document.getElementById("dettaglio-cancella");
const formAppuntamento = document.getElementById("form-appuntamento");
const titoloDialogo = document.getElementById("titolo-dialogo");
const campoId = document.getElementById("id-appuntamento");
const campoTitolo = document.getElementById("titolo");
const campoData = document.getElementById("data");
const campoOra = document.getElementById("ora");
const campoImporto = document.getElementById("importo");
const campoStatoPagamento = document.getElementById("stato-pagamento");
const bloccoPagamento = document.getElementById("blocco-pagamento");
const rigaDettaglioImporto = document.getElementById("riga-dettaglio-importo");
const dettaglioImporto = document.getElementById("dettaglio-importo");
const rigaDettaglioStatoPagamento = document.getElementById("riga-dettaglio-stato-pagamento");
const dettaglioStatoPagamento = document.getElementById("dettaglio-stato-pagamento");
const campoNote = document.getElementById("note");
const campoTelefono = document.getElementById("telefono");
const campoEmail = document.getElementById("email-appuntamento");
const campoInterlocutore = document.getElementById("interlocutore");
const listaInterlocutore = document.getElementById("lista-interlocutore");
const campoEsecutore = document.getElementById("esecutore");
const listaEsecutore = document.getElementById("lista-esecutore");
const campoTipo = document.getElementById("tipo-appuntamento");
const listaTipo = document.getElementById("lista-tipo-appuntamento");
const campoPagamento = document.getElementById("pagamento");
const campoTutti = document.getElementById("tutti");
const erroreForm = document.getElementById("errore-form");
const bottoneAnnulla = document.getElementById("bottone-annulla");
const dettaglioVisibilita = document.getElementById("dettaglio-visibilita");
const dettaglioAzioni = document.getElementById("dettaglio-azioni");
const dialogoTutti = document.getElementById("dialogo-tutti");
const bottoneTuttiNo = document.getElementById("tutti-no");
const bottoneTuttiSi = document.getElementById("tutti-si");
const dialogoCancella = document.getElementById("dialogo-cancella");
const bottoneCancellaNo = document.getElementById("cancella-no");
const bottoneCancellaSi = document.getElementById("cancella-si");

let utenteId = null;
let vista = "giorno";
let dataRiferimento = daISO(oggiISO());
let cacheAppuntamenti = [];
let cacheCompleanni = [];
let testoRicerca = "";
let idDettaglio = null;
let idDaCancellare = null;
let nomeColonnaTutti = "Tutti";
let nomeColonnaInterlocutore = "Interlocutore";
let nomeColonnaEsecutore = "Esecutore";
let nomeColonnaTipo = "TipoAppuntamento";
let nomeColonnaTelefono = "Telefono";
let nomeColonnaEmail = "email";
let nomeColonnaImporto = "Importo";
let nomeColonnaStatoPagamento = "StatoPagamento";
let nomeColonnaPagamento = "Pagamento";

function oggiISO() {
  return aISO(new Date());
}

function normalizzaData(valore) {
  const trovato = String(valore || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return trovato ? trovato[1] : "";
}

function aISO(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const mese = String(d.getMonth() + 1).padStart(2, "0");
  const giorno = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mese + "-" + giorno;
}

function daISO(valore) {
  const iso = normalizzaData(valore);
  if (!iso) {
    return new Date();
  }
  const parti = iso.split("-");
  return new Date(Number(parti[0]), Number(parti[1]) - 1, Number(parti[2]));
}

function copiaData(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function formattaData(valore) {
  if (!valore) {
    return "";
  }
  const data = typeof valore === "string" ? daISO(valore) : valore;
  return (
    String(data.getDate()).padStart(2, "0") +
    "/" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "/" +
    data.getFullYear()
  );
}

function formattaOra(valore) {
  if (!valore) {
    return "";
  }
  return String(valore).slice(0, 5);
}

function eTutti(elemento) {
  const valore = elemento.Tutti !== undefined ? elemento.Tutti : elemento.tutti;
  return valore === true || valore === "true" || valore === "t" || valore === 1;
}

function eMio(elemento) {
  if (elemento && elemento.eCompleanno) {
    return false;
  }
  return String(elemento.user_id || "") === String(utenteId || "");
}

function vuotoONull(valore) {
  const testo = String(valore || "").trim();
  return testo === "" ? null : testo;
}

function telefonoPerDatabase(valore) {
  const testo = String(valore || "").trim();
  if (!testo) {
    return null;
  }
  const cifre = testo.replace(/\D/g, "");
  if (cifre) {
    return Number(cifre);
  }
  return testo;
}

function valoreColonna(elemento, nomeLogico) {
  if (!elemento) {
    return "";
  }
  const basso = String(nomeLogico).toLowerCase();
  const chiave = Object.keys(elemento).find(function (nome) {
    return String(nome).toLowerCase() === basso;
  });
  if (!chiave || elemento[chiave] == null) {
    return "";
  }
  return String(elemento[chiave]).trim();
}

function testoInterlocutore(elemento) {
  return valoreColonna(elemento, "Interlocutore");
}

function testoEsecutore(elemento) {
  return valoreColonna(elemento, "Esecutore");
}

function testoTipoAppuntamento(elemento) {
  if (elemento && elemento.eCompleanno) {
    return "COMPLEANNO";
  }
  return valoreColonna(elemento, "TipoAppuntamento") || "APPUNTAMENTO";
}

function testoTipoPagamento(elemento) {
  return valoreColonna(elemento, "TipoPagamento");
}

function iniziaPerPagare(testo) {
  return String(testo || "").trim().toUpperCase().indexOf("PAGARE") === 0;
}

function eTipoPagare(elementoOTesto) {
  if (typeof elementoOTesto === "string") {
    return iniziaPerPagare(elementoOTesto);
  }
  return (
    iniziaPerPagare(testoTipoPagamento(elementoOTesto)) ||
    iniziaPerPagare(valoreColonna(elementoOTesto, "TipoAppuntamento"))
  );
}

function valoreBooleano(valore) {
  return valore === true || valore === "true" || valore === "t" || valore === 1 || valore === "1";
}

function flagColonnaBooleana(elemento, nomeLogico) {
  if (!elemento) {
    return null;
  }
  const basso = String(nomeLogico).toLowerCase();
  const chiave = Object.keys(elemento).find(function (nome) {
    return String(nome).toLowerCase() === basso;
  });
  if (!chiave || elemento[chiave] === null || elemento[chiave] === undefined || elemento[chiave] === "") {
    return null;
  }
  return valoreBooleano(elemento[chiave]);
}

function ePagamento(elemento) {
  if (!elemento || elemento.eCompleanno) {
    return false;
  }
  return flagColonnaBooleana(elemento, "Pagamento") === true || eTipoPagare(elemento);
}

function formattaImporto(valore) {
  const testo = String(valore || "").trim();
  if (!testo) {
    return "";
  }
  const numero = Number(String(testo).replace(",", "."));
  if (!Number.isFinite(numero)) {
    return testo;
  }
  return numero.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function importoPerDatabase(valore) {
  const testo = String(valore || "").trim().replace(",", ".");
  if (!testo) {
    return null;
  }
  const numero = Number(testo);
  return Number.isFinite(numero) ? numero : testo;
}

function aggiornaCampiPagamento() {
  const visibile = campoPagamento.checked;
  bloccoPagamento.hidden = !visibile;
  if (visibile && !campoStatoPagamento.value) {
    campoStatoPagamento.value = "PAGARE";
  }
}

function forseSpuntaPagamentoDaTipo() {
  if (eTipoPagare(campoTipo.value)) {
    campoPagamento.checked = true;
  }
  aggiornaCampiPagamento();
}

function testoRicercaAppuntamento(elemento) {
  const pezzi = [];
  Object.keys(elemento).forEach(function (chiave) {
    const valore = elemento[chiave];
    if (valore === null || valore === undefined) {
      return;
    }
    if (typeof valore === "object") {
      return;
    }
    pezzi.push(String(valore));
  });
  pezzi.push(formattaData(elemento.data));
  pezzi.push(formattaOra(elemento.ora));
  pezzi.push(testoTipoAppuntamento(elemento));
  pezzi.push(testoInterlocutore(elemento));
  pezzi.push(testoEsecutore(elemento));
  pezzi.push(elemento.titolo || "");
  pezzi.push(elemento.note || "");
  pezzi.push(eTutti(elemento) ? "visibile a tutti" : "solo a te");
  if (elemento.eCompleanno) {
    pezzi.push("compleanno");
  }
  const iso = normalizzaData(elemento.data);
  if (iso) {
    const data = daISO(iso);
    pezzi.push(testoDataCerca(iso));
    pezzi.push(MESI[data.getMonth()]);
    pezzi.push(String(data.getFullYear()));
  }
  return pezzi.join(" ").toLowerCase();
}

function dueCifre(n) {
  const testo = String(n);
  return testo.length === 1 ? "0" + testo : testo;
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
  const riguardo = isoDaValoreData(riguardoIso);
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

function valoreRigaCompleanno(riga, candidati) {
  const chiavi = Object.keys(riga || {});
  for (let i = 0; i < candidati.length; i += 1) {
    const basso = String(candidati[i]).toLowerCase();
    const chiave = chiavi.find(function (nome) {
      return String(nome).toLowerCase() === basso;
    });
    if (chiave && riga[chiave] != null && String(riga[chiave]).trim() !== "") {
      return riga[chiave];
    }
  }
  return "";
}

function idRigaCompleanno(riga) {
  return valoreRigaCompleanno(riga, ["id", "IdCompleanno", "IDCOMPLEANNO", "idcompleanno"]);
}

function nominativoCompleanno(riga) {
  return String(
    valoreRigaCompleanno(riga, ["NOMINATIVO", "Nominativo", "Nome", "nome"]) || "Compleanno"
  ).trim();
}

function dataNascitaCompleanno(riga) {
  const diretto = valoreRigaCompleanno(riga, ["Data", "DataNascita", "Nascita", "Compleanno"]);
  if (diretto) {
    return isoDaValoreData(diretto);
  }
  const chiavi = Object.keys(riga || {});
  const chiave = chiavi.find(function (nome) {
    const basso = String(nome).toLowerCase();
    return /data|nascita|compleanno/.test(basso) && basso !== "created_at";
  });
  return chiave ? isoDaValoreData(riga[chiave]) : "";
}

function isoCompleannoNellAnno(nascitaIso, anno) {
  const nascita = isoDaValoreData(nascitaIso);
  if (!nascita || !anno) {
    return "";
  }
  const parti = nascita.split("-");
  let mese = parti[1];
  let giorno = parti[2];
  if (mese === "02" && giorno === "29" && !eBisestile(anno)) {
    giorno = "28";
  }
  return String(anno) + "-" + mese + "-" + giorno;
}

function eventoCompleanno(riga, iso) {
  const nascita = dataNascitaCompleanno(riga);
  const eta = etaDaNascita(nascita, iso);
  const nominativo = nominativoCompleanno(riga);
  const titolo = eta === "" ? nominativo : nominativo + " · " + eta + " anni";
  return {
    id: "compleanno-" + idRigaCompleanno(riga) + "-" + iso,
    titolo: titolo,
    data: iso,
    ora: "",
    note: "",
    TipoAppuntamento: "COMPLEANNO",
    Tutti: false,
    eCompleanno: true,
    user_id: "",
  };
}

function compleanniDelGiorno(iso) {
  const giorno = normalizzaData(iso);
  if (!giorno) {
    return [];
  }
  const anno = giorno.slice(0, 4);
  const eventi = [];
  cacheCompleanni.forEach(function (riga) {
    const nascita = dataNascitaCompleanno(riga);
    if (!nascita) {
      return;
    }
    if (isoCompleannoNellAnno(nascita, anno) === giorno) {
      eventi.push(eventoCompleanno(riga, giorno));
    }
  });
  return eventi;
}

function compleanniDellAnno(anno) {
  const eventi = [];
  cacheCompleanni.forEach(function (riga) {
    const nascita = dataNascitaCompleanno(riga);
    const iso = isoCompleannoNellAnno(nascita, anno);
    if (iso) {
      eventi.push(eventoCompleanno(riga, iso));
    }
  });
  return eventi;
}

function appuntamentiDelGiorno(iso) {
  const giorno = normalizzaData(iso);
  const reali = cacheAppuntamenti.filter(function (elemento) {
    return normalizzaData(elemento.data) === giorno;
  });
  return compleanniDelGiorno(giorno).concat(reali);
}

function appuntamentiFiltrati() {
  const filtro = testoRicerca.trim().toLowerCase();
  const annoVista = dataRiferimento.getFullYear();
  const annoOggi = new Date().getFullYear();
  let elenco = cacheAppuntamenti.concat(compleanniDellAnno(annoVista));
  if (annoOggi !== annoVista) {
    elenco = elenco.concat(compleanniDellAnno(annoOggi));
  }
  if (!filtro) {
    elenco = elenco.slice();
  } else {
    elenco = elenco.filter(function (elemento) {
      return testoRicercaAppuntamento(elemento).indexOf(filtro) !== -1;
    });
  }
  return elenco.sort(function (a, b) {
    return String(a.data || "").localeCompare(String(b.data || ""));
  });
}

function valoriUnici(leggiValore) {
  const visti = {};
  cacheAppuntamenti.forEach(function (elemento) {
    const valore = leggiValore(elemento);
    if (valore) {
      visti[valore] = true;
    }
  });
  return Object.keys(visti).sort(function (a, b) {
    return a.localeCompare(b, "it", { sensitivity: "base" });
  });
}

function collegaCombo(input, lista, elencoValori) {
  function disegna(filtro) {
    const tutti = elencoValori();
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
        if (input === campoTipo) {
          forseSpuntaPagamentoDaTipo();
        }
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
        if (input === campoTipo) {
          forseSpuntaPagamentoDaTipo();
        }
      });
      lista.appendChild(voceNuova);
    }

    lista.hidden = lista.childNodes.length === 0;
  }

  input.addEventListener("focus", function () {
    disegna("");
  });
  input.addEventListener("input", function () {
    disegna(input.value);
  });
  input.addEventListener("blur", function () {
    window.setTimeout(function () {
      lista.hidden = true;
    }, 180);
  });
}

function ricordaNomiColonne(righe) {
  const riga = (righe || []).find(function (elemento) {
    return elemento;
  });
  if (!riga) {
    return;
  }
  Object.keys(riga).forEach(function (chiave) {
    const basso = chiave.toLowerCase();
    if (basso === "tutti") {
      nomeColonnaTutti = chiave;
    }
    if (basso === "interlocutore") {
      nomeColonnaInterlocutore = chiave;
    }
    if (basso === "esecutore") {
      nomeColonnaEsecutore = chiave;
    }
    if (basso === "tipoappuntamento") {
      nomeColonnaTipo = chiave;
    }
    if (basso === "telefono") {
      nomeColonnaTelefono = chiave;
    }
    if (basso === "email") {
      nomeColonnaEmail = chiave;
    }
    if (basso === "importo") {
      nomeColonnaImporto = chiave;
    }
    if (basso === "statopagamento") {
      nomeColonnaStatoPagamento = chiave;
    }
    if (basso === "pagamento") {
      nomeColonnaPagamento = chiave;
    }
  });
}

function badgeTutti() {
  const span = document.createElement("span");
  span.className = "badge-tutti";
  span.textContent = "Tutti";
  return span;
}

function lunediDellaSettimana(data) {
  const d = copiaData(data);
  const giorno = d.getDay();
  const offset = giorno === 0 ? -6 : 1 - giorno;
  d.setDate(d.getDate() + offset);
  return d;
}

function aggiungiGiorni(data, quanti) {
  const d = copiaData(data);
  d.setDate(d.getDate() + quanti);
  return d;
}

function spostaMese(data, quanti) {
  const giorno = data.getDate();
  const d = new Date(data.getFullYear(), data.getMonth() + quanti, 1);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(giorno, ultimo));
  return d;
}

function stessoGiorno(a, b) {
  return aISO(a) === aISO(b);
}

function testoPeriodo() {
  if (vista === "cerca") {
    return "Tutti gli appuntamenti";
  }
  if (vista === "giorno") {
    return (
      dataRiferimento.getDate() +
      " " +
      MESI[dataRiferimento.getMonth()] +
      " " +
      dataRiferimento.getFullYear()
    );
  }
  if (vista === "settimana") {
    const lunedi = lunediDellaSettimana(dataRiferimento);
    const domenica = aggiungiGiorni(lunedi, 6);
    return formattaData(lunedi) + " – " + formattaData(domenica);
  }
  return MESI[dataRiferimento.getMonth()] + " " + dataRiferimento.getFullYear();
}

function testoBarraGiorno() {
  if (vista === "giorno") {
    return GIORNI_LUNGHI[dataRiferimento.getDay()];
  }
  return "";
}

function mostraErroreForm(testo) {
  erroreForm.hidden = !testo;
  erroreForm.textContent = testo || "";
}

async function assicuratiLogin() {
  const sessione = await getSessione();
  if (!sessione || !sessione.user) {
    window.location.replace("index.html");
    return null;
  }
  return sessione.user;
}

function aggiornaPulsantiVista() {
  document.querySelectorAll(".bottone-vista").forEach(function (bottone) {
    const attiva = bottone.getAttribute("data-vista") === vista;
    bottone.classList.toggle("attivo", attiva);
    bottone.setAttribute("aria-pressed", attiva ? "true" : "false");
  });
}

function cardAppuntamento(elemento) {
  const li = document.createElement("li");
  li.className = elemento.eCompleanno ? "card-appuntamento compleanno" : "card-appuntamento";
  li.setAttribute("data-id", elemento.id);

  const h2 = document.createElement("h2");
  h2.textContent = elemento.titolo;
  if (eTutti(elemento)) {
    h2.appendChild(document.createTextNode(" "));
    h2.appendChild(badgeTutti());
  }
  const meta = document.createElement("p");
  meta.className = "meta";
  const quando = formattaOra(elemento.ora)
    ? formattaData(elemento.data) + " · " + formattaOra(elemento.ora)
    : formattaData(elemento.data);
  const persona = testoInterlocutore(elemento);
  const tipo = testoTipoAppuntamento(elemento);
  const extra = [tipo, persona].filter(Boolean).join(" · ");
  meta.textContent = extra ? quando + " · " + extra : quando;
  li.appendChild(h2);
  li.appendChild(meta);
  if (elemento.note) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = elemento.note;
    li.appendChild(note);
  }
  if (eMio(elemento)) {
    const azioni = document.createElement("div");
    azioni.className = "azioni";
    const modifica = document.createElement("button");
    modifica.className = "bottone-secondario";
    modifica.type = "button";
    modifica.setAttribute("data-azione", "modifica");
    modifica.textContent = "Modifica";
    const duplica = document.createElement("button");
    duplica.className = "bottone-secondario";
    duplica.type = "button";
    duplica.setAttribute("data-azione", "duplica");
    duplica.textContent = "Duplica";
    const cancella = document.createElement("button");
    cancella.className = "bottone-pericolo";
    cancella.type = "button";
    cancella.setAttribute("data-azione", "cancella");
    cancella.textContent = "Cancella";
    azioni.appendChild(cancella);
    azioni.appendChild(duplica);
    azioni.appendChild(modifica);
    li.appendChild(azioni);
  }
  return li;
}

function rigaGiorno(elemento) {
  const li = document.createElement("li");
  li.className = elemento.eCompleanno ? "riga-appuntamento compleanno" : "riga-appuntamento";
  li.setAttribute("data-id", elemento.id);
  li.setAttribute("role", "button");
  li.tabIndex = 0;

  const prima = document.createElement("div");
  prima.className = "prima-riga";

  const ora = document.createElement("span");
  ora.className = "ora-riga";
  ora.textContent = elemento.eCompleanno ? "🎂" : formattaOra(elemento.ora) || "—";

  const sep = document.createElement("span");
  sep.className = "sep-riga";
  sep.textContent = "-";

  const tipo = document.createElement("span");
  tipo.className = "titolo-riga";
  tipo.textContent = elemento.eCompleanno
    ? elemento.titolo || "Compleanno"
    : testoTipoAppuntamento(elemento);

  prima.appendChild(ora);
  prima.appendChild(sep);
  prima.appendChild(tipo);
  if (eTutti(elemento) && !elemento.eCompleanno) {
    prima.appendChild(badgeTutti());
  }
  li.appendChild(prima);

  if (!elemento.eCompleanno && elemento.titolo && (vista === "giorno" || vista === "settimana")) {
    const seconda = document.createElement("p");
    seconda.className = "sotto-riga";
    seconda.textContent = elemento.titolo;
    li.appendChild(seconda);
  }
  return li;
}

function trovaAppuntamento(id) {
  const reale = cacheAppuntamenti.find(function (elemento) {
    return String(elemento.id) === String(id);
  });
  if (reale) {
    return reale;
  }
  const testo = String(id || "");
  const trovato = testo.match(/^compleanno-(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (!trovato) {
    return undefined;
  }
  return compleanniDelGiorno(trovato[2]).find(function (elemento) {
    return String(elemento.id) === testo;
  });
}

function testoQuando(elemento) {
  const data = formattaData(elemento.data);
  const ora = formattaOra(elemento.ora);
  return ora ? data + " alle " + ora : data;
}

function apriDettaglio(id) {
  const elemento = trovaAppuntamento(id);
  if (!elemento) {
    return;
  }
  idDettaglio = elemento.id;
  dettaglioQuando.textContent = testoQuando(elemento);
  dettaglioVisibilita.textContent = elemento.eCompleanno
    ? "Compleanno (ogni anno)"
    : eTutti(elemento)
      ? "Visibile a tutti"
      : "Visibile solo a te";
  const mostraPagamento = ePagamento(elemento);
  rigaDettaglioImporto.hidden = !mostraPagamento;
  rigaDettaglioStatoPagamento.hidden = !mostraPagamento;
  dettaglioImporto.textContent = formattaImporto(valoreColonna(elemento, "Importo")) || "—";
  dettaglioStatoPagamento.textContent = valoreColonna(elemento, "StatoPagamento") || "—";
  dettaglioTipo.textContent = testoTipoAppuntamento(elemento);
  dettaglioTitolo.textContent = elemento.titolo || "—";
  dettaglioInterlocutore.textContent = testoInterlocutore(elemento) || "—";
  dettaglioEsecutore.textContent = testoEsecutore(elemento) || "—";
  dettaglioNote.textContent = elemento.note ? elemento.note : "—";
  dettaglioTelefono.textContent = valoreColonna(elemento, "Telefono") || "—";
  dettaglioEmail.textContent = valoreColonna(elemento, "email") || "—";
  dettaglioAzioni.hidden = !eMio(elemento);
  dialogoDettaglio.showModal();
}

function listaVuota(testo) {
  const li = document.createElement("li");
  li.className = "vuoto";
  li.textContent = testo;
  return li;
}

function disegnaGiorno() {
  const ul = document.createElement("ul");
  ul.className = "lista";
  const iso = aISO(dataRiferimento);
  const elementi = appuntamentiDelGiorno(iso);
  if (!elementi.length) {
    ul.appendChild(listaVuota("Nessun appuntamento in questo giorno."));
    if (cacheAppuntamenti.length || cacheCompleanni.length) {
      ul.appendChild(
        listaVuota("Hai appuntamenti in altri giorni: apri Settimana o Mese per vederli.")
      );
    }
  } else {
    elementi.forEach(function (elemento) {
      ul.appendChild(rigaGiorno(elemento));
    });
  }
  areaVista.appendChild(ul);
}

function disegnaSettimana() {
  const lunedi = lunediDellaSettimana(dataRiferimento);
  const oggi = oggiISO();
  for (let i = 0; i < 7; i += 1) {
    const giorno = aggiungiGiorni(lunedi, i);
    const iso = aISO(giorno);
    const sezione = document.createElement("section");
    sezione.className = "giorno-settimana";
    if (iso === oggi) {
      sezione.classList.add("oggi");
    }
    if (stessoGiorno(giorno, dataRiferimento)) {
      sezione.classList.add("selezionato");
    }

    const titolo = document.createElement("button");
    titolo.type = "button";
    titolo.className = "titolo-giorno";
    titolo.setAttribute("data-iso", iso);
    titolo.textContent = GIORNI_SETTIMANA[i] + " " + giorno.getDate() + "/" + (giorno.getMonth() + 1);
    sezione.appendChild(titolo);

    const ul = document.createElement("ul");
    ul.className = "lista lista-compatta";
    const elementi = appuntamentiDelGiorno(iso);
    if (!elementi.length) {
      const vuoto = document.createElement("li");
      vuoto.className = "mini-vuoto";
      vuoto.textContent = "Niente in programma";
      ul.appendChild(vuoto);
    } else {
      elementi.forEach(function (elemento) {
        ul.appendChild(rigaGiorno(elemento));
      });
    }
    sezione.appendChild(ul);
    areaVista.appendChild(sezione);
  }
}

function disegnaMese() {
  const griglia = document.createElement("div");
  griglia.className = "griglia-mese";

  GIORNI_SETTIMANA.forEach(function (nome) {
    const testata = document.createElement("div");
    testata.className = "cella-testata";
    testata.textContent = nome;
    griglia.appendChild(testata);
  });

  const primo = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth(), 1);
  const offset = (primo.getDay() + 6) % 7;
  const ultimoGiorno = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth() + 1, 0).getDate();
  const oggi = oggiISO();

  for (let i = 0; i < offset; i += 1) {
    const vuota = document.createElement("div");
    vuota.className = "cella-giorno vuota";
    griglia.appendChild(vuota);
  }

  for (let n = 1; n <= ultimoGiorno; n += 1) {
    const giorno = new Date(dataRiferimento.getFullYear(), dataRiferimento.getMonth(), n);
    const iso = aISO(giorno);
    const quanti = appuntamentiDelGiorno(iso).length;
    const bottone = document.createElement("button");
    bottone.type = "button";
    bottone.className = "cella-giorno";
    bottone.setAttribute("data-iso", iso);
    if (iso === oggi) {
      bottone.classList.add("oggi");
    }
    if (stessoGiorno(giorno, dataRiferimento)) {
      bottone.classList.add("selezionato");
    }
    const numero = document.createElement("span");
    numero.className = "numero-giorno";
    numero.textContent = String(n);
    bottone.appendChild(numero);
    if (quanti) {
      const punto = document.createElement("span");
      punto.className = "punto-appuntamenti";
      punto.textContent = String(quanti);
      bottone.appendChild(punto);
    }
    griglia.appendChild(bottone);
  }

  areaVista.appendChild(griglia);

  const ul = document.createElement("ul");
  ul.className = "lista";
  const elementi = appuntamentiDelGiorno(aISO(dataRiferimento));
  if (!elementi.length) {
    ul.appendChild(listaVuota("Nessun appuntamento in questo giorno."));
  } else {
    elementi.forEach(function (elemento) {
      ul.appendChild(rigaGiorno(elemento));
    });
  }
  areaVista.appendChild(ul);
}

function testoDataCerca(iso) {
  if (!iso) {
    return "Senza data";
  }
  const data = daISO(iso);
  return GIORNI_LUNGHI[data.getDay()] + " " + formattaData(iso);
}

function disegnaCerca() {
  const ul = document.createElement("ul");
  ul.className = "lista";
  const elementi = appuntamentiFiltrati();
  if (!cacheAppuntamenti.length && !cacheCompleanni.length) {
    ul.appendChild(listaVuota("Nessun appuntamento."));
    areaVista.appendChild(ul);
    return;
  }
  if (!elementi.length) {
    ul.appendChild(listaVuota("Nessun appuntamento trovato."));
    areaVista.appendChild(ul);
    return;
  }

  let dataCorrente = "";
  elementi.forEach(function (elemento) {
    const iso = normalizzaData(elemento.data);
    if (iso !== dataCorrente) {
      dataCorrente = iso;
      const testata = document.createElement("li");
      testata.className = "testata-data";
      testata.textContent = testoDataCerca(iso);
      ul.appendChild(testata);
    }
    ul.appendChild(rigaGiorno(elemento));
  });
  areaVista.appendChild(ul);
}

function aggiornaLayoutVista() {
  const inCerca = vista === "cerca";
  bloccoCerca.hidden = !inCerca;
  bloccoCalendario.hidden = inCerca;
}

function disegnaVista() {
  aggiornaLayoutVista();
  etichettaPeriodo.textContent = testoPeriodo();
  const nomeGiorno = testoBarraGiorno();
  etichettaGiorno.textContent = nomeGiorno;
  etichettaGiorno.hidden = !nomeGiorno;
  filtroData.value = aISO(dataRiferimento);
  aggiornaPulsantiVista();
  areaVista.innerHTML = "";
  if (vista === "giorno") {
    disegnaGiorno();
  } else if (vista === "settimana") {
    disegnaSettimana();
  } else if (vista === "cerca") {
    disegnaCerca();
  } else {
    disegnaMese();
  }
}

async function caricaCompleanni() {
  cacheCompleanni = [];
  const nomi = ["Compleanni", "compleanni"];
  for (let i = 0; i < nomi.length; i += 1) {
    const { data, error } = await getSupabase().from(nomi[i]).select("*");
    if (!error) {
      cacheCompleanni = data || [];
      return;
    }
    const testo = String((error && error.message) || error || "");
    if (!/schema cache|could not find the table/i.test(testo)) {
      return;
    }
  }
}

async function caricaAppuntamenti() {
  stato.textContent = "";
  const { data, error } = await getSupabase()
    .from("appuntamenti")
    .select("*")
    .order("data", { ascending: true })
    .order("ora", { ascending: true });

  await caricaCompleanni();

  if (error) {
    stato.textContent = messaggioErrore(error);
    cacheAppuntamenti = [];
    disegnaVista();
    return;
  }

  ricordaNomiColonne(data);
  cacheAppuntamenti = (data || []).map(function (elemento) {
    return Object.assign({}, elemento, { data: normalizzaData(elemento.data) });
  });
  disegnaVista();
}

function impostaVista(nuovaVista) {
  vista = nuovaVista;
  caricaAppuntamenti().then(function () {
    if (vista === "cerca") {
      campoRicerca.focus();
    }
  });
}

function vaiA(iso) {
  dataRiferimento = daISO(iso);
  caricaAppuntamenti();
}

function apriDialogo(appuntamento, duplica) {
  mostraErroreForm("");
  if (appuntamento) {
    titoloDialogo.textContent = duplica ? "Duplica appuntamento" : "Modifica appuntamento";
    campoId.value = duplica ? "" : appuntamento.id || "";
    campoTitolo.value = appuntamento.titolo;
    campoData.value = normalizzaData(appuntamento.data);
    campoOra.value = formattaOra(appuntamento.ora);
    campoTipo.value = testoTipoAppuntamento(appuntamento);
    campoInterlocutore.value = testoInterlocutore(appuntamento);
    campoEsecutore.value = testoEsecutore(appuntamento);
    campoNote.value = appuntamento.note || "";
    campoTelefono.value = valoreColonna(appuntamento, "Telefono");
    campoEmail.value = valoreColonna(appuntamento, "email");
    campoTutti.checked = eTutti(appuntamento);
    campoPagamento.checked = ePagamento(appuntamento);
    const stato = valoreColonna(appuntamento, "StatoPagamento").toUpperCase();
    campoImporto.value = valoreColonna(appuntamento, "Importo");
    campoStatoPagamento.value = stato === "PAGATO" ? "PAGATO" : "PAGARE";
  } else {
    titoloDialogo.textContent = "Nuovo appuntamento";
    campoId.value = "";
    campoTitolo.value = "";
    campoData.value = aISO(dataRiferimento);
    campoOra.value = "";
    campoTipo.value = "";
    campoInterlocutore.value = "";
    campoEsecutore.value = "";
    campoNote.value = "";
    campoTelefono.value = "";
    campoEmail.value = "";
    campoTutti.checked = false;
    campoPagamento.checked = false;
    campoImporto.value = "";
    campoStatoPagamento.value = "PAGARE";
  }
  listaTipo.hidden = true;
  listaInterlocutore.hidden = true;
  listaEsecutore.hidden = true;
  aggiornaCampiPagamento();
  dialogo.showModal();
}

document.querySelectorAll(".bottone-vista").forEach(function (bottone) {
  bottone.addEventListener("click", function () {
    impostaVista(bottone.getAttribute("data-vista"));
  });
});

campoRicerca.addEventListener("input", function () {
  testoRicerca = campoRicerca.value;
  if (vista === "cerca") {
    disegnaVista();
  }
});

bottoneIndietro.addEventListener("click", function () {
  if (vista === "giorno") {
    dataRiferimento = aggiungiGiorni(dataRiferimento, -1);
  } else if (vista === "settimana") {
    dataRiferimento = aggiungiGiorni(dataRiferimento, -7);
  } else {
    dataRiferimento = spostaMese(dataRiferimento, -1);
  }
  caricaAppuntamenti();
});

bottoneAvanti.addEventListener("click", function () {
  if (vista === "giorno") {
    dataRiferimento = aggiungiGiorni(dataRiferimento, 1);
  } else if (vista === "settimana") {
    dataRiferimento = aggiungiGiorni(dataRiferimento, 7);
  } else {
    dataRiferimento = spostaMese(dataRiferimento, 1);
  }
  caricaAppuntamenti();
});

bottoneOggi.addEventListener("click", function () {
  vista = "giorno";
  vaiA(oggiISO());
});

etichettaPeriodo.addEventListener("click", function () {
  if (vista === "cerca") {
    return;
  }
  if (typeof filtroData.showPicker === "function") {
    filtroData.showPicker();
  } else {
    filtroData.focus();
  }
});

filtroData.addEventListener("change", function () {
  if (filtroData.value) {
    vaiA(filtroData.value);
  }
});

bottoneNuovo.addEventListener("click", function () {
  apriDialogo(null);
});

collegaCombo(campoTipo, listaTipo, function () {
  const elenco = valoriUnici(testoTipoAppuntamento);
  if (elenco.indexOf("APPUNTAMENTO") === -1) {
    elenco.unshift("APPUNTAMENTO");
  }
  if (elenco.indexOf("PAGARE") === -1) {
    elenco.push("PAGARE");
  }
  return elenco;
});
campoTipo.addEventListener("input", forseSpuntaPagamentoDaTipo);
campoTipo.addEventListener("change", forseSpuntaPagamentoDaTipo);
campoPagamento.addEventListener("change", aggiornaCampiPagamento);
collegaCombo(campoInterlocutore, listaInterlocutore, function () {
  return valoriUnici(testoInterlocutore);
});
collegaCombo(campoEsecutore, listaEsecutore, function () {
  return valoriUnici(testoEsecutore);
});

bottoneAnnulla.addEventListener("click", function () {
  dialogo.close();
});

dettaglioChiudi.addEventListener("click", function () {
  dialogoDettaglio.close();
});

dettaglioModifica.addEventListener("click", function () {
  const elemento = trovaAppuntamento(idDettaglio);
  if (!elemento || !eMio(elemento)) {
    return;
  }
  dialogoDettaglio.close();
  apriDialogo(elemento);
});

dettaglioDuplica.addEventListener("click", function () {
  const elemento = trovaAppuntamento(idDettaglio);
  if (!elemento || !eMio(elemento)) {
    return;
  }
  dialogoDettaglio.close();
  apriDialogo(elemento, true);
});

function chiediCancellazione(id) {
  idDaCancellare = id;
  dialogoCancella.showModal();
}

async function eseguiCancellazione() {
  const id = idDaCancellare;
  if (!id || String(id).indexOf("compleanno-") === 0) {
    return;
  }
  const cancellazione = await getSupabase().from("appuntamenti").delete().eq("id", id);
  if (cancellazione.error) {
    stato.textContent = messaggioErrore(cancellazione.error);
    return;
  }
  idDaCancellare = null;
  dialogoCancella.close();
  if (dialogoDettaglio.open) {
    dialogoDettaglio.close();
  }
  await caricaAppuntamenti();
}

dettaglioCancella.addEventListener("click", function () {
  const elemento = trovaAppuntamento(idDettaglio);
  if (!elemento || !eMio(elemento)) {
    return;
  }
  chiediCancellazione(idDettaglio);
});

bottoneCancellaNo.addEventListener("click", function () {
  idDaCancellare = null;
  dialogoCancella.close();
});

bottoneCancellaSi.addEventListener("click", function () {
  eseguiCancellazione();
});

areaVista.addEventListener("keydown", function (evento) {
  const riga = evento.target.closest(".riga-appuntamento");
  if (!riga) {
    return;
  }
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();
    apriDettaglio(riga.getAttribute("data-id"));
  }
});

areaVista.addEventListener("click", async function (evento) {
  const riga = evento.target.closest(".riga-appuntamento");
  if (riga) {
    apriDettaglio(riga.getAttribute("data-id"));
    return;
  }

  const giornoCalendario = evento.target.closest("[data-iso]");
  const bottoneAzione = evento.target.closest("button[data-azione]");

  if (giornoCalendario && !bottoneAzione) {
    if (vista !== "mese") {
      vista = "giorno";
    }
    vaiA(giornoCalendario.getAttribute("data-iso"));
    return;
  }

  if (!bottoneAzione) {
    return;
  }

  const card = bottoneAzione.closest(".card-appuntamento");
  const id = card.getAttribute("data-id");
  const azione = bottoneAzione.getAttribute("data-azione");
  const { data, error } = await getSupabase()
    .from("appuntamenti")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    stato.textContent = messaggioErrore(error);
    return;
  }

  if (azione === "modifica") {
    if (!eMio(data)) {
      return;
    }
    apriDialogo(Object.assign({}, data, { data: normalizzaData(data.data) }));
    return;
  }

  if (azione === "duplica") {
    if (!eMio(data)) {
      return;
    }
    apriDialogo(Object.assign({}, data, { data: normalizzaData(data.data) }), true);
    return;
  }

  if (azione === "cancella") {
    if (!eMio(data)) {
      return;
    }
    chiediCancellazione(id);
  }
});

async function salvaAppuntamento() {
  const titolo = campoTitolo.value.trim();
  const data = campoData.value;
  const ora = campoOra.value || null;
  const interlocutore = vuotoONull(campoInterlocutore.value);
  const esecutore = vuotoONull(campoEsecutore.value);
  const tipo = campoTipo.value.trim();
  const note = campoNote.value.trim();
  const telefono = telefonoPerDatabase(campoTelefono.value);
  const email = vuotoONull(campoEmail.value);
  const mostraPagamento = campoPagamento.checked;
  const importo = mostraPagamento ? importoPerDatabase(campoImporto.value) : null;
  const statoPagamento = mostraPagamento ? campoStatoPagamento.value || "PAGARE" : null;
  const pagamento = mostraPagamento;

  if (!tipo || !titolo || !data) {
    mostraErroreForm("Tipo, titolo e data sono obbligatori.");
    return;
  }

  const payload = {
    titolo: titolo,
    data: data,
    ora: ora,
    note: note,
    user_id: utenteId,
  };
  payload[nomeColonnaTutti] = campoTutti.checked;
  payload[nomeColonnaInterlocutore] = interlocutore;
  payload[nomeColonnaEsecutore] = esecutore;
  payload[nomeColonnaTipo] = tipo;
  payload[nomeColonnaTelefono] = telefono;
  payload[nomeColonnaEmail] = email;
  payload[nomeColonnaImporto] = importo;
  payload[nomeColonnaStatoPagamento] = statoPagamento;
  payload[nomeColonnaPagamento] = pagamento;

  let risultato;
  if (campoId.value) {
    risultato = await getSupabase().from("appuntamenti").update(payload).eq("id", campoId.value);
  } else {
    risultato = await getSupabase().from("appuntamenti").insert(payload);
  }

  if (risultato.error && /column|schema|tutti|interlocutore|esecutore|tipoappuntamento|telefono|email|importo|statopagamento|pagamento/i.test(String(risultato.error.message || ""))) {
    const altraTutti = nomeColonnaTutti === "Tutti" ? "tutti" : "Tutti";
    const altraInterlocutore =
      nomeColonnaInterlocutore === "Interlocutore" ? "interlocutore" : "Interlocutore";
    const altraEsecutore = nomeColonnaEsecutore === "Esecutore" ? "esecutore" : "Esecutore";
    const altraTipo =
      nomeColonnaTipo === "TipoAppuntamento" ? "tipoappuntamento" : "TipoAppuntamento";
    const altraTelefono = nomeColonnaTelefono === "Telefono" ? "telefono" : "Telefono";
    const altraEmail = nomeColonnaEmail === "email" ? "Email" : "email";
    const altraImporto = nomeColonnaImporto === "Importo" ? "importo" : "Importo";
    const altraStatoPagamento =
      nomeColonnaStatoPagamento === "StatoPagamento" ? "statopagamento" : "StatoPagamento";
    const altraPagamento = nomeColonnaPagamento === "Pagamento" ? "pagamento" : "Pagamento";
    delete payload[nomeColonnaTutti];
    delete payload[nomeColonnaInterlocutore];
    delete payload[nomeColonnaEsecutore];
    delete payload[nomeColonnaTipo];
    delete payload[nomeColonnaTelefono];
    delete payload[nomeColonnaEmail];
    delete payload[nomeColonnaImporto];
    delete payload[nomeColonnaStatoPagamento];
    delete payload[nomeColonnaPagamento];
    payload[altraTutti] = campoTutti.checked;
    payload[altraInterlocutore] = interlocutore;
    payload[altraEsecutore] = esecutore;
    payload[altraTipo] = tipo;
    payload[altraTelefono] = telefono;
    payload[altraEmail] = email;
    payload[altraImporto] = importo;
    payload[altraStatoPagamento] = statoPagamento;
    payload[altraPagamento] = pagamento;
    if (campoId.value) {
      risultato = await getSupabase().from("appuntamenti").update(payload).eq("id", campoId.value);
    } else {
      risultato = await getSupabase().from("appuntamenti").insert(payload);
    }
    if (!risultato.error) {
      nomeColonnaTutti = altraTutti;
      nomeColonnaInterlocutore = altraInterlocutore;
      nomeColonnaEsecutore = altraEsecutore;
      nomeColonnaTipo = altraTipo;
      nomeColonnaTelefono = altraTelefono;
      nomeColonnaEmail = altraEmail;
      nomeColonnaImporto = altraImporto;
      nomeColonnaStatoPagamento = altraStatoPagamento;
      nomeColonnaPagamento = altraPagamento;
    }
  }

  if (risultato.error) {
    mostraErroreForm(messaggioErrore(risultato.error));
    return;
  }

  if (dialogoTutti.open) {
    dialogoTutti.close();
  }
  dialogo.close();
  await caricaAppuntamenti();
}

formAppuntamento.addEventListener("submit", function (evento) {
  evento.preventDefault();
  mostraErroreForm("");

  const titolo = campoTitolo.value.trim();
  const data = campoData.value;
  const tipo = campoTipo.value.trim();
  if (!tipo || !titolo || !data) {
    mostraErroreForm("Tipo, titolo e data sono obbligatori.");
    return;
  }

  const nuovo = !campoId.value;
  if (nuovo && !campoTutti.checked) {
    dialogoTutti.showModal();
    return;
  }

  salvaAppuntamento();
});

bottoneTuttiNo.addEventListener("click", function () {
  campoTutti.checked = false;
  salvaAppuntamento();
});

bottoneTuttiSi.addEventListener("click", function () {
  campoTutti.checked = true;
  salvaAppuntamento();
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
    vista = "giorno";
    dataRiferimento = daISO(oggiISO());
    await caricaAppuntamenti();
  } catch (error) {
    stato.textContent = messaggioErrore(error);
  }
}

avvia();
