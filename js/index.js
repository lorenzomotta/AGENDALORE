const form = document.getElementById("form-auth");
const formNuovaPassword = document.getElementById("form-nuova-password");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nuovaPasswordInput = document.getElementById("nuova-password");
const ripetiPasswordInput = document.getElementById("ripeti-password");
const bottoneInvia = document.getElementById("bottone-invia");
const bottoneCambio = document.getElementById("bottone-cambio");
const bottoneRecupero = document.getElementById("bottone-recupero");
const bottoneSalvaPassword = document.getElementById("bottone-salva-password");
const sottotitolo = document.getElementById("sottotitolo");
const testoCambio = document.getElementById("testo-cambio");
const messaggio = document.getElementById("messaggio");
const messaggioRecupero = document.getElementById("messaggio-recupero");
const bloccoCambio = document.getElementById("blocco-cambio");
const bloccoRecupero = document.getElementById("blocco-recupero");
const vediPassword = document.getElementById("vedi-password");
const vediPasswordRecupero = document.getElementById("vedi-password-recupero");

let modalitaRegistrazione = false;
let inRecuperoPassword = false;

function mostraMessaggio(testo, tipo) {
  messaggio.hidden = false;
  messaggio.className = "messaggio " + tipo;
  messaggio.textContent = testo;
}

function nascondiMessaggio() {
  messaggio.hidden = true;
  messaggio.textContent = "";
}

function mostraMessaggioRecupero(testo, tipo) {
  messaggioRecupero.hidden = false;
  messaggioRecupero.className = "messaggio " + tipo;
  messaggioRecupero.textContent = testo;
}

function parametriHash() {
  return new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
}

function urlRedirectAuth() {
  return window.location.origin + window.location.pathname;
}

function mostraSottotitolo(testo) {
  if (!sottotitolo) {
    return;
  }
  if (testo) {
    sottotitolo.hidden = false;
    sottotitolo.textContent = testo;
  } else {
    sottotitolo.hidden = true;
    sottotitolo.textContent = "";
  }
}

function impostaTipoPassword(visibile, campi) {
  const tipo = visibile ? "text" : "password";
  campi.forEach(function (campo) {
    if (campo) {
      campo.type = tipo;
    }
  });
}

function mostraModuloRecupero() {
  inRecuperoPassword = true;
  form.hidden = true;
  bloccoCambio.hidden = true;
  bloccoRecupero.hidden = true;
  formNuovaPassword.hidden = false;
  mostraSottotitolo("Scegli una nuova password");
}

function aggiornaModo() {
  if (modalitaRegistrazione) {
    mostraSottotitolo("Crea un account per salvare la tua agenda");
    bottoneInvia.textContent = "Registrati";
    testoCambio.textContent = "Hai già un account?";
    bottoneCambio.textContent = "Accedi";
    passwordInput.autocomplete = "new-password";
    bloccoRecupero.hidden = true;
  } else {
    mostraSottotitolo("");
    bottoneInvia.textContent = "Accedi";
    testoCambio.textContent = "Non hai un account?";
    bottoneCambio.textContent = "Registrati";
    passwordInput.autocomplete = "current-password";
    bloccoRecupero.hidden = false;
  }
}

if (vediPassword) {
  vediPassword.addEventListener("change", function () {
    impostaTipoPassword(vediPassword.checked, [passwordInput]);
  });
}

if (vediPasswordRecupero) {
  vediPasswordRecupero.addEventListener("change", function () {
    impostaTipoPassword(vediPasswordRecupero.checked, [nuovaPasswordInput, ripetiPasswordInput]);
  });
}

bottoneCambio.addEventListener("click", function () {
  modalitaRegistrazione = !modalitaRegistrazione;
  nascondiMessaggio();
  aggiornaModo();
  if (configMancante()) {
    mostraMessaggio(
      "Apri js/config.js e incolla Project URL e chiave anon di Supabase.",
      "errore"
    );
  }
});

bottoneRecupero.addEventListener("click", async function () {
  nascondiMessaggio();
  const email = emailInput.value.trim();

  if (!email || !email.includes("@")) {
    mostraMessaggio("Scrivi prima la tua email, poi tocca Password dimenticata.", "errore");
    return;
  }

  bottoneRecupero.disabled = true;

  try {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: urlRedirectAuth(),
    });
    if (error) {
      throw error;
    }
    mostraMessaggio(
      "Se l'email è registrata, arriva un messaggio. Apri il link (è valido pochi minuti).",
      "ok"
    );
  } catch (error) {
    mostraMessaggio(messaggioErrore(error), "errore");
  } finally {
    bottoneRecupero.disabled = false;
  }
});

formNuovaPassword.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const password = nuovaPasswordInput.value;
  const ripetuta = ripetiPasswordInput.value;

  if (password.length < 6) {
    mostraMessaggioRecupero("La password deve avere almeno 6 caratteri.", "errore");
    return;
  }

  if (password !== ripetuta) {
    mostraMessaggioRecupero("Le due password non coincidono.", "errore");
    return;
  }

  bottoneSalvaPassword.disabled = true;

  try {
    const { error } = await getSupabase().auth.updateUser({ password: password });
    if (error) {
      throw error;
    }
    mostraMessaggioRecupero("Password aggiornata. Ti porto in agenda...", "ok");
    window.setTimeout(function () {
      window.location.replace("agenda.html");
    }, 800);
  } catch (error) {
    mostraMessaggioRecupero(messaggioErrore(error), "errore");
  } finally {
    bottoneSalvaPassword.disabled = false;
  }
});

form.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  nascondiMessaggio();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !email.includes("@")) {
    mostraMessaggio("Inserisci una email valida.", "errore");
    return;
  }

  if (password.length < 6) {
    mostraMessaggio("La password deve avere almeno 6 caratteri.", "errore");
    return;
  }

  bottoneInvia.disabled = true;

  try {
    const client = getSupabase();

    if (modalitaRegistrazione) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        throw error;
      }

      if (data.session) {
        window.location.href = "agenda.html";
        return;
      }

      mostraMessaggio(
        "Account creato. Se arriva una email di conferma, aprila e poi accedi.",
        "ok"
      );
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      window.location.href = "agenda.html";
    }
  } catch (error) {
    mostraMessaggio(messaggioErrore(error), "errore");
  } finally {
    bottoneInvia.disabled = false;
  }
});

async function avviaLogin() {
  if (configMancante()) {
    mostraMessaggio(
      "Apri js/config.js e incolla Project URL e chiave anon di Supabase.",
      "errore"
    );
    bottoneInvia.disabled = true;
    return;
  }

  const hash = parametriHash();
  const erroreHash = hash.get("error_code") || hash.get("error");

  if (erroreHash) {
    const descrizione = hash.get("error_description") || erroreHash;
    mostraMessaggio(messaggioErrore(descrizione.replace(/\+/g, " ")), "errore");
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const client = getSupabase();
  client.auth.onAuthStateChange(function (evento) {
    if (evento === "PASSWORD_RECOVERY") {
      mostraModuloRecupero();
    }
  });

  if (hash.get("type") === "recovery") {
    mostraModuloRecupero();
    return;
  }

  try {
    const sessione = await getSessione();
    if (sessione && !inRecuperoPassword) {
      window.location.replace("agenda.html");
    }
  } catch (error) {
    mostraMessaggio(messaggioErrore(error), "errore");
  }
}

avviaLogin();
