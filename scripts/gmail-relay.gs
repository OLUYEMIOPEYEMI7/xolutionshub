/**
 * XOLUTIONS HUB mail relay — Google Apps Script web app.
 *
 * Render's free plan blocks outgoing SMTP, so the website POSTs each email here over
 * HTTPS and this script sends it from the Google account that owns it
 * (xolutionshub@gmail.com). Consumer Gmail allows about 100 recipients per day.
 *
 * Setup (script.google.com, signed in as xolutionshub@gmail.com):
 *   1. New project, paste this file, replace SECRET with the value of MAIL_RELAY_SECRET.
 *   2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   3. Authorise when asked, then copy the Web app URL into MAIL_RELAY_URL on Render.
 * Keep SECRET private: anyone who has it can send email from this account.
 */
var SECRET = 'REPLACE_WITH_MAIL_RELAY_SECRET';
var MAX_RECIPIENTS = 5;
var EMAIL_RE = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]{2,}$/;

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ ok: false, error: 'bad request' });
  }
  if (!body || SECRET === 'REPLACE_WITH_MAIL_RELAY_SECRET' || body.secret !== SECRET) {
    return reply_({ ok: false, error: 'unauthorized' });
  }
  var to = String(body.to || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  if (!to.length || to.length > MAX_RECIPIENTS || !to.every(function (a) { return EMAIL_RE.test(a); })) {
    return reply_({ ok: false, error: 'invalid recipients' });
  }
  var subject = String(body.subject || '').slice(0, 200);
  var html = String(body.html || '');
  if (!subject || !html || html.length > 200000) {
    return reply_({ ok: false, error: 'invalid message' });
  }
  try {
    MailApp.sendEmail({
      to: to.join(','),
      subject: subject,
      htmlBody: html,
      name: String(body.name || 'XOLUTIONS HUB').slice(0, 60),
      replyTo: EMAIL_RE.test(String(body.replyTo || '')) ? body.replyTo : undefined
    });
  } catch (err) {
    return reply_({ ok: false, error: 'send failed: ' + err.message });
  }
  return reply_({ ok: true, remainingQuota: MailApp.getRemainingDailyQuota() });
}

function doGet() {
  return reply_({ ok: true, service: 'xolutionshub mail relay' });
}
