# Lion Team Ialoveni — ghid de lansare

Structura proiectului:

```
public/index.html       -> siteul (pagina de rezervare)
api/rezervare.js         -> funcția care creează evenimentul în Google Calendar și trimite emailurile
scripts/get-refresh-token.js -> script care se rulează o singură dată, local
.env.example             -> lista variabilelor secrete necesare
```

## Pasul 1 — Cont Google Cloud (10 minute, o singură dată)

1. Mergi pe **console.cloud.google.com** și autentifică-te cu contul Google pe care vrei să apară programările (poate fi contul personal al lui Ian).
2. Sus, din meniul de proiecte, apasă **New Project**. Dă-i un nume, ex. `lion-team`, apasă Create.
3. Cu proiectul nou selectat, mergi la **APIs & Services -> Library**.
   - Caută **Google Calendar API**, apasă Enable.
   - Caută **Gmail API**, apasă Enable.
4. Mergi la **APIs & Services -> OAuth consent screen**.
   - Tip utilizator: **External**.
   - Completează nume aplicație (`Lion Team`), email suport, email dezvoltator — orice adresă a ta.
   - La pasul "Scopes" nu trebuie să adaugi nimic manual, poți continua.
   - La pasul "Test users" adaugă adresa de Gmail pe care o vei folosi (a lui Ian). Cât timp aplicația e în modul "Testing", doar aceste adrese pot autoriza — e suficient, pentru că doar Ian se autorizează, o singură dată.
5. Mergi la **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.
   - Application type: **Web application**.
   - La "Authorized redirect URIs" adaugă: `http://localhost:3000/`
   - Apasă Create. Îți apar **Client ID** și **Client Secret** — copiază-le, le pui în `.env`.

## Pasul 2 — Generezi tokenul de refresh (o singură dată)

Pe calculatorul tău, în folderul proiectului:

```bash
npm install
export GOOGLE_CLIENT_ID="valoarea-de-la-pasul-1"
export GOOGLE_CLIENT_SECRET="valoarea-de-la-pasul-1"
node scripts/get-refresh-token.js
```

Scriptul afișează un link. Îl deschizi, te autentifici cu contul Google al lui Ian, accepți permisiunile de Calendar și Gmail. Browserul te trimite către o adresă `localhost` care va da eroare de conexiune — e normal, doar copiază tot ce apare după `code=` din bara de adrese și lipește-l în terminal.

Scriptul îți afișează `GOOGLE_REFRESH_TOKEN=...` — salvează-l.

## Pasul 3 — Publicarea pe Vercel + domeniul tău

1. Creează cont gratuit pe **vercel.com** (poți intra direct cu GitHub).
2. Cel mai simplu: creează un repository nou pe GitHub, urcă tot folderul acestui proiect acolo.
3. În Vercel: **Add New -> Project**, alege repository-ul.
4. Înainte de a apăsa Deploy, deschide **Environment Variables** și adaugă:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `CALENDAR_ID` = `primary`
   - `NOTIFY_EMAIL` = adresa unde vrei să vină notificarea de rezervare nouă
5. Apasă **Deploy**. În câteva zeci de secunde primești un link `.vercel.app` funcțional.
6. Mergi la **Project Settings -> Domains**, scrie domeniul tău cumpărat, apasă Add.
   - Vercel îți arată 1-2 înregistrări DNS (de obicei un record `A` și/sau `CNAME`).
   - Le adaugi în panoul unde ai cumpărat domeniul (Namecheap, GoDaddy etc. — la secțiunea DNS/Nameservers).
   - Propagarea durează de la câteva minute până la câteva ore.

## Testare

După deploy, deschide siteul, completează formularul de rezervare. Dacă totul e configurat corect:
- apare un eveniment nou în Google Calendar-ul lui Ian, la data și ora alese;
- vine un email de notificare la `NOTIFY_EMAIL`;
- dacă clientul a lăsat email, primește și el o confirmare.

Dacă ceva nu merge, cel mai probabil una din variabilele de mediu din Vercel e greșită sau lipsește — verifică Pasul 1-2.
