'use client'

import { useState } from 'react'
import { SendIcon } from 'lucide-react'

export function ContactForm() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus('sending')
    setMessage('')

    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Your message could not be sent.')

      form.reset()
      setStatus('sent')
      setMessage(result.warning || 'Thanks! Your message has been sent.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Your message could not be sent. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 font-headers text-sm font-semibold text-[#e8ebf1]">
          Your name
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            className="rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2.5 font-sans font-normal text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20"
          />
        </label>
        <label className="flex flex-col gap-2 font-headers text-sm font-semibold text-[#e8ebf1]">
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2.5 font-sans font-normal text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 font-headers text-sm font-semibold text-[#e8ebf1]">
        Message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="resize-y rounded-lg border border-[#3b3b40] bg-[#1b1b1e] px-3 py-2.5 font-sans font-normal text-[#f0eff1] outline-none transition placeholder:text-[#88878d] focus:border-[#f0a878] focus:ring-2 focus:ring-[#f0a878]/20"
        />
      </label>
      <label aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        Leave this field blank
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button className="button-primary" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'} <SendIcon size={15} />
        </button>
        {message && (
          <p role="status" className={`mb-0 text-sm ${status === 'error' ? 'text-red-400' : 'text-[#f0a878]'}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  )
}
