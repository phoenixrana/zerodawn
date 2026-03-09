import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(
  ScrollTrigger,
  SplitText,
  DrawSVGPlugin,
  ScrambleTextPlugin,
  CustomEase
)

CustomEase.create('hydrogenEase', 'M0,0 C0.16,1 0.3,1 1,1')
CustomEase.create('preciseEase', 'M0,0 C0.4,0 0.2,1 1,1')
// Drone flight — slow takeoff, cruising mid, air-drag deceleration at end
CustomEase.create('droneFlight', 'M0,0 C0.12,0.28 0.3,0.85 0.48,0.95 0.65,1.02 0.82,1 1,1')

gsap.defaults({ ease: 'hydrogenEase', duration: 0.8 })

/* ── Lenis smooth scroll + GSAP ScrollTrigger sync ── */
let lenisInstance = null

function initLenis() {
  if (lenisInstance) return lenisInstance

  lenisInstance = new Lenis({
    lerp: 0.07,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.04,
    touchInertiaMultiplier: 25,
  })

  // Sync Lenis scroll position with ScrollTrigger
  lenisInstance.on('scroll', ScrollTrigger.update)

  // Drive Lenis from GSAP ticker for perfect frame sync
  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  return lenisInstance
}

function getLenis() {
  return lenisInstance
}

function destroyLenis() {
  if (lenisInstance) {
    gsap.ticker.remove(lenisInstance.raf)
    lenisInstance.destroy()
    lenisInstance = null
  }
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, ScrambleTextPlugin, initLenis, getLenis, destroyLenis }
