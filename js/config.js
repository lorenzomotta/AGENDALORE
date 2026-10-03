/**
 * Incolla qui i due valori del tuo progetto Supabase.
 *
 * Dove li trovi:
 * 1. Apri https://supabase.com/dashboard
 * 2. Entra nel progetto
 * 3. Clicca l'ingranaggio (Project Settings)
 * 4. Apri la voce "API"
 * 5. Copia "Project URL" e "anon public"
 *
 * La chiave "anon" può stare nel sito: è pensata per il browser.
 * NON copiare mai la chiave "service_role": quella è segreta.
 */
const SUPABASE_URL = "https://hbrjonwsluaujcmyhlov.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicmpvbndzbHVhdWpjbXlobG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjY5MTAsImV4cCI6MjEwMzI0MjkxMH0.qI0XuspUdTrGgy_820_kqr4_qfkBgcml5lL9VnM-0WM";

/**
 * ID client di Google, per scrivere sul calendario.
 * Se lo lasci vuoto, salvare un appuntamento NON tocca Google Calendar.
 * Il pulsante "Metti su Google" apre solo la pagina già compilata.
 *
 * È gratis, per uso personale. Passi:
 * 1. Apri https://console.cloud.google.com/ e crea un progetto (es. AgendaLore).
 * 2. "API e servizi" → "Libreria" → cerca "Google Calendar API" → Abilita.
 * 3. "API e servizi" → "Schermata di consenso OAuth":
 *    - Utenti: Esterno
 *    - Nome app: AgendaLore
 *    - La tua email
 *    - Aggiungi l'ambito: https://www.googleapis.com/auth/calendar.events
 *    - In "Utenti di test" metti l'account Google del calendario
 *    - Lascia l'app in modalità Test (non serve la verifica di Google)
 * 4. "API e servizi" → "Credenziali" → "Crea credenziali" → "ID client OAuth"
 *    → Applicazione web.
 *    Origini JavaScript autorizzate (una per riga):
 *      https://lorenzomotta.github.io
 *      http://127.0.0.1:5500
 *      http://localhost:5500
 * 5. Copia l'ID client (finisce con .apps.googleusercontent.com) qui sotto.
 * 6. In Supabase, SQL Editor, esegui il file sql/appuntamenti-google.sql
 */
const GOOGLE_CLIENT_ID = "861659370882-jvg2bq416crqm67bu48k53dtpphj25f6.apps.googleusercontent.com";
