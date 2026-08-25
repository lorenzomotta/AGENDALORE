const emailUtente = document.getElementById("email-utente");
const bottoneEsci = document.getElementById("bottone-esci");
const filtroData = document.getElementById("filtro-data");
const bottoneOggi = document.getElementById("bottone-oggi");
const bottoneTutti = document.getElementById("bottone-tutti");
const stato = document.getElementById("stato");
const lista = document.getElementById("lista-appuntamenti");
const bottoneNuovo = document.getElementById("bottone-nuovo");
const dialogo = document.getElementById("dialogo");
const formAppuntamento = document.getElementById("form-appuntamento");
const titoloDialogo = document.getElementById("titolo-dialogo");
const campoId = document.getElementById("id-appuntamento");
const campoTitolo = document.getElementById("titolo");
const campoData = document.getElementById("data");
const campoOra = document.getElementById("ora");
const campoNote = document.getElementById("note");
const erroreForm = document.getElementById("errore-form");
const bottoneAnnulla = document.getElementById("bottone-annulla");

let utenteId = null;
let mostraTutti = false;

function oggiISO() {
  const adesso = new Date();
  const mese = String(adesso.getMonth() + 1).padStart(2, "0");
  const giorno = String(adesso.getDate()).padStart(2, "0");
  return adesso.getFullYear() + "-" + mese + "-" + giorno;
}

function formattaData(valore) {
  if (!valore) {
    return "";
  }
  const parti = String(valore).split("-");
  if (parti.length !== 3) {
    return valore;
  }
  return parti[2] + "/" + parti[1] + "/" + parti[0];
}

function formattaOra(valore) {
  if (!valore) {
    return "";
  }
  return String(valore).slice(0, 5);
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

async function caricaAppuntamenti() {
  stato.textContent = "Caricamento...";
  lista.innerHTML = "";

  let query = getSupabase()
    .from("appuntamenti")
    .select("id, titolo, note, data, ora")
    .eq("user_id", utenteId)
    .order("data", { ascending: true })
    .order("ora", { ascending: true, nullsFirst: true });

  if (!mostraTutti && filtroData.value) {
    query = query.eq("data", filtroData.value);
  }

  const { data, error } = await query;
  if (error) {
    stato.textContent = messaggioErrore(error);
    return;
  }

  if (!data || data.length === 0) {
    stato.textContent = "";
    lista.innerHTML = '<li class="vuoto">Nessun appuntamento. Tocca + per aggiungerne uno.</li>';
    return;
  }

  stato.textContent = mostraTutti
    ? "Tutti i tuoi appuntamenti"
    : "Appuntamenti del " + formattaData(filtroData.value);

  lista.innerHTML = data
    .map(function (elemento) {
      const notaHtml = elemento.note ? '<p class="note"></p>' : "";

      return (
        '<li class="card-appuntamento" data-id="' +
        elemento.id +
        '">' +
        "<h2></h2>" +
        '<p class="meta"></p>' +
        notaHtml +
        '<div class="azioni">' +
        '<button class="bottone-secondario" type="button" data-azione="modifica">Modifica</button>' +
        '<button class="bottone-pericolo" type="button" data-azione="cancella">Cancella</button>' +
        "</div>" +
        "</li>"
      );
    })
    .join("");

  const card = lista.querySelectorAll(".card-appuntamento");
  data.forEach(function (elemento, indice) {
    const voce = card[indice];
    voce.querySelector("h2").textContent = elemento.titolo;
    voce.querySelector(".meta").textContent = formattaOra(elemento.ora)
      ? formattaData(elemento.data) + " · " + formattaOra(elemento.ora)
      : formattaData(elemento.data);
    const noteEl = voce.querySelector(".note");
    if (noteEl) {
      noteEl.textContent = elemento.note;
    }
  });
}

function apriDialogo(appuntamento) {
  mostraErroreForm("");
  if (appuntamento) {
    titoloDialogo.textContent = "Modifica appuntamento";
    campoId.value = appuntamento.id;
    campoTitolo.value = appuntamento.titolo;
    campoData.value = appuntamento.data;
    campoOra.value = formattaOra(appuntamento.ora);
    campoNote.value = appuntamento.note || "";
  } else {
    titoloDialogo.textContent = "Nuovo appuntamento";
    campoId.value = "";
    campoTitolo.value = "";
    campoData.value = filtroData.value || oggiISO();
    campoOra.value = "";
    campoNote.value = "";
  }
  dialogo.showModal();
}

bottoneNuovo.addEventListener("click", function () {
  apriDialogo(null);
});

bottoneAnnulla.addEventListener("click", function () {
  dialogo.close();
});

bottoneOggi.addEventListener("click", function () {
  mostraTutti = false;
  filtroData.value = oggiISO();
  caricaAppuntamenti();
});

bottoneTutti.addEventListener("click", function () {
  mostraTutti = true;
  caricaAppuntamenti();
});

filtroData.addEventListener("change", function () {
  mostraTutti = false;
  caricaAppuntamenti();
});

lista.addEventListener("click", async function (evento) {
  const bottone = evento.target.closest("button");
  if (!bottone) {
    return;
  }

  const card = bottone.closest(".card-appuntamento");
  const id = card.getAttribute("data-id");
  const azione = bottone.getAttribute("data-azione");

  const { data, error } = await getSupabase()
    .from("appuntamenti")
    .select("id, titolo, note, data, ora")
    .eq("id", id)
    .single();

  if (error) {
    stato.textContent = messaggioErrore(error);
    return;
  }

  if (azione === "modifica") {
    apriDialogo(data);
    return;
  }

  if (azione === "cancella") {
    const ok = window.confirm("Vuoi cancellare questo appuntamento?");
    if (!ok) {
      return;
    }
    const cancellazione = await getSupabase().from("appuntamenti").delete().eq("id", id);
    if (cancellazione.error) {
      stato.textContent = messaggioErrore(cancellazione.error);
      return;
    }
    await caricaAppuntamenti();
  }
});

formAppuntamento.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  mostraErroreForm("");

  const titolo = campoTitolo.value.trim();
  const data = campoData.value;
  const ora = campoOra.value || null;
  const note = campoNote.value.trim();

  if (!titolo || !data) {
    mostraErroreForm("Titolo e data sono obbligatori.");
    return;
  }

  const payload = {
    titolo: titolo,
    data: data,
    ora: ora,
    note: note,
    user_id: utenteId,
  };

  let risultato;
  if (campoId.value) {
    risultato = await getSupabase()
      .from("appuntamenti")
      .update(payload)
      .eq("id", campoId.value);
  } else {
    risultato = await getSupabase().from("appuntamenti").insert(payload);
  }

  if (risultato.error) {
    mostraErroreForm(messaggioErrore(risultato.error));
    return;
  }

  dialogo.close();
  await caricaAppuntamenti();
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
    filtroData.value = oggiISO();
    await caricaAppuntamenti();
  } catch (error) {
    stato.textContent = messaggioErrore(error);
  }
}

avvia();
