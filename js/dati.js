/**
 * Elenco delle tabelle. Quando ne aggiungi una, metti qui una riga:
 * { nome: "NomeTabella", pagina: "nomefile.html" }
 * I pulsanti vengono messi in ordine alfabetico da soli.
 */
const TABELLE = [
  { nome: "CartellaClinica", pagina: "cartella-clinica.html" },
  { nome: "Compleanni", pagina: "compleanni.html" },
  { nome: "Entrate", pagina: "entrate.html" },
  { nome: "Evaquazioni", pagina: "evaquazioni.html" },
  { nome: "LinkUtili", pagina: "link-utili.html" },
  { nome: "MemorieVarie", pagina: "memorie-varie.html" },
  { nome: "NotaVolante", pagina: "nota-volante.html" },
  { nome: "Ospedali", pagina: "ospedali.html" },
  { nome: "Parametri", pagina: "parametri.html" },
  { nome: "Password", pagina: "password.html" },
  { nome: "Rifornimenti", pagina: "rifornimenti.html" },
  { nome: "Sogni", pagina: "sogni.html" },
  { nome: "Spesa", pagina: "spesa.html" },
  { nome: "Uscite", pagina: "uscite.html" },
];

const emailUtente = document.getElementById("email-utente");
const elencoTabelle = document.getElementById("elenco-tabelle");
const bottoneEsci = document.getElementById("bottone-esci");

function confrontaTesto(a, b) {
  return String(a).localeCompare(String(b), "it", {
    numeric: true,
    sensitivity: "base",
  });
}

function disegnaPulsanti() {
  elencoTabelle.innerHTML = "";
  const ordinate = TABELLE.slice().sort(function (a, b) {
    return confrontaTesto(a.nome, b.nome);
  });

  ordinate.forEach(function (tabella) {
    const link = document.createElement("a");
    link.className = "pulsante-tabella";
    link.href = tabella.pagina;
    link.textContent = tabella.nome;
    elencoTabelle.appendChild(link);
  });
}

async function assicuratiLogin() {
  const sessione = await getSessione();
  if (!sessione || !sessione.user) {
    window.location.replace("index.html");
    return null;
  }
  return sessione.user;
}

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
    disegnaPulsanti();
  } catch (error) {
    emailUtente.textContent = messaggioErrore(error);
  }
}

avvia();
