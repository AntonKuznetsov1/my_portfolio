/**
 * Sends contact form messages over SMTP.
 *
 * Workers cannot use Nodemailer: it needs node:net and node:tls, which the
 * runtime does not expose. worker-mailer speaks SMTP over Cloudflare's own TCP
 * socket API instead, so it runs where the site is deployed.
 *
 * Gmail needs an app password rather than the account password, and 2FA has to
 * be on. Note that Cloudflare blocks outbound TCP on port 25, which is why this
 * talks STARTTLS on 587. Gmail's other option, implicit TLS on 465, works too.
 */
const SMTP_HOST = 'smtp.gmail.com'
const SMTP_PORT = 587

const escapeHtml = (value = '') =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/**
 * Wraps the message text to 78 columns. Plain-text mail clients hard-wrap
 * around that width, and a body with no newlines of its own arrives as one
 * enormous line, which is unreadable in most readers.
 */
function toPlainText(value = '') {
  return value
    .split('\n')
    .map((line) => {
      const words = line.split(/\s+/).filter(Boolean)
      const lines = []
      let current = ''

      for (const word of words) {
        if (!current) current = word
        else if (`${current} ${word}`.length <= 78) current += ` ${word}`
        else {
          lines.push(current)
          current = word
        }
      }
      if (current) lines.push(current)
      return lines.join('\n')
    })
    .join('\n')
}

function toHtml({ name, email, message }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
      <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#88878d;">New message from portfolio.antonkuz.com</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#27272a;">
        <tr><td style="padding:8px 0;color:#71717a;width:80px;vertical-align:top;">Name</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(
          name
        )}</td></tr>
        <tr><td style="padding:8px 0;color:#71717a;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(
          email
        )}" style="color:#f0a878;">${escapeHtml(email)}</a></td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:16px 0;" />
      <div style="font-size:15px;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${escapeHtml(
        message
      )}</div>
    </div>
  </body>
</html>`
}

/**
 * Returns a short human-readable reason, or null when the send succeeded.
 *
 * The caller decides what to surface: a failure here must never read as a lost
 * message, because the message is already stored in Supabase by this point.
 */
export async function sendContactEmail({ name, email, message }) {
  const user = process.env.SMTP_USER
  const password = process.env.SMTP_PASS
  const to = process.env.CONTACT_TO_EMAIL

  if (!user || !password || !to) {
    console.error('Contact email not sent: SMTP_USER, SMTP_PASS or CONTACT_TO_EMAIL is missing.')
    return null
  }

  // Bundled through esbuild by OpenNext so the ESM import of
  // cloudflare:sockets survives. A static import would make Turbopack load the
  // module during page-data collection and fail the build.
  const { WorkerMailer } = await import('worker-mailer')

  try {
    const mailer = await WorkerMailer.connect({
      host: SMTP_HOST,
      port: SMTP_PORT,
      // 587 negotiates TLS after the greeting, so secure stays false and the
      // upgrade happens via STARTTLS.
      secure: false,
      startTls: true,
      authType: 'plain',
      credentials: { username: user, password }
    })

    await mailer.send({
      from: { name: 'Anton Kuznetsov', email: user },
      to: [{ name: 'Anton Kuznetsov', email: to }],
      // Replying goes to the visitor, not to the sending account.
      reply: { name, email },
      subject: `Contact form: message from ${name}`,
      text: toPlainText(`${message}\n\n---\nFrom: ${name}\nEmail: ${email}`),
      html: toHtml({ name, email, message })
    })

    return null
  } catch (error) {
    console.error('Contact email notification failed:', error?.message || error)
    return 'Your message was saved, but the notification email could not be sent.'
  }
}
