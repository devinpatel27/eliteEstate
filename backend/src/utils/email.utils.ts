interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  if (!to) return;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${text || html.replace(/<[^>]+>/g, '')}`);
    return;
  }

  console.log(`[email:queued] To: ${to} | Subject: ${subject}`);
  console.log('[email] Configure nodemailer/SMTP integration to deliver production mail.');
}

export async function sendLeadThankYouEmail(customerName: string, email?: string): Promise<void> {
  if (!email) return;

  const subject = 'Thank you for connecting with Elite Estate';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h2 style="color:#2563eb">Thank you, ${customerName}!</h2>
      <p>We appreciate you connecting with <strong>Elite Estate</strong>.</p>
      <p>Our team has recorded your enquiry and will stay in touch regarding your property requirements.</p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px">Elite Estate CRM</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text: `Thank you, ${customerName}! We appreciate you connecting with Elite Estate.`,
  });
}
