/**
 * Collegamento con Google Calendar.
 * AgendaLore crea, aggiorna e cancella gli eventi.
 * Le modifiche fatte solo su Google non tornano nell'agenda.
 *
 * L'ID client sta in js/config.js. Se è vuoto, questa parte resta spenta
 * e il pulsante apre soltanto la pagina di Google.
 */

const CHIAVE_EVENTI_GOOGLE = "agendalore-google-eventi";
const CHIAVE_PERMESSO_GOOGLE = "agendalore-google-ok";
const FUSO_GOOGLE = "Europe/Rome";

let tokenGoogle = "";
let tokenGoogleFinoA = 0;
let clientGoogle = null;
let risolviTokenGoogle = null;
let rifiutaTokenGoogle = null;

function googleCalendarConfigurato() {
  return (
    typeof GOOGLE_CLIENT_ID === "string" &&
    GOOGLE_CLIENT_ID.trim() !== "" &&
    GOOGLE_CLIENT_ID.indexOf("INCOLLA_QUI") === -1
  );
}

function leggiMappaGoogle() {
  try {
    const valore = JSON.parse(localStorage.getItem(CHIAVE_EVENTI_GOOGLE) || "{}");
    return valore && typeof valore === "object" ? valore : {};
  } catch (errore) {
    return {};
  }
}

function idEventoGoogle(elemento) {
  if (!elemento) {
    return "";
  }
  const dalDatabase = String(elemento.google_event_id || "").trim();
  if (dalDatabase) {
    return dalDatabase;
  }
  const mappa = leggiMappaGoogle();
  return String(mappa[String(elemento.id)] || "");
}

function giornoDopoIsoGoogle(iso) {
  const parti = String(iso || "").split("-");
  const data = new Date(Number(parti[0]), Number(parti[1]) - 1, Number(parti[2]));
  data.setDate(data.getDate() + 1);
  const mese = String(data.getMonth() + 1).padStart(2, "0");
  const giorno = String(data.getDate()).padStart(2, "0");
  return data.getFullYear() + "-" + mese + "-" + giorno;
}

function fineUnOraGoogle(iso, ora) {
  const pezzi = String(ora).split(":");
  let totale = Number(pezzi[0] || 0) * 60 + Number(pezzi[1] || 0) + 60;
  let data = iso;
  if (totale >= 24 * 60) {
    totale -= 24 * 60;
    data = giornoDopoIsoGoogle(iso);
  }
  const ore = String(Math.floor(totale / 60)).padStart(2, "0");
  const minuti = String(totale % 60).padStart(2, "0");
  return data + "T" + ore + ":" + minuti + ":00";
}

function corpoEventoGoogle(elemento) {
  const iso = normalizzaData(elemento.data);
  const ora = formattaOra(elemento.ora);
  const descrizione = typeof dettagliGoogle === "function" ? dettagliGoogle(elemento) : elemento.note || "";
  const corpo = {
    summary: elemento.titolo || "Appuntamento",
    description: descrizione,
  };
  if (ora) {
    corpo.start = { dateTime: iso + "T" + ora + ":00", timeZone: FUSO_GOOGLE };
    corpo.end = { dateTime: fineUnOraGoogle(iso, ora), timeZone: FUSO_GOOGLE };
  } else {
    corpo.start = { date: iso };
    corpo.end = { date: giornoDopoIsoGoogle(iso) };
  }
  return corpo;
}

function messaggioErroreGoogle(error) {
  const testo = String((error && (error.message || error.type)) || error || "");
  if (testo.indexOf("popup_closed") !== -1 || testo.indexOf("access_denied") !== -1) {
    return "Hai chiuso la finestra di Google, quindi il calendario non è stato aggiornato.";
  }
  if (testo.indexOf("popup_failed_to_open") !== -1) {
    return "Il telefono ha bloccato la finestra di Google. Consenti i popup e riprova.";
  }
  if (testo.indexOf("accessNotConfigured") !== -1 || testo.indexOf("has not been used") !== -1) {
    return "Nel progetto Google manca Calendar API. Attivala e riprova.";
  }
  if (testo.indexOf("idpiframe") !== -1 || testo.indexOf("origin") !== -1) {
    return "Questo indirizzo del sito non è autorizzato nel progetto Google.";
  }
  if (testo.indexOf("non si è caricato") !== -1) {
    return "Google non si è caricato. Controlla la connessione e ricarica la pagina.";
  }
  if (!googleCalendarConfigurato()) {
    return "Manca l'ID client di Google in js/config.js.";
  }
  return "Google Calendar non ha risposto. Riprova tra un momento.";
}

function clientTokenGoogle() {
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    throw new Error("Google non si è caricato. Controlla la connessione e ricarica la pagina.");
  }
  if (!clientGoogle) {
    clientGoogle = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID.trim(),
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: function (risposta) {
        if (risposta && risposta.access_token) {
          tokenGoogle = risposta.access_token;
          const secondi = Number(risposta.expires_in || 3600);
          tokenGoogleFinoA = Date.now() + secondi * 1000;
          localStorage.setItem(CHIAVE_PERMESSO_GOOGLE, "1");
          if (risolviTokenGoogle) {
            risolviTokenGoogle(tokenGoogle);
          }
        } else if (rifiutaTokenGoogle) {
          rifiutaTokenGoogle(
            new Error((risposta && (risposta.error_description || risposta.error)) || "access_denied")
          );
        }
        risolviTokenGoogle = null;
        rifiutaTokenGoogle = null;
      },
      error_callback: function (errore) {
        if (rifiutaTokenGoogle) {
          rifiutaTokenGoogle(new Error((errore && errore.type) || "popup_closed"));
        }
        risolviTokenGoogle = null;
        rifiutaTokenGoogle = null;
      },
    });
  }
  return clientGoogle;
}

function chiediTokenGoogle() {
  if (tokenGoogle && Date.now() < tokenGoogleFinoA - 60000) {
    return Promise.resolve(tokenGoogle);
  }
  return new Promise(function (resolve, reject) {
    try {
      risolviTokenGoogle = resolve;
      rifiutaTokenGoogle = reject;
      const giaDato = localStorage.getItem(CHIAVE_PERMESSO_GOOGLE) === "1";
      clientTokenGoogle().requestAccessToken({ prompt: giaDato ? "" : "consent" });
    } catch (error) {
      risolviTokenGoogle = null;
      rifiutaTokenGoogle = null;
      reject(error);
    }
  });
}

async function chiamataGoogle(metodo, percorso, token, corpo) {
  const risposta = await fetch("https://www.googleapis.com/calendar/v3" + percorso, {
    method: metodo,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (risposta.status === 404 || risposta.status === 410) {
    return null;
  }
  if (!risposta.ok) {
    const testo = await risposta.text();
    throw new Error(testo || "Errore Google");
  }
  if (risposta.status === 204) {
    return {};
  }
  return risposta.json();
}

async function sincronizzaAppuntamentoSuGoogle(elemento, token) {
  const corpo = corpoEventoGoogle(elemento);
  const esistente = idEventoGoogle(elemento);
  if (esistente) {
    const aggiornato = await chiamataGoogle(
      "PATCH",
      "/calendars/primary/events/" + encodeURIComponent(esistente),
      token,
      corpo
    );
    if (aggiornato && aggiornato.id) {
      return aggiornato.id;
    }
  }
  const creato = await chiamataGoogle("POST", "/calendars/primary/events", token, corpo);
  if (!creato || !creato.id) {
    throw new Error("Google non ha restituito l'evento.");
  }
  return creato.id;
}

async function eliminaEventoGoogle(eventId, token) {
  const risultato = await chiamataGoogle(
    "DELETE",
    "/calendars/primary/events/" + encodeURIComponent(eventId),
    token
  );
  if (risultato === null) {
    return;
  }
}

async function memorizzaIdEventoGoogle(idAppuntamento, eventId) {
  const mappa = leggiMappaGoogle();
  mappa[String(idAppuntamento)] = eventId;
  localStorage.setItem(CHIAVE_EVENTI_GOOGLE, JSON.stringify(mappa));
  try {
    await getSupabase().from("appuntamenti").update({ google_event_id: eventId }).eq("id", idAppuntamento);
  } catch (errore) {
    // Il numero resta nel telefono anche se la colonna su Supabase non c'è ancora.
  }
}

function dimenticaIdEventoGoogle(idAppuntamento) {
  const mappa = leggiMappaGoogle();
  delete mappa[String(idAppuntamento)];
  localStorage.setItem(CHIAVE_EVENTI_GOOGLE, JSON.stringify(mappa));
}

async function scollegaIdEventoGoogle(idAppuntamento) {
  dimenticaIdEventoGoogle(idAppuntamento);
  try {
    await getSupabase().from("appuntamenti").update({ google_event_id: null }).eq("id", idAppuntamento);
  } catch (errore) {
    // Se la colonna non c'è ancora, basta averlo tolto da questo telefono.
  }
}
