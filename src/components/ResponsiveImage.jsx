/**
 * ResponsiveImage — serves WebP with srcset and JPG/PNG fallback.
 *
 * Assumes image variants exist at:
 *   /images/{name}.{ext}                    — original fallback
 *   /images/{name}.webp                     — full-size WebP
 *   /images/responsive/{name}-640w.webp     — 640px wide
 *   /images/responsive/{name}-1024w.webp    — 1024px wide
 */
/**
 * Default `sizes` matches a full-width hero. For thumbnail tiles (uptime/industry
 * cards rendering at ~400px wide), pass a tighter `sizes` so the browser doesn't
 * pick the 1600w variant — that single fix cuts ~600 KB of wasted image transfer
 * across the deck per the perf review.
 */
const DEFAULT_SIZES = '(max-width: 640px) 640px, (max-width: 1024px) 1024px, 100vw'

export default function ResponsiveImage({
  src,
  alt = '',
  width,
  height,
  className,
  loading = 'lazy',
  fetchPriority,
  ariaHidden,
  sizes = DEFAULT_SIZES,
  ...rest
}) {
  // Derive base name from src like "/images/hero-drone.png"
  const match = src.match(/\/images\/(.+)\.(jpg|jpeg|png)$/i)
  if (!match) {
    // Fallback: render plain img if path doesn't match expected pattern
    return <img src={src} alt={alt} width={width} height={height} className={className} loading={loading} {...rest} />
  }

  const baseName = match[1]

  return (
    <picture>
      {/* WebP sources with responsive sizes */}
      <source
        type="image/webp"
        srcSet={`/images/responsive/${baseName}-640w.webp 640w, /images/responsive/${baseName}-1024w.webp 1024w, /images/${baseName}.webp 1600w`}
        sizes={sizes}
      />
      {/* Original format fallback */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        aria-hidden={ariaHidden}
        {...rest}
      />
    </picture>
  )
}
