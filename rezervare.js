const { google } = require('googleapis');

// Creates an authenticated OAuth2 client using the credentials stored
// as environment variables (set in the Vercel project settings).
function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function buildConfirmationEmail({ to, nume, data, ora }) {
  const subject = `Confirmare programare - ${data} la ${ora}`;
  const body =
    `Salut ${nume},\n\n` +
    `Programarea ta la Lion Team Ialoveni a fost inregistrata:\n\n` +
    `Data: ${data}\n` +
    `Ora: ${ora}\n` +
    `Locatie: or. Ialoveni, str. Alexandru cel Bun 29\n\n` +
    `Antrenorul te va suna pentru confirmare inainte de sedinta.\n\n` +
    `Pe curand,\nLion Team Ialoveni`;

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ].join('\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metoda nu este permisa.' });
    return;
  }

  try {
    const { nume, telefon, email, data, ora, mesaj } = req.body || {};

    if (!nume || !telefon || !data || !ora) {
      res.status(400).json({ error: 'Completeaza numele, telefonul, data si ora.' });
      return;
    }

    const auth = getOAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const gmail = google.gmail({ version: 'v1', auth });

    // Combine the chosen date and time into a start/end range (60 min session).
    const [hour, minute] = ora.split(':').map(Number);
    const startDate = new Date(`${data}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const timeZone = 'Europe/Chisinau';

    const event = await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID || 'primary',
      requestBody: {
        summary: `Antrenament K1 - ${nume}`,
        description:
          `Telefon: ${telefon}\n` +
          `Email: ${email || '-'}\n` +
          `Mesaj: ${mesaj || '-'}`,
        start: { dateTime: startDate.toISOString(), timeZone },
        end: { dateTime: endDate.toISOString(), timeZone }
      }
    });

    // Notify the coach.
    const notifyTo = process.env.NOTIFY_EMAIL;
    if (notifyTo) {
      const raw = buildConfirmationEmail({
        to: notifyTo,
        nume: `Programare noua: ${nume} (${telefon})`,
        data,
        ora
      });
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    }

    // Confirm to the client, if they gave an email.
    if (email) {
      const raw = buildConfirmationEmail({ to: email, nume, data, ora });
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    }

    res.status(200).json({ ok: true, eventId: event.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nu am putut inregistra programarea. Incearca din nou sau suna direct.' });
  }
};
