# AgendaLore

Web app per il telefono: login, poi agenda salvata su Supabase.
Il sito gira su GitHub Pages (gratis), quindi sono solo file HTML, CSS e JavaScript.

## Come è fatta

| File | A cosa serve |
| --- | --- |
| `index.html` + `css/index.css` + `js/index.js` | Pagina di login / registrazione |
| `agenda.html` + `css/agenda.css` + `js/agenda.js` | Lista appuntamenti dopo il login |
| `js/config.js` | Indirizzo e chiave pubblica di Supabase |
| `js/supabase-client.js` | Collegamento condiviso al database |
| `sql/setup.sql` | Crea la tabella `appuntamenti` e le regole di sicurezza |

## 1. Completa Supabase

1. Apri il [dashboard di Supabase](https://supabase.com/dashboard).
2. Vai su **SQL Editor**, incolla il contenuto di `sql/setup.sql` e premi **Run**.
3. Vai su **Project Settings → API** e copia:
   - Project URL
   - anon public
4. Incolla quei due valori in `js/config.js`.
5. Vai su **Authentication → URL Configuration** e metti:
   - **Site URL:** `https://lorenzomotta.github.io/AGENDALORE/`
   - **Redirect URLs** (uno per riga):
     - `https://lorenzomotta.github.io/AGENDALORE/`
     - `https://lorenzomotta.github.io/AGENDALORE/index.html`
     - `http://127.0.0.1:5500/`
     - `http://127.0.0.1:5500/index.html`

   Se Site URL resta `http://localhost:3000`, le email di recupero portano a un indirizzo del computer e il link non si apre.
6. Per le prove, in **Authentication → Providers → Email** puoi spegnere **Confirm email**. Così entri subito dopo la registrazione.

Il login usa **Supabase Auth**, non la tabella `utenti`.
Le password stanno in una tabella interna di Supabase (`auth.users`).
La tabella `utenti` che hai già creato può servire più avanti per nome, telefono, ecc.

## 2. Pubblica su GitHub Pages

1. Carica questi file nel repository [lorenzomotta/AGENDALORE](https://github.com/lorenzomotta/AGENDALORE).
2. Su GitHub: **Settings → Pages**.
3. **Source**: Deploy from a branch.
4. Branch: `main`, cartella: `/ (root)`.
5. Dopo uno o due minuti il sito è qui:
   [https://lorenzomotta.github.io/AGENDALORE/](https://lorenzomotta.github.io/AGENDALORE/)

## 3. Prova in locale

Apri un terminale in questa cartella e lancia:

```bash
python -m http.server 5500
```

Poi nel browser vai su `http://localhost:5500`.
Non aprire i file HTML con doppio clic: Supabase vuole un indirizzo http.
