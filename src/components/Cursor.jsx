/**
 * Cursor.jsx — Custom animated cursor component
 *
 * Inspired by darkroom.engineering / Lenis cursor.
 * Requires: gsap (already in project dependencies)
 *
 * Usage:
 *   import Cursor from './components/Cursor'
 *   // Place once near the root of the app, e.g. inside App() return:
 *   <Cursor />
 *
 * The component:
 *  - Adds `has-cursor` class to <html> to hide the native cursor
 *  - Follows the mouse with GSAP expo.out easing (0.6 s lag)
 *  - Fades in on first mouse movement
 *  - Scales up on interactive elements (buttons, a, input, etc.)
 *  - Scales down on mousedown, back on mouseup
 *  - Hides when mouse leaves the viewport
 *  - Is a no-op on SSR and touch-only devices
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import './Cursor.css'

/* Selector for all elements that should trigger the "active" cursor state */
const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, label, select, [role="button"], [data-cursor="pointer"]'

/* ─── Touch device detection (run once at module level for performance) ─── */
const isTouchDevice =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches

export default function Cursor() {
  const circleRef = useRef(null)

  /* Track whether the cursor has appeared yet */
  const hasAppeared = useRef(false)

  /* Track current state to avoid redundant class toggles */
  const isActive = useRef(false)
  const isPressed = useRef(false)
  const isHidden = useRef(false)

  /* GSAP quick-setter for the translate position */
  const setX = useRef(null)
  const setY = useRef(null)

  /* Live mouse position stored in a ref (no re-render needed) */
  const mousePos = useRef({ x: -200, y: -200 })

  /* ─── SSR guard + touch guard ─── */
  /* We render null on the server or on touch devices. We use a state
     flag that is resolved after mount so hydration stays consistent. */
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    /* Only activate on desktop (hover-capable, fine pointer) */
    if (!isTouchDevice) {
      setShouldRender(true)
    }
  }, [])

  /* ─── Helpers: class toggles ─── */

  const show = useCallback(() => {
    if (!circleRef.current) return
    if (isHidden.current) {
      circleRef.current.classList.remove('cursor--hidden')
      isHidden.current = false
    }
  }, [])

  const hide = useCallback(() => {
    if (!circleRef.current) return
    if (!isHidden.current) {
      circleRef.current.classList.add('cursor--hidden')
      isHidden.current = true
    }
  }, [])

  const activate = useCallback(() => {
    if (!circleRef.current || isActive.current) return
    circleRef.current.classList.add('cursor--active')
    isActive.current = true
  }, [])

  const deactivate = useCallback(() => {
    if (!circleRef.current || !isActive.current) return
    circleRef.current.classList.remove('cursor--active')
    isActive.current = false
  }, [])

  const press = useCallback(() => {
    if (!circleRef.current || isPressed.current) return
    circleRef.current.classList.add('cursor--pressed')
    isPressed.current = true
  }, [])

  const release = useCallback(() => {
    if (!circleRef.current || !isPressed.current) return
    circleRef.current.classList.remove('cursor--pressed')
    isPressed.current = false
  }, [])

  /* ─── Main effect: event listeners + GSAP animation loop ─── */
  useEffect(() => {
    if (!shouldRender || !circleRef.current) return

    const el = circleRef.current

    /* Add class to html to suppress native cursor */
    document.documentElement.classList.add('has-cursor')

    /* Initialise GSAP quick-setters for maximum performance:
       quick-setters bypass the GSAP property parser on every frame */
    setX.current = gsap.quickSetter(el, 'x', 'px')
    setY.current = gsap.quickSetter(el, 'y', 'px')

    /* Position the circle off-screen initially so there's no jump */
    setX.current(-200)
    setY.current(-200)

    /* ── mousemove: update target position ── */
    const onMouseMove = (e) => {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY

      /* Fade in on very first movement */
      if (!hasAppeared.current) {
        hasAppeared.current = true
        gsap.to(el, {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        })
      }

      show()

      /* Detect whether the cursor is over an interactive element */
      const target = e.target
      if (target.closest(INTERACTIVE_SELECTOR)) {
        activate()
      } else {
        deactivate()
      }
    }

    /* ── mouseenter / mouseleave on viewport ── */
    const onMouseEnter = () => {
      if (hasAppeared.current) show()
    }

    const onMouseLeave = () => {
      hide()
    }

    /* ── mousedown / mouseup ── */
    const onMouseDown = () => {
      press()
    }

    const onMouseUp = () => {
      release()
    }

    /* ── GSAP ticker: smooth follow with expo.out lag ──
       Each tick we lerp the rendered position toward mousePos.
       Using gsap.to with repeat would fight the ticker, so instead
       we drive a continuous tween that re-targets every frame via
       gsap.quickTo, which is the idiomatic GSAP v3 pattern for
       "sticky cursor" following. */
    const quickToX = gsap.quickTo(el, 'x', {
      duration: 0.6,
      ease: 'expo.out',
    })
    const quickToY = gsap.quickTo(el, 'y', {
      duration: 0.6,
      ease: 'expo.out',
    })

    /* Drive quickTo targets every frame */
    const ticker = gsap.ticker.add(() => {
      quickToX(mousePos.current.x)
      quickToY(mousePos.current.y)
    })

    /* Attach listeners */
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.documentElement.addEventListener('mouseenter', onMouseEnter)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    /* ── Cleanup ── */
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.documentElement.removeEventListener('mouseenter', onMouseEnter)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      gsap.ticker.remove(ticker)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [shouldRender, show, hide, activate, deactivate, press, release])

  /* ─── Render ─── */
  if (!shouldRender) return null

  return (
    <div
      ref={circleRef}
      className="cursor"
      aria-hidden="true"
      role="presentation"
    />
  )
}
