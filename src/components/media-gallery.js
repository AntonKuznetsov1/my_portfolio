import { SafeImage } from '@/components/safe-image'
import { cn } from '@/lib/utils'

/**
 * Image gallery shared by blog posts and project pages. Images marked as the
 * cover are normally shown separately as a hero, so pass the rest here.
 * Follows the same lazy-load, reveal and fallback conventions as the bookmark cards.
 */
export const MediaGallery = ({ images = [], className, eager = false }) => {
  if (!images.length) return null

  return (
    <ul className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {images.map((image, index) => (
        <li key={image.url} className={cn('min-w-0', index === 0 && images.length % 2 === 1 && 'sm:col-span-2')}>
          <figure className="m-0 flex flex-col gap-2">
            <SafeImage
              src={image.url}
              alt={image.alt || ''}
              width={1200}
              height={800}
              loading={eager && index === 0 ? 'eager' : 'lazy'}
              className="aspect-auto w-full animate-reveal rounded-xl border border-[#343438] bg-[url('/assets/fallback.webp')] bg-cover bg-center bg-no-repeat object-cover"
            />
            {image.alt && <figcaption className="text-xs text-[#88878d]">{image.alt}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  )
}

/** Large single image used directly under a title. */
export const MediaHero = ({ image, className }) => {
  if (!image) return null

  return (
    <SafeImage
      src={image.url}
      alt={image.alt || ''}
      width={1200}
      height={675}
      loading="eager"
      className={cn(
        "aspect-[1200/675] w-full animate-reveal rounded-xl border border-[#343438] bg-[url('/assets/fallback.webp')] bg-cover bg-center bg-no-repeat object-cover",
        className
      )}
    />
  )
}
