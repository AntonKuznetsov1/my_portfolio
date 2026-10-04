import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Contact form is not configured yet.' }, { status: 503 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Please submit a valid message.' }, { status: 400 })
  }

  // Honeypot: silently accept bots without storing their message.
  if (typeof body.company === 'string' && body.company.trim()) {
    return Response.json({ ok: true })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (name.length < 1 || name.length > 100) {
    return Response.json({ error: 'Please enter a name under 100 characters.' }, { status: 400 })
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (message.length < 10 || message.length > 5000) {
    return Response.json({ error: 'Messages must be between 10 and 5,000 characters.' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  })
  const { error } = await supabase.from('contact_messages').insert({ name, email, message })

  if (error) {
    console.error('Contact message insert failed:', error.message)
    return Response.json({ error: 'Your message could not be saved. Please try again later.' }, { status: 500 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const notificationEmail = process.env.CONTACT_NOTIFICATION_EMAIL
  const fromEmail = process.env.CONTACT_FROM_EMAIL

  if (resendApiKey && notificationEmail && fromEmail) {
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [notificationEmail],
          reply_to: email,
          subject: `Portfolio message from ${name}`,
          text: `From: ${name} <${email}>\n\n${message}`
        })
      })

      if (!emailResponse.ok) {
        console.error('Contact email notification failed:', await emailResponse.text())
      }
    } catch (notificationError) {
      console.error('Contact email notification failed:', notificationError)
    }
  }

  return Response.json({ ok: true })
}
