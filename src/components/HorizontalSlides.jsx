/**
 * HorizontalSlides
 *
 * Converts a set of children into a horizontal scrolling strip driven by a
 * numeric `progress` prop (0 → 1).  The parent is responsible for supplying
 * that value — typically from a GSAP ScrollTrigger timeline living in a
 * pinned card-deck section.
 *
 * If no `progress` prop is provided the component falls back to its own
 * ScrollTrigger that maps the wrapper's scroll position to the x-translation
 * directly (standalone use-case).
 *
 * Usage — driven externally:
 *   <HorizontalSlides progress={deckProgress}>
 *     <Card />
 *     <Card />
 *   </HorizontalSlides>
 *
 * Usage — standalone (own ScrollTrigger):
 *   <HorizontalSlides>
 *     <Card />
 *     <Card />
 *   </HorizontalSlides>
 */

import { useEffect, useRef, useCallback } from 'react'
import { gsap, ScrollTrigger } from '../gsapInit'
import './HorizontalSlides.css'

/* ─────────────────────────────────────────────────────────────
   Props
   ─────────────────────────────────────────────────────────────
   children   – React nodes rendered as horizontal cards
   className  – extra class applied to the outer wrapper
   progress   – number 0–1; when supplied, skips own ScrollTrigger
   gap        – gap between cards in px (default 24)
   ───────────────────────────────────────────────────────────── */
export default function HorizontalSlides({
  children,
  className = '',
  progress,
  gap = 24,
}) {
  const wrapperRef = useRef(null)
  const stickyRef  = useRef(null)
  const trackRef   = useRef(null)
  const stRef      = useRef(null) // holds the standalone ScrollTrigger instance

  /* ── helper: measure travel distance and write it to the CSS vars ── */
  const calcTravel = useCallback(() => {
    const track   = trackRef.current
    const sticky  = stickyRef.current
    const wrapper = wrapperRef.current
    if (!track || !sticky || !wrapper) return 0

    const trackW    = track.scrollWidth
    const viewportW = sticky.clientWidth
    const travel    = Math.max(0, trackW - viewportW)

    // --travel-distance      : px value (for any CSS consumer that wants it)
    // --travel-distance-unitless : raw number so calc() can multiply it by 1px
    track.style.setProperty('--travel-distance', `-${travel}px`)
    track.style.setProperty('--travel-distance-unitless', String(-travel))

    // In standalone mode: size the outer wrapper so vertical scroll space
    // equals the horizontal travel distance (classic scroll-driven technique)
    if (progress === undefined) {
      wrapper.style.height = `${travel + window.innerHeight}px`
    }

    return travel
  }, [progress])

  /* ── sync CSS --progress var whenever the prop changes ── */
  useEffect(() => {
    if (progress === undefined) return
    const track = trackRef.current
    if (!track) return
    track.style.setProperty('--progress', String(progress))
  }, [progress])

  /* ── main setup effect ── */
  useEffect(() => {
    const track   = trackRef.current
    const sticky  = stickyRef.current
    const wrapper = wrapperRef.current
    if (!track || !sticky || !wrapper) return

    // Initial measurement
    const travel = calcTravel()

    // ResizeObserver keeps travel distance accurate on viewport changes
    const ro = new ResizeObserver(() => {
      calcTravel()
      // If we have a standalone ScrollTrigger, ask it to recalculate too
      if (stRef.current) stRef.current.refresh()
    })
    ro.observe(wrapper)
    ro.observe(track)

    // ── Standalone ScrollTrigger (only when progress is NOT provided) ──
    if (progress === undefined && travel > 0) {
      stRef.current = ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: () => `+=${calcTravel()}`,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          track.style.setProperty('--progress', String(self.progress))
        },
      })
    }

    return () => {
      ro.disconnect()
      if (stRef.current) {
        stRef.current.kill()
        stRef.current = null
      }
    }
  }, [calcTravel, progress])

  return (
    <div
      ref={wrapperRef}
      className={`horizontal-slides${className ? ` ${className}` : ''}`}
      // Expose the gap as a CSS variable so the track's gap rule picks it up.
      // height is written imperatively by calcTravel() in standalone mode;
      // in externally-driven mode the wrapper collapses to its parent's size.
      style={gap !== 24 ? { '--hs-gap': `${gap}px` } : undefined}
    >
      {/* sticky viewport container */}
      <div ref={stickyRef} className="horizontal-slides__sticky">
        {/* the actual scrolling track */}
        <div
          ref={trackRef}
          className="horizontal-slides__track"
          // Accessibility: announce to screen readers that this is a scrolling
          // list so keyboard users know there is more content
          role="list"
          aria-label="Horizontal card list"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
