const nodemailer = require('nodemailer');

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

function money(n) { return '₦' + Number(n).toLocaleString('en-NG'); }

function orderEmailHtml(order) {
  const items = JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items));
  const rows = items.map(i => `<tr><td style="padding:6px 0; color:#334155; font-size:14px;">${i.name}</td><td style="padding:6px 0; color:#334155; font-size:14px; text-align:right;">${money(i.price)}</td></tr>`).join('');
  const trackUrl = (process.env.APP_BASE_URL || 'https://xolutionshub.onrender.com') + '/track?ref=' + order.reference;

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif; background:#f3f5f9; padding:32px 0;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
      <div style="background:#15206b; padding:28px 32px;">
        <span style="color:#ffffff; font-size:20px; font-weight:700;">XOLUTIONS HUB</span>
      </div>
      <div style="padding:32px;">
        <h1 style="color:#0f172a; font-size:21px; margin:0 0 16px;">Order Confirmed, ${order.name}</h1>
        <p style="color:#64748b; font-size:14.5px; line-height:1.6;">Your reference: <strong style="color:#0f172a;">${order.reference}</strong></p>
        <table style="width:100%; margin:18px 0; border-collapse:collapse; border-top:1px solid #e2e8f0; padding-top:12px;">
          ${rows}
          <tr><td style="padding:10px 0 0; color:#0f172a; font-weight:700; font-size:14.5px; border-top:1px solid #e2e8f0;">Total</td><td style="padding:10px 0 0; color:#0f172a; font-weight:700; font-size:14.5px; text-align:right; border-top:1px solid #e2e8f0;">${money(order.grand_total)}</td></tr>
        </table>
        <div style="text-align:center; margin:28px 0;">
          <a href="${trackUrl}" style="background:#f97316; color:#0f172a; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:700; font-size:15px; display:inline-block;">Track Your Order</a>
        </div>
        <p style="color:#64748b; font-size:13.5px; line-height:1.6;">Questions? WhatsApp us: <a href="https://wa.me/2349041372994" style="color:#f97316; font-weight:600;">0904 137 2994</a></p>
        <p style="color:#0f172a; font-size:14px; font-weight:600; margin-top:24px;">The XOLUTIONS HUB Team</p>
      </div>
    </div>
  </div>`;
}

async function sendOrderConfirmation(order) {
  const t = getTransporter();
  if (!t) { console.warn('Mailer not configured — skipping email to', order.email); return { skipped: true }; }
  const info = await t.sendMail({
    from: '"XOLUTIONS HUB" <' + (process.env.GMAIL_USER || 'xolutionshub@gmail.com') + '>',
    to: order.email,
    replyTo: process.env.GMAIL_USER || 'xolutionshub@gmail.com',
    subject: `XOLUTIONS HUB — Order Confirmed (${order.reference})`,
    html: orderEmailHtml(order)
  });
  return { skipped: false, messageId: info.messageId };
}

module.exports = { sendOrderConfirmation, money };
