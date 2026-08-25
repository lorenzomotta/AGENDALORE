/**
 * Crea il "telecomando" per parlare con Supabase.
 * Le altre pagine (login e agenda) usano queste funzioni.
 */
function configMancante() {
  return (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("INCOLLA_QUI") ||
    SUPABASE_ANON_KEY.includes("INCOLLA_QUI")
  );
}

function getSupabase() {
  if (configMancante()) {
    throw new Error(
      "Manca la configurazione. Apri js/config.js e incolla URL e chiave anon di Supabase."
    );
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("La libreria Supabase non si è caricata. Controlla la connessione internet.");
  }

  if (!window._agendaloreClient) {
    window._agendaloreClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storageKey: "agendalore-auth",
          detectSessionInUrl: true,
          flowType: "implicit",
        },
      }
    );
  }

  return window._agendaloreClient;
}

async function getSessione() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

function messaggioErrore(error) {
  if (!error) {
    return "Qualcosa è andato storto.";
  }

  const testo = String(error.message || error);

  if (testo.includes("Invalid login credentials")) {
    return "Accesso rifiutato. Controlla email e password, e in Supabase (Authentication → Users) che l'utente sia Confermato.";
  }
  if (testo.includes("User already registered")) {
    return "Questa email è già registrata. Prova ad accedere.";
  }
  if (testo.includes("Email not confirmed")) {
    return "Devi prima confermare la email. Controlla la casella di posta.";
  }
  if (testo.includes("Password should be at least")) {
    return "La password deve avere almeno 6 caratteri.";
  }
  if (testo.includes("Unable to validate email")) {
    return "Inserisci una email valida.";
  }
  if (testo.includes("otp_expired") || testo.includes("Email link is invalid or has expired")) {
    return "Il link della email è scaduto o già usato. Richiedine uno nuovo.";
  }

  return testo;
}
