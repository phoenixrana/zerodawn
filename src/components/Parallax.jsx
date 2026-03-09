import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../gsapInit'

// Usage:
// <Parallax speed={0.5}>
//   <img src="..." alt="..." />
// </Parallax>
//
// speed > 0  — element drifts in the direction of scroll (slower than page)
// speed < 0  — element drifts against scroll (counter-parallax)
// speed = 0  — no parallax movement

export default function Parallax({ children, speed = 1, className, id }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const yDistance = window.innerWidth * speed * 0.1

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: outer,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })

    tl.fromTo(
      inner,
      { y: yDistance },
      { y: -yDistance, ease: 'none' }
    )

    return () => {
      tl.kill()
    }
  }, [speed])

  return (
    <div
      ref={outerRef}
      id={id}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        ref={innerRef}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
