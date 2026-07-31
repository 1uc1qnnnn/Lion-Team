// Ruleaza o singura data, local pe calculatorul tau, ca sa obtii GOOGLE_REFRESH_TOKEN.
//
// Pasi:
// 1. npm install
// 2. Seteaza GOOGLE_CLIENT_ID si GOOGLE_CLIENT_SECRET in terminal sau intr-un fisier .env local.
// 3. Ruleaza: node scripts/get-refresh-token.js
// 4. Deschide link-ul afisat, autorizeaza cu contul Google Chirilov Ian.
// 5. Google te redirectioneaza catre o adresa de forma
//      http://localhost:3000/?code=XXXXX
//    (pagina va da eroare "nu se poate accesa situl" - e normal, nu ai server pornit acolo).
//    Copiaza tot ce e dupa "code=" din bara de adrese si lipeste-l in terminal cand ti se cere.
// 6. Scriptul afiseaza GOOGLE_REFRESH_TOKEN - copiaza-l in .env / Vercel.

const readline = require('readline');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Lipsesc GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET din mediu.');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send'
  ]
});

console.log('\nDeschide acest link in browser si autorizeaza contul:\n');
console.log(authUrl);
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Lipeste aici codul din URL (dupa "code="): ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nGata. Adauga aceasta linie in .env / Vercel:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (err) {
    console.error('Nu am putut obtine token-ul:', err.message);
  }
});
