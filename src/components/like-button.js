'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { supabase } from '@/lib/supabase'
import { cn, formatNumber } from '@/lib/utils'

const STORAGE_KEY = 'portfolio_visitor_id'

// When localStorage throws — private browsing, blocked cookies, quota — there is
// nowhere to persist an id, so the fallback is held here instead. Without this,
// every click would generate a fresh UUID and every like would land on a
// different row, making the button impossible to un-set.
let sessionVisitorId = null

/**
 * One anonymous id per browser, stored locally. It is what makes "one like per
 * person" mean one like per person rather than one like per click. The database
 * enforces it too: post_likes has a composite primary key on (post_id, visitor_id).
 */
function getVisitorId() {
  if (typeof window === 'undefined') return null
  if (sessionVisitorId) return sessionVisitorId

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    const created = window.crypto.randomUUID()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    sessionVisitorId = window.crypto.randomUUID()
    return sessionVisitorId
  }
}

export const LikeButton = ({ postId, initialCount = 0, className }) => {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(Number(initialCount) || 0)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const visitorId = getVisitorId()
      if (!supabase || !visitorId) return

      const { data, error } = await supabase.rpc('get_post_like_status', {
        p_post_id: postId,
        p_visitor_id: visitorId
      })

      if (cancelled || error || !data?.length) return
      setLiked(Boolean(data[0].liked))
      setCount(Number(data[0].like_count) || 0)
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [postId])

  const toggle = useCallback(async () => {
    if (pending) return

    const visitorId = getVisitorId()
    if (!supabase || !visitorId) return

    setPending(true)
    // Optimistic, then reconciled with the row the database actually holds.
    setLiked((current) => !current)
    setCount((current) => Math.max(0, current + (liked ? -1 : 1)))

    const { data, error } = await supabase.rpc('toggle_post_like', {
      p_post_id: postId,
      p_visitor_id: visitorId
    })

    setPending(false)

    if (error || !data?.length) {
      setLiked((current) => !current)
      setCount((current) => Math.max(0, current + (liked ? 1 : -1)))
      return
    }

    setLiked(Boolean(data[0].liked))
    setCount(Number(data[0].like_count) || 0)
  }, [liked, pending, postId])

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={pending}
      whileTap={{ scale: 0.94 }}
      aria-pressed={liked}
      aria-label={liked ? 'Remove your like' : 'Like this post'}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-normal transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#f0a878]',
        liked
          ? 'border-[#9b6f53] bg-[#2a2119] text-[#f0a878]'
          : 'border-[#3b3b40] bg-[#1b1b1e] text-[#a1a0a5] hover:-translate-y-0.5 hover:border-[#6a696f] hover:text-[#f0a878]',
        className
      )}
    >
      <motion.span
        key={liked ? 'liked' : 'unliked'}
        initial={{ scale: liked ? 1 : 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex"
      >
        <HeartIcon filled={liked} />
      </motion.span>
      <span className="tabular-nums">{formatNumber(count)}</span>
    </motion.button>
  )
}

// lucide-react 0.279 has no fill support, so the liked state swaps the outline
// for a filled path of the same 24-unit box.
const HeartIcon = ({ filled }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
)
