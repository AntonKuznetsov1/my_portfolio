'use client'

const DEFAULT_FALLBACK = '/assets/fallback.webp'

/**
 * An <img> that swaps in a local placeholder when the source fails to load, so a
 * deleted or replaced upload degrades to the fallback instead of showing a
 * broken-image icon.
 *
 * This has to be a Client Component: onError is an event handler, and React
 * refuses to pass an event handler to a Client Component from a Server
 * Component. Components that render images from server pages therefore have to
 * use this rather than a bare <img onError>. Without it, prerendering a page
 * that actually has an image fails the build with
 * "Event handlers cannot be passed to Client Component props".
 */
export const SafeImage = ({ fallbackSrc = DEFAULT_FALLBACK, alt = '', onError, ...props }) => (
  <img
    {...props}
    alt={alt}
    onError={(event) => {
      // Clear the handler first, otherwise a bad fallback loops forever.
      event.target.onerror = null
      onError?.(event)
      event.target.src = fallbackSrc
    }}
  />
)
