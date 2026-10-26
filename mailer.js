const nodemailer = require('nodemailer');
const site = require('./siteConfig');

let transporter = null;
function getTransporter() {
  if (!process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'xolutionshub@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  return transporter;
}

const BASE_URL = () => process.env.APP_BASE_URL || 'https://xolutionshub.onrender.com';
function money(n) { return '₦' + Number(n).toLocaleString('en-NG'); }
// Order fields are customer input; escape before putting them in HTML.
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function bankHtml(order) {
  if (!site.bankConfigured) {
    return `<p style="color:#334155; font-size:14.5px; line-height:1.6;">Message us on WhatsApp with your reference and we'll send our bank account details.</p>`;
  }
  const row = (k, v) => `<tr><td style="padding:4px 0; color:#64748b; font-size:13.5px;">${k}</td><td style="padding:4px 0; color:#0f172a; font-size:14.5px; font-weight:700; text-align:right;">${esc(v)}</td></tr>`;
  return `<table style="width:100%; border-collapse:collapse; background:#f6f2e9; border-radius:8px; padding:12px;">
    ${row('Bank', site.bank.name)}${row('Account name', site.bank.accountName)}${row('Account number', site.bank.accountNumber)}
    ${row('Amount', money(order.grand_total))}${row('Narration / description', order.reference)}
  </table>`;
}

function layout(order, heading, introHtml, extraHtml) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const rows = items.map(i => `<tr><td style="padding:6px 0; color:#334155; font-size:14px;">${esc(i.name)}</td><td style="padding:6px 0; color:#334155; font-size:14px; text-align:right;">${money(i.price)}</td></tr>`).join('');
  const trackUrl = BASE_URL() + '/track?ref=' + encodeURIComponent(order.reference);
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif; background:#f3f5f9; padding:32px 0;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
      <div style="background:#0c1347; padding:28px 32px;">
        <span style="color:#ffffff; font-size:20px; font-weight:700;">XOLUTIONS HUB</span>
      </div>
      <div style="padding:32px;">
        <h1 style="color:#0f172a; font-size:21px; margin:0 0 16px;">${heading}</h1>
        ${introHtml}
        <p style="color:#64748b; font-size:14.5px; line-height:1.6;">Your reference: <strong style="color:#0f172a;">${esc(order.reference)}</strong></p>
        <table style="width:100%; margin:18px 0; border-collapse:collapse;">
          ${rows}
          <tr><td style="padding:10px 0 0; color:#0f172a; font-weight:700; font-size:14.5px; border-top:1px solid #e2e8f0;">Total</td><td style="padding:10px 0 0; color:#0f172a; font-weight:700; font-size:14.5px; text-align:right; border-top:1px solid #e2e8f0;">${money(order.grand_total)}</td></tr>
        </table>
        ${extraHtml || ''}
        <div style="text-align:center; margin:28px 0;">
          <a href="${trackUrl}" style="background:#f97316; color:#0f172a; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px; display:inline-block;">Track your order</a>
        </div>
        <p style="color:#64748b; font-size:13.5px; line-height:1.6;">Questions? WhatsApp us: <a href="https://wa.me/${site.whatsappIntl}" style="color:#b13e08; font-weight:600;">${site.whatsappDisplay}</a></p>
        <p style="color:#0f172a; font-size:14px; font-weight:600; margin-top:24px;">The XOLUTIONS HUB Team</p>
      </div>
    </div>
  </div>`;
}

async function send(to, subject, html) {
  const t = getTransporter();
  if (!t) { console.warn('Mailer not configured — skipping email to', to); return { skipped: true }; }
  const info = await t.sendMail({
    from: '"XOLUTIONS HUB" <' + (process.env.GMAIL_USER || 'xolutionshub@gmail.com') + '>',
    to,
    replyTo: process.env.GMAIL_USER || 'xolutionshub@gmail.com',
    subject,
    html
  });
  return { skipped: false, messageId: info.messageId };
}

// Sent when the order is placed: payment instructions.
function sendOrderReceived(order) {
  const intro = `<p style="color:#334155; font-size:14.5px; line-height:1.6;">Thanks, ${esc(order.name)}. We've received your order. To start work, pay by bank transfer using the details below, then send your payment receipt to us on WhatsApp with your reference.</p>`;
  return send(order.email, `XOLUTIONS HUB — Order received, payment details (${order.reference})`,
    layout(order, 'Order received', intro, bankHtml(order)));
}

// Sent when an admin confirms the transfer. activationUrl is set for accounts with no password yet.
function sendOrderConfirmation(order, activationUrl) {
  const intro = `<p style="color:#334155; font-size:14.5px; line-height:1.6;">Thanks, ${esc(order.name)}. We've confirmed your payment and your order is now in our queue.</p>`;
  const extra = activationUrl
    ? `<p style="color:#334155; font-size:14.5px; line-height:1.6;">Set a password to open your dashboard, where you can follow progress and upload documents: <a href="${activationUrl}" style="color:#15206b; font-weight:700;">activate your account</a>.</p>`
    : `<p style="color:#334155; font-size:14.5px; line-height:1.6;">Log in to your dashboard to follow progress and upload documents.</p>`;
  return send(order.email, `XOLUTIONS HUB — Payment confirmed (${order.reference})`,
    layout(order, 'Payment confirmed', intro, extra));
}

module.exports = { sendOrderReceived, sendOrderConfirmation, money };
