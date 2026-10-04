'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LockIcon } from 'lucide-react'

import { Field, TextInput } from '@/components/admin/field'
import { StatusToast } from '@/components/admin/status-toast'

export const LoginForm = ({ login }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const from = searchParams.get('from')

  const handleSubmit = (event) => {
    event.preventDefault()
    setStatus('idle')
    setMessage('')

    startTransition(async () => {
      const result = await login(password)

      if (!result?.ok) {
        setStatus('error')
        setMessage(result?.error || 'That password was not accepted.')
        setPassword('')
        return
      }

      setStatus('success')
      setMessage('Welcome back.')
      router.replace(from && from.startsWith('/admin') ? from : '/admin')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Password" htmlFor="admin-password" hint="Your admin password unlocks posts and projects.">
        <TextInput
          id="admin-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          placeholder="••••••••"
        />
      </Field>
      <button type="submit" className="button-primary self-start" disabled={isPending || !password}>
        {isPending ? 'Checking…' : 'Sign in'} <LockIcon size={15} />
      </button>
      <StatusToast status={status} message={message} />
    </form>
  )
}