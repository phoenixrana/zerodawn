import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, initLenis, getLenis, destroyLenis } from './gsapInit'
import Cursor from './components/Cursor'
import HyscendLoader from './components/HyscendLoader'
// Parallax component available but not currently used
import {
  Zap, Fuel, PlugZap,
  MapPin, Mail, Phone, ArrowRight, Menu, X,
  Gauge, Hourglass, CheckCircle,
  VolumeX, BarChart3, Wrench, LayoutDashboard,
  Factory, Ship, ShieldAlert, SolarPanel,
  Crosshair, Play, Droplets,
  Activity, Route, Clock, RefreshCw,
  Weight, Thermometer, Wind, BadgeCheck,
  ClipboardCheck, Package
} from 'lucide-react'
import ShinyText from './components/ShinyText'
import HoleBackground from './components/HoleBackground'
import ResponsiveImage from './components/ResponsiveImage'
import useResponsive from './hooks/useResponsive'
import fleetosDashSvg from './assets/svg/fleetos-dashboard.svg'
import './App.css'

/* ═══════════════════════════════════
   DATA
   ═══════════════════════════════════ */

const METRICS = [
  { icon: Clock, label: '2\u20133 hr Missions' },
  { icon: RefreshCw, label: '3\u20135 min Refuel' },
  { icon: Weight, label: 'Up to 5 kg payload' },
  { icon: Thermometer, label: '\u221210\u00b0C to 50\u00b0C range' },
]

const ADVANTAGES = [
  { icon: Hourglass, title: '3\u00d7 the Endurance', desc: '2\u20133 hours per sortie, 80+ km corridors. No more landing every 25 minutes to swap batteries.' },
  { icon: VolumeX, title: 'Silent Operations', desc: 'Quiet enough for urban zones, wildlife corridors, and security patrols.' },
  { icon: Wind, title: 'Only Water Comes Out', desc: 'The only byproduct at point of use is water vapor. Aligned with India\u2019s Green Hydrogen Mission.' },
]

const UPTIME_BLOCKS = [
  { num: '01', icon: Zap, bg: '/images/drone-uav.jpg', title: 'Long-Endurance Aircraft', desc: '2\u20133 hr sorties, 4\u20136+ hours daily. One aircraft, multiple sites.' },
  { num: '02', icon: Fuel, bg: '/images/refuel-tanks.jpg', title: 'RefuelPod Swap Station', desc: 'Sub-5-minute cylinder swaps with safety interlocks. Hydrogen supply chain managed for you.' },
  { num: '03', icon: ClipboardCheck, bg: '/images/safety-gear.jpg', title: 'Safety SOPs + Training', desc: 'Your team trained and certified. SOPs, checklists, and incident playbooks \u2014 all DGCA-compliant.' },
  { num: '04', icon: Wrench, bg: '/images/maintenance-tools.jpg', title: 'Service & Maintenance', desc: 'Preventive schedules, on-site spares, and replaceable modules. Response SLA included.' },
  { num: '05', icon: LayoutDashboard, bg: '/images/software-dashboard.jpg', title: 'FleetOS Software', desc: 'Fleet visibility, automated checks, fuel-aware routing, and one-click mission reports.' },
]

const COMPARISON_ROWS = [
  { metric: 'Flight time per sortie', battery: '25\u201340 min', hydrogen: '2\u20133 hrs' },
  { metric: 'Turnaround time', battery: '10\u201315 min (swap + checks)', hydrogen: '< 5 min (cylinder swap)' },
  { metric: 'Sorties per 6-hr shift', battery: '~8\u201312 sorties (~3 hrs airborne)', hydrogen: '2\u20133 sorties (4\u20136 hrs airborne)' },
  { metric: 'Daily flight hours', battery: '~2\u20133 hrs effective', hydrogen: '4\u20136+ hrs effective' },
  { metric: 'Temperature resilience', battery: 'Significant degradation below 10\u00b0C', hydrogen: 'Stable from \u221210\u00b0C to 50\u00b0C' },
  { metric: 'Site logistics', battery: 'Many packs, chargers, generator', hydrogen: 'A few cylinders, one swap station' },
  { metric: 'Corridor coverage', battery: '~10\u201315 km per sortie', hydrogen: '80+ km per sortie' },
  { metric: 'Multi-site scaling', battery: 'Battery packs multiply per site', hydrogen: 'Same cylinder set serves multiple sites' },
]

const FLEETOS_FEATURES = [
  { icon: Activity, title: 'Hydrogen Safety Layer', desc: 'Automated pre-flight checks, verified refueling, live leak detection, and emergency shutdown protocols.' },
  { icon: Crosshair, title: 'Mission Execution', desc: 'Launch, monitor, and replay flights with full telemetry overlays.' },
  { icon: Gauge, title: 'Fuel Intelligence', desc: 'Real-time fuel levels, range forecasts, and automated go/no-go decisions before every sortie.' },
  { icon: Package, title: 'Audit-Ready Reports', desc: 'Geo-tagged flight paths, telemetry logs, and inspection findings \u2014 packaged for compliance review.' },
  { icon: Route, title: 'Smart Route Planning', desc: 'Fuel-aware routing, multi-drone scheduling, and geofence compliance.' },
  { icon: BarChart3, title: 'Inspection Analytics', desc: 'Thermal anomaly flagging, defect severity scoring, and trend analysis across repeat sorties.' },
]

const FLEETOS_HIGHLIGHT = { icon: Play, text: 'Live Command Center: multi-drone fleet view with real-time alerts and instant mission replay.' }

const INDUSTRIES = [
  { icon: PlugZap, bg: '/images/power-lines.jpg', title: 'Power & Utilities', subtitle: 'Transmission & Distribution', desc: '80+ km per sortie. Tower thermal imaging and encroachment detection at a fraction of helicopter costs.' },
  { icon: Droplets, bg: '/images/oil-refinery.jpg', title: 'Oil & Gas', subtitle: 'Pipelines & Facilities', desc: 'Long-corridor pipeline surveillance and methane detection. Near-zero point-of-use emissions in sensitive zones.' },
  { icon: SolarPanel, bg: '/images/solar-farm.jpg', title: 'Solar & Renewables', subtitle: 'Solar Farms & Wind Sites', desc: 'Thermal hotspot detection across large solar arrays in a single sortie. Repeatable, geo-tagged reports.' },
  { icon: Factory, bg: '/images/industrial-plant.jpg', title: 'Industrial Facilities', subtitle: 'Plants, Ports & Terminals', desc: 'Perimeter monitoring and flare stack surveys. Standardized reports for strict audit compliance.' },
  { icon: Ship, bg: '/images/shipping-port.jpg', title: 'Mining & Infrastructure', subtitle: 'Mines, Rail Corridors & Ports', desc: 'Stockpile volumetrics and blast zone recon across distributed sites beyond battery range.' },
  { icon: ShieldAlert, bg: '/images/emergency-response.jpg', title: 'Public Safety & Defense', subtitle: 'Border, Disaster & Law Enforcement', desc: 'Extended ISR for border patrol and disaster response. 2\u20133 hour overwatch per sortie.' },
]

/* ═══════════════════════════════════
   APP
   ═══════════════════════════════════ */
export default function App() {
  const [loading, setLoading] = useState(() => {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formStatus, setFormStatus] = useState('idle') // idle | sending | sent | error
  const responsive = useResponsive()

  // Disable browser scroll restoration — always start at top after loader
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  // Close mobile menu on Escape key + lock body scroll when open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    // Lock body scroll when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleCardMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])

  const scrollTo = (id) => {
    setMobileMenuOpen(false)
    const cardOrder = ['hero', 'mission', 'uptime', 'comparison', 'fleetos', 'industries', 'contact']
    const idx = cardOrder.indexOf(id)
    const deck = document.querySelector('.card-deck')
    const deckST = ScrollTrigger.getAll().find(st => st.trigger === deck || st.vars?.trigger === '.card-deck')

    if (idx >= 0 && deckST) {
      const progress = idx / (cardOrder.length - 1)
      const targetScroll = deckST.start + progress * (deckST.end - deckST.start)
      const lenis = getLenis()
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 3) })
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }
    } else {
      const el = document.getElementById(id)
      if (el) {
        const lenis = getLenis()
        if (lenis) {
          lenis.scrollTo(el, { duration: 1.5 })
        } else {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  /* ═══════════════════════════════════
     GSAP MASTER SETUP
     ═══════════════════════════════════ */
  useEffect(() => {
    if (loading) return

    // Force scroll to top before GSAP initializes to prevent mid-deck start
    window.scrollTo(0, 0)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    ScrollTrigger.config({ ignoreMobileResize: true })
    const isMobile = window.innerWidth <= 1024 || (window.innerWidth > 1024 && window.innerHeight < 850)
    const lenis = initLenis()

    const ctx = gsap.context(() => {

      /* ── 1. Lenis smooth scroll (initialized above, synced via gsapInit) ── */

      /* ── 2. Navbar hide/show on scroll direction ── */
      const navbar = document.querySelector('.navbar')
      let lastScrollY = 0
      ScrollTrigger.create({
        start: 'top top',
        end: 'max',
        onUpdate: (self) => {
          const scrollY = self.scroll()
          if (scrollY > 80) {
            navbar.classList.add('scrolled')
            if (self.direction === 1 && scrollY > lastScrollY + 5) {
              gsap.to(navbar, { y: -100, duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' })
            } else if (self.direction === -1) {
              gsap.to(navbar, { y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
            }
          } else {
            navbar.classList.remove('scrolled')
            gsap.set(navbar, { y: 0 })
          }
          lastScrollY = scrollY
        },
      })

      /* ── 3. Hero SplitText headline ── */
      const heroLine1 = document.querySelector('.hero-line-1')
      const heroLine2 = document.querySelector('.hero-line-2')
      const allWords = []

      if (heroLine1) {
        const split1 = new SplitText(heroLine1, { type: 'words', wordsClass: 'hero-word' })
        allWords.push(...split1.words)
      }
      if (heroLine2) {
        const split2 = new SplitText(heroLine2, { type: 'words', wordsClass: 'hero-word' })
        allWords.push(...split2.words)
      }

      if (allWords.length) {
        gsap.fromTo(allWords,
          { opacity: 0, y: 60, rotateX: -60 },
          { opacity: 1, y: 0, rotateX: 0, stagger: 0.06, duration: 0.9, ease: 'back.out(1.7)', delay: 0.3 }
        )
      }

      /* ── 4. Hero metrics, differentiator + CTA fade in ── */
      gsap.fromTo('.hero-metrics-bar', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.6 })
      gsap.fromTo('.metric-chip', { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.5, delay: 0.7, ease: 'back.out(1.7)' })
      gsap.fromTo('.hero-differentiator', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.0 })
      // Drone companion — cinematic takeoff entrance
      const droneCompanion = document.querySelector('.drone-companion')
      let droneIdleTween = null
      if (droneCompanion && !isMobile) {
        gsap.fromTo(droneCompanion,
          { opacity: 0, left: '50%', xPercent: -50, top: '58%', yPercent: -50, scale: 0.8, y: 100, rotation: -3 },
          {
            opacity: 1, y: 0, scale: 1.4, rotation: 0, duration: 1.8, delay: 0.8, ease: 'droneFlight',
            onComplete: () => {
              // Idle hover — killed once scroll timeline begins
              droneIdleTween = gsap.to(droneCompanion, {
                y: -8, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true
              })
            }
          }
        )
      }
      gsap.fromTo('.hero-cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.2 })

      /* ── 5. Scroll indicator ── */
      gsap.fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 1, delay: 2 })

      /* ── 6. Full-Screen Card Deck — Cinematic 3D scroll transitions ── */
      const deckCards = gsap.utils.toArray('.deck-card')
      const deck = document.querySelector('.card-deck')
      const deckTotal = deckCards.length
      const sectionIds = ['hero', 'mission', 'uptime', 'comparison', 'fleetos', 'industries', 'contact']

      if (deck && deckCards.length > 1 && !isMobile) {
        // Peel-away stack: all cards at same position, layered by z-index
        // First card on top, last card on bottom — current peels away to reveal next
        deckCards.forEach((card, i) => {
          gsap.set(card, { zIndex: deckTotal - i })
        })

        /* ── 6a. SplitText char splits on section titles + mission headline ── */
        const splitInstances = []
        deckCards.forEach((card) => {
          const titles = card.querySelectorAll('.section-title, .mission-headline')
          titles.forEach(el => {
            const split = new SplitText(el, {
              type: 'chars,words',
              wordsClass: 'split-word',
              charsClass: 'split-char',
            })
            splitInstances.push(split)
            el._splitChars = split.chars
          })
        })

        // Cache nav link elements once (avoid querySelectorAll every frame)
        const navLinks = document.querySelectorAll('.nav-links a[data-section]')
        let prevIdx = -1

        // Pre-collect ScrambleText labels + original text for merged handling
        const scrambleLabels = []
        deckCards.forEach((card) => {
          const label = card.querySelector('.section-label')
          if (label) {
            scrambleLabels.push({ el: label, text: label.textContent, done: false })
          }
        })

        const deckTl = gsap.timeline({
          scrollTrigger: {
            trigger: deck,
            start: 'top top',
            end: `+=${(deckTotal - 1) * 1200}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                Math.floor(self.progress * deckTotal),
                deckTotal - 1
              )
              // Active nav highlighting + mood transitions — only update when section changes
              if (idx !== prevIdx) {
                prevIdx = idx
                navLinks.forEach(a => {
                  a.classList.toggle('nav-active', a.dataset.section === sectionIds[idx])
                })
                // Set mood from current card's data-mood attribute
                const currentCard = deckCards[idx]
                const mood = currentCard?.dataset?.mood
                if (mood) {
                  document.body.dataset.mood = mood
                }
                // Trigger ScrambleText for current section label (merged from separate triggers)
                if (scrambleLabels[idx] && !scrambleLabels[idx].done) {
                  scrambleLabels[idx].done = true
                  gsap.to(scrambleLabels[idx].el, {
                    duration: 1.2,
                    scrambleText: {
                      text: scrambleLabels[idx].text,
                      chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                      speed: 0.4,
                    },
                  })
                }
                // Chapter arc navigator — toggle active class
                const arcItems = document.querySelectorAll('.arc-item')
                arcItems.forEach((item) => {
                  item.classList.toggle('arc-active', Number(item.dataset.chapter) === idx)
                })
              }
            },
          },
        })


        // Build timeline: peel-away + scrubbed content reveals
        // Each transition occupies 1.0 unit: 0.7 peel + 0.3 hold
        // Content reveals overlap with the peel tail for seamless feel
        const UNIT = 1.0
        deckCards.forEach((card, i) => {
          if (i < deckTotal - 1) {
            const pos = i * UNIT

            // Current card peels up and out of view with subtle 3D curl and fade
            deckTl.to(card, {
              yPercent: -100,
              rotateX: -3,
              opacity: 0,
              duration: 0.7,
              ease: 'power3.inOut',
            }, pos)

            // Next card scale reveal — starts slightly small, grows to 1
            const nextCard = deckCards[i + 1]
            if (nextCard) {
              deckTl.fromTo(nextCard,
                { scale: 0.96 },
                { scale: 1, duration: 0.7, ease: 'power3.inOut' },
                pos
              )
            }

            // Background image parallax during peel
            const bgImages = card.querySelectorAll('.uptime-bg, .industry-bg')
            bgImages.forEach(bg => {
              deckTl.to(bg, {
                yPercent: -12,
                duration: 0.7,
                ease: 'power3.inOut',
              }, pos)
            })

            // Hold on revealed card
            deckTl.to({}, { duration: 0.3 }, pos + 0.7)
          }

          // Scrubbed content reveals for cards 1-6 (not hero at index 0)
          // Starts at 40% into the peel so content appears as card slides away
          if (i > 0) {
            const revealPos = (i - 1) * UNIT + 0.4
            const revealDur = 0.5

            // Char-by-char headline reveal (section-title or mission-headline)
            const titleEl = card.querySelector('.section-title, .mission-headline')
            if (titleEl && titleEl._splitChars && titleEl._splitChars.length) {
              const chars = titleEl._splitChars
              const charDur = Math.max(revealDur / chars.length, 0.02)
              chars.forEach((ch, ci) => {
                deckTl.fromTo(ch,
                  { opacity: 0, y: 20, scale: 0.7 },
                  { opacity: 1, y: 0, scale: 1, duration: charDur, ease: 'power3.out' },
                  revealPos + ci * (revealDur * 0.7 / chars.length)
                )
              })
            }

            // Section subtitle — fade + y
            const subtitle = card.querySelector('.section-subtitle')
            if (subtitle) {
              deckTl.fromTo(subtitle,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.18
              )
            }

            // Body paragraphs — staggered fade + y
            const bodyPs = card.querySelectorAll('.mission-text p, .comparison-explainer p, .uptime-explainer p')
            bodyPs.forEach((p, pi) => {
              deckTl.fromTo(p,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.2 + pi * 0.04
              )
            })

            // Advantage cards — staggered fade + diagonal slide
            const advCards = card.querySelectorAll('.advantage-card')
            advCards.forEach((ac, ai) => {
              deckTl.fromTo(ac,
                { opacity: 0, x: -10, y: 12 },
                { opacity: 1, x: 0, y: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.22 + ai * 0.03
              )
            })

            // Uptime blocks — staggered scale pop
            const uptimeBlocks = card.querySelectorAll('.uptime-block')
            uptimeBlocks.forEach((ub, ui) => {
              deckTl.fromTo(ub,
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: revealDur * 0.5, ease: 'power3.out' },
                revealPos + 0.22 + ui * 0.025
              )
            })

            // SVG illustrations — scale + fade
            const svgs = card.querySelectorAll('.fleetos-dash-svg')
            svgs.forEach((svg, si) => {
              deckTl.fromTo(svg,
                { opacity: 0, scale: 0.97 },
                { opacity: 0.7, scale: 1, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + si * 0.03
              )
            })

            // FleetOS features — staggered fade + y
            const fleetosFeats = card.querySelectorAll('.fleetos-feature')
            fleetosFeats.forEach((ff, fi) => {
              deckTl.fromTo(ff,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.22 + fi * 0.025
              )
            })

            // Comparison table rows — stagger slide-in
            const compRows = card.querySelectorAll('.comp-row')
            compRows.forEach((row, ri) => {
              deckTl.fromTo(row,
                { opacity: 0, x: -15 },
                { opacity: 1, x: 0, duration: revealDur * 0.5, ease: 'power3.out' },
                revealPos + ri * 0.015
              )
            })

            // Industry cards — scale pop-in
            const industryCards = card.querySelectorAll('.industry-card')
            industryCards.forEach((ic, ii) => {
              deckTl.fromTo(ic,
                { opacity: 0, scale: 0.97, y: 10 },
                { opacity: 1, scale: 1, y: 0, duration: revealDur * 0.5, ease: 'power3.out' },
                revealPos + ii * 0.02
              )
            })

            // Uptime outcome — fade + scaleX, arrives late
            const outcome = card.querySelector('.uptime-outcome')
            if (outcome) {
              deckTl.fromTo(outcome,
                { opacity: 0, scaleX: 0.9 },
                { opacity: 1, scaleX: 1, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.45
              )
            }

            // Hydrogen wins — fade + y
            const hWins = card.querySelector('.hydrogen-wins')
            if (hWins) {
              deckTl.fromTo(hWins,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.38
              )
            }

            // Section CTA — always last
            const cta = card.querySelector('.section-cta')
            if (cta) {
              deckTl.fromTo(cta,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: revealDur * 0.5, ease: 'power3.out' },
                revealPos + 0.48
              )
            }

            // Contact form groups — stagger from left
            const formGroups = card.querySelectorAll('.form-group')
            formGroups.forEach((fg, fi) => {
              deckTl.fromTo(fg,
                { opacity: 0, x: -12 },
                { opacity: 1, x: 0, duration: revealDur * 0.5, ease: 'power3.out' },
                revealPos + 0.2 + fi * 0.03
              )
            })

            // Contact info — from right
            const contactInfo = card.querySelector('.contact-info')
            if (contactInfo) {
              deckTl.fromTo(contactInfo,
                { opacity: 0, x: 12 },
                { opacity: 1, x: 0, duration: revealDur * 0.6, ease: 'power3.out' },
                revealPos + 0.25
              )
            }
          }
        })

        /* ── Drone companion scroll repositioning (cinematic) ── */
        const DRONE_KEYFRAMES = [
          { left: '50%', xPercent: -50, top: '58%', yPercent: -50, scale: 1.2, opacity: 1, rot: 0 }, // hero (centerpiece)
          { left: '95%', xPercent: -100, top: '25%', scale: 0.9, opacity: 0.85, rot: 2 }, // mission — tilts right climbing up
          { left: '94%', xPercent: -100, top: '50%', scale: 0.85, opacity: 0.75, rot: -1 }, // uptime — slight left settling down
          { left: '96%', xPercent: -100, top: '20%', scale: 0.8, opacity: 0.6, rot: 3 }, // comparison — banking right
          { left: '93%', xPercent: -100, top: '45%', scale: 0.85, opacity: 0.7, rot: -2 }, // fleetos — drifting left
          { left: '97%', xPercent: -100, top: '60%', scale: 0.75, opacity: 0.5, rot: 1 }, // industries — slight tilt
          { left: '95%', xPercent: -100, top: '35%', scale: 0.7, opacity: 0.4, rot: 0 }, // contact — levels out
        ]

        const droneEl = document.querySelector('.drone-companion')
        if (droneEl && !isMobile) {
          gsap.set(droneEl, { left: '50%', xPercent: -50, top: '58%', yPercent: -50, scale: 1.2, rotation: 0 })

          // Kill idle hover on first scroll, restart when back at hero
          let idleKilled = false
          const heroKF = DRONE_KEYFRAMES[0]

          deckTl.eventCallback('onUpdate', function () {
            const prog = this.progress()
            // Kill idle once user scrolls past ~2%
            if (!idleKilled && prog > 0.02 && droneIdleTween) {
              droneIdleTween.kill()
              droneIdleTween = null
              gsap.set(droneEl, { y: 0 })
              idleKilled = true
            }
            // Restart idle when back at hero (progress near 0)
            if (idleKilled && prog < 0.01) {
              gsap.set(droneEl, {
                left: heroKF.left, xPercent: heroKF.xPercent,
                top: heroKF.top, yPercent: heroKF.yPercent, scale: heroKF.scale,
                rotation: heroKF.rot, opacity: heroKF.opacity, y: 0,
              })
              droneIdleTween = gsap.to(droneEl, {
                y: -8, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true
              })
              idleKilled = false
            }
          })

          for (let i = 0; i < deckTotal - 1; i++) {
            const pos = i * UNIT
            const next = DRONE_KEYFRAMES[i + 1]
            // Position + scale + y reset — flight-curve easing
            deckTl.to(droneEl, {
              left: next.left,
              xPercent: next.xPercent,
              top: next.top,
              scale: next.scale,
              rotation: next.rot,
              y: 0,
              duration: 0.7,
              ease: 'droneFlight',
            }, pos)
            // Opacity — separate smooth fade (decoupled from position)
            deckTl.to(droneEl, {
              opacity: next.opacity,
              duration: 0.5,
              ease: 'power1.inOut',
            }, pos + 0.1)
          }
        }

        /* ── 6b. Marquee transition overlays ── */
        const marquees = gsap.utils.toArray('.deck-marquee')
        const marqueePositions = [0, 4] // Between Hero→Mission (0) and FleetOS→Industries (4)
        marquees.forEach((mq, mi) => {
          if (mi < marqueePositions.length) {
            const transIdx = marqueePositions[mi]
            const peelPos = transIdx * UNIT
            // Fade in as card peels, fade out as next settles
            deckTl.fromTo(mq,
              { opacity: 0 },
              { opacity: 1, duration: 0.3, ease: 'power2.inOut' },
              peelPos + 0.1
            )
            deckTl.to(mq,
              { opacity: 0, duration: 0.3, ease: 'power2.inOut' },
              peelPos + 0.65
            )

            // Marquee track scrolling — scrub-driven horizontal movement
            const tracks = mq.querySelectorAll('.marquee-track')
            tracks.forEach((track, ti) => {
              const dir = ti === 0 ? -1 : 1
              deckTl.fromTo(track,
                { x: dir * 200 },
                { x: dir * -200, duration: 0.8, ease: 'none' },
                peelPos
              )
            })
          }
        })

        // ScrambleText is now handled in the main deck onUpdate (merged for perf)
      }

      // Mobile: clean, simple scroll reveals — no overlapping parallax
      if (isMobile && deck) {
        const mobileSections = gsap.utils.toArray('.deck-card')

        mobileSections.forEach((section, sectionIdx) => {
          if (sectionIdx === 0) return // skip hero — already visible

          // Single clean fade-up for the entire section
          gsap.fromTo(section,
            { opacity: 0, y: 32 },
            {
              opacity: 1, y: 0,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          )
        })
      }

    }) // end gsap.context

    return () => {
      ctx.revert()
      destroyLenis()
    }
  }, [loading])

  return (
    <>
      <HyscendLoader onComplete={() => setLoading(false)} hide={!loading} />
      <div id="smooth-wrapper" style={loading ? { visibility: 'hidden' } : undefined}>
        <Cursor />
        <div id="smooth-content">

        {/* ──────── SKIP NAV ──────── */}
        <a href="#hero" className="skip-nav" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>
          Skip to content
        </a>

        {/* ──────── TOP PROGRESS BAR ──────── */}
        <div className="top-progress" aria-hidden="true"><div className="top-progress-fill" /></div>

        {/* ──────── NAVBAR ──────── */}
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <a href="#hero" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>HYSCEND</a>
          <ul className={`nav-links${mobileMenuOpen ? ' open' : ''}`} role="menubar">
            <li role="none"><a role="menuitem" href="#hero" data-section="hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>Home</a></li>
            <li role="none"><a role="menuitem" href="#mission" data-section="mission" onClick={(e) => { e.preventDefault(); scrollTo('mission') }}>Mission</a></li>
            <li role="none"><a role="menuitem" href="#uptime" data-section="uptime" onClick={(e) => { e.preventDefault(); scrollTo('uptime') }}>The System</a></li>
            <li role="none"><a role="menuitem" href="#fleetos" data-section="fleetos" onClick={(e) => { e.preventDefault(); scrollTo('fleetos') }}>FleetOS</a></li>
            <li role="none"><a role="menuitem" href="#industries" data-section="industries" onClick={(e) => { e.preventDefault(); scrollTo('industries') }}>Industries</a></li>
            <li role="none"><a role="menuitem" href="#contact" data-section="contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }} className="nav-cta">Get In Touch</a></li>
          </ul>
          <button className="nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* ──────── CARD DECK ──────── */}
        <main className="card-deck" role="main" aria-label="Hyscend hydrogen-electric drone solutions">

          {/* Marquee transition overlays */}
          <div className="deck-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span className="marquee-text">3{'\u00d7'} Endurance {'\u00b7'} Near-Zero Emissions {'\u00b7'} 80+ km Range {'\u00b7'} 3{'\u2013'}5 Min Refuel {'\u00b7'} </span>
              <span className="marquee-text">3{'\u00d7'} Endurance {'\u00b7'} Near-Zero Emissions {'\u00b7'} 80+ km Range {'\u00b7'} 3{'\u2013'}5 Min Refuel {'\u00b7'} </span>
            </div>
            <div className="marquee-track">
              <span className="marquee-text">Power Grids {'\u00b7'} Oil & Gas {'\u00b7'} Solar Farms {'\u00b7'} Mining {'\u00b7'} Defense {'\u00b7'} Public Safety {'\u00b7'} </span>
              <span className="marquee-text">Power Grids {'\u00b7'} Oil & Gas {'\u00b7'} Solar Farms {'\u00b7'} Mining {'\u00b7'} Defense {'\u00b7'} Public Safety {'\u00b7'} </span>
            </div>
          </div>
          <div className="deck-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span className="marquee-text">FleetOS {'\u00b7'} Mission Control {'\u00b7'} Live Monitoring {'\u00b7'} Safety Intelligence {'\u00b7'} </span>
              <span className="marquee-text">FleetOS {'\u00b7'} Mission Control {'\u00b7'} Live Monitoring {'\u00b7'} Safety Intelligence {'\u00b7'} </span>
            </div>
            <div className="marquee-track">
              <span className="marquee-text">Inspection {'\u00b7'} Surveillance {'\u00b7'} Perimeter {'\u00b7'} Emergency Response {'\u00b7'} </span>
              <span className="marquee-text">Inspection {'\u00b7'} Surveillance {'\u00b7'} Perimeter {'\u00b7'} Emergency Response {'\u00b7'} </span>
            </div>
          </div>

          {/* Persistent drone companion — flies alongside content */}
          <ResponsiveImage
            src="/images/hero-drone.png"
            alt="Hyscend hydrogen-electric drone"
            className="drone-companion"
            width="600"
            height="400"
            ariaHidden="true"
          />

          {/* Chapter arc navigator (desktop) */}
          <div className="deck-chapter-arc" aria-hidden="true">
            {['Home', 'Mission', 'System', 'Compare', 'Software', 'Industries', 'Contact'].map((label, i) => (
              <div key={label} className={`arc-item${i === 0 ? ' arc-active' : ''}`} data-chapter={i}>
                <div className="arc-dot" />
                <span className="arc-label">{label}</span>
              </div>
            ))}
          </div>

          {/* ──────── 1. HOME / HERO ──────── */}
          <section id="hero" className="deck-card section hero" style={{ height: '100dvh' }} data-mood="deep">
            <HoleBackground
              strokeColor="#00C8F8"
              numberOfLines={40}
              numberOfDiscs={40}
              particleRGBColor={[0, 200, 248]}
            />

            {/* Headline — sits on top of the drone */}
            <div className="hero-top">
              <h1 className="hero-headline">
                <span className="hero-line-1">Hydrogen Drones Built for</span>{' '}
                <span className="hero-line-2">Hours, Not <span className="gradient-text">Minutes.</span></span>
              </h1>
            </div>

            {/* Mobile drone image — static, centered */}
            <div className="hero-drone-mobile">
              <ResponsiveImage src="/images/hero-drone.png" alt="Hyscend hydrogen-electric drone" width="600" height="400" fetchPriority="high" loading="eager" />
            </div>

            {/* Spacer for drone centering (desktop) */}
            <div className="hero-spacer"></div>

            {/* Below the drone: metrics + CTA */}
            <div className="hero-bottom">
              <div className="hero-metrics-bar">
                {METRICS.map((m) => (
                  <span key={m.label} className="metric-chip">
                    <m.icon size={14} strokeWidth={2} />
                    {m.label}
                  </span>
                ))}
              </div>
              <p className="hero-differentiator">Built for Indian Conditions</p>
              <button className="hero-cta" onClick={() => scrollTo('contact')}>
                Talk to Our Team <ArrowRight size={18} />
              </button>
            </div>

            <div className="hero-scroll">
              <span>Scroll</span>
              <div className="scroll-line" />
            </div>
          </section>

          {/* ──────── 2. MISSION ──────── */}
          <section id="mission" className="deck-card section mission-section" data-mood="cool">
            <div className="section-container">
              <span className="section-label">Mission</span>
              <h2 className="mission-headline">
                Your drone sits on the ground more than it flies. <span className="gradient-text">We fixed that.</span>
              </h2>
              <div className="mission-text">
                <p>
                  We combine UAV engineering and hydrogen refueling to deliver real operational uptime with lower point-of-use emissions. Our mission: make hydrogen drones <strong>deployable anywhere</strong> through a seamless, scalable refueling ecosystem.
                </p>
              </div>
              <h3 className="advantage-heading">The <span className="gradient-text">Hydrogen</span> Advantage</h3>
              <div className="advantage-grid">
                {ADVANTAGES.map((a) => (
                  <div key={a.title} className="advantage-card" onMouseMove={handleCardMouseMove}>
                    <div className="advantage-icon"><a.icon size={22} /></div>
                    <h4>{a.title}</h4>
                    <p>{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ──────── 3. UPTIME SYSTEM ──────── */}
          <section id="uptime" className="deck-card section uptime-section" data-mood="warm">
            <div className="section-container">
              <span className="section-label">The System</span>
              <h2 className="section-title">
                Five pillars. <span className="gradient-text">Zero gaps.</span>
              </h2>
              <p className="section-subtitle">
                Everything your site needs to fly continuously {'\u2014'} aircraft to audit trail.
              </p>
              <div className="uptime-explainer">
                <p>A longer-flying drone is a component, not a solution. The Uptime System pairs hydrogen endurance with <strong>refueling infrastructure, safety SOPs, and mission software</strong>. Operational from day one.</p>
              </div>
              <div className="uptime-grid">
                {UPTIME_BLOCKS.map((b) => (
                  <div key={b.num} className="uptime-block" onMouseMove={handleCardMouseMove}>
                    <ResponsiveImage src={b.bg} alt="" className="uptime-bg" ariaHidden="true" loading="lazy" width="400" height="300" />
                    <div className="uptime-block-content">
                      <div className="uptime-block-header">
                        <div className="uptime-num">{b.num}</div>
                        <div className="uptime-block-icon"><b.icon size={20} strokeWidth={1.8} /></div>
                      </div>
                      <h3>{b.title}</h3>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="uptime-outcome">
                <span>4{'\u2013'}6+ flight hours daily</span>
                <span className="outcome-dot">{'\u00b7'}</span>
                <span>75% fewer interruptions vs. battery fleets</span>
                <span className="outcome-dot">{'\u00b7'}</span>
                <span>DGCA-compliant safety</span>
                <span className="outcome-dot">{'\u00b7'}</span>
                <span>Audit-ready mission records</span>
              </div>
            </div>
          </section>

          {/* ──────── 4. BATTERY VS HYDROGEN ──────── */}
          <section id="comparison" className="deck-card section comparison-section" data-mood="electric">
            <div className="section-container">
              <span className="section-label">Head to Head</span>
              <h2 className="section-title">
                Same crew. Same shift. <span className="gradient-text">3{'\u00d7'} the output.</span>
              </h2>
              <div className="comparison-explainer">
                <p>The bottleneck isn{'\u2019'}t the aircraft {'\u2014'} it{'\u2019'}s the <strong>8{'\u2013'}12 landings per shift</strong>. Hydrogen cuts that to 2{'\u2013'}3 sorties with <strong>3{'\u00d7'} endurance and sub-5-minute swaps</strong>.</p>
              </div>

              <div className="comp-table">
                <div className="comp-header">
                  <div className="comp-cell comp-metric">Metric</div>
                  <div className="comp-cell comp-bat">Battery Drone</div>
                  <div className="comp-cell comp-h2">Hydrogen (Hyscend)</div>
                </div>
                {COMPARISON_ROWS.map((r) => (
                  <div key={r.metric} className="comp-row">
                    <div className="comp-cell comp-metric">{r.metric}</div>
                    <div className="comp-cell comp-bat">{r.battery}</div>
                    <div className="comp-cell comp-h2">{r.hydrogen}</div>
                  </div>
                ))}
              </div>

              <div className="hydrogen-wins">
                <h4>The Operational Math</h4>
                <p>One Hyscend system matches the coverage of <strong>3{'\u2013'}4 battery drone kits</strong>. Fewer assets, fewer operators, lower logistics overhead.</p>
                <span className="comp-note">Indicative comparison based on typical payload and conditions. Actual performance varies by mission profile, weather, and altitude.</span>
              </div>

              <button className="section-cta" onClick={() => scrollTo('contact')}>
                See the Math for Your Site <ArrowRight size={16} />
              </button>
            </div>
          </section>

          {/* ──────── 5. FLEETOS ──────── */}
          <section id="fleetos" className="deck-card section fleetos-section" data-mood="bright">
            <div className="section-container">
              <span className="section-label">Software</span>
              <div className="fleetos-header-row">
                <img src={fleetosDashSvg} alt="FleetOS mission control dashboard interface" className="fleetos-dash-svg" />
                <div className="fleetos-header-text">
                  <h2 className="section-title">
                    <span className="gradient-text">FleetOS</span> {'\u2014'} See Everything. Prove Everything.
                  </h2>
                  <p className="section-subtitle">
                    Mission software that turns flight hours into auditable, repeatable results.
                  </p>
                </div>
              </div>
              <div className="fleetos-grid">
                {FLEETOS_FEATURES.map((f) => (
                  <div key={f.title} className="fleetos-feature" onMouseMove={handleCardMouseMove}>
                    <div className="fleetos-feature-icon"><f.icon size={20} /></div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="fleetos-highlight">
                <FLEETOS_HIGHLIGHT.icon size={18} />
                <span>{FLEETOS_HIGHLIGHT.text}</span>
              </div>
              <button className="section-cta" onClick={() => scrollTo('contact')}>
                Request a Demo <ArrowRight size={16} />
              </button>
            </div>
          </section>

          {/* ──────── 6. INDUSTRIES ──────── */}
          <section id="industries" className="deck-card section industries-section" data-mood="warm">
            <div className="section-container">
              <span className="section-label">Industries</span>
              <h2 className="section-title">
                80 km corridors. <span className="gradient-text">One sortie.</span>
              </h2>
              <p className="section-subtitle">
                Where 25-minute battery flights were never enough.
              </p>
              <div className="industries-grid">
                {INDUSTRIES.map((ind) => (
                  <div key={ind.title} className="industry-card" onMouseMove={handleCardMouseMove}>
                    <ResponsiveImage src={ind.bg} alt="" className="industry-bg" ariaHidden="true" loading="lazy" width="400" height="300" />
                    <div className="industry-card-content">
                      <div className="industry-icon"><ind.icon size={24} strokeWidth={1.8} /></div>
                      <h3>{ind.title}</h3>
                      <span className="industry-subtitle">{ind.subtitle}</span>
                      <p>{ind.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="section-cta" onClick={() => scrollTo('contact')}>
                Discuss Your Use Case <ArrowRight size={16} />
              </button>
            </div>
          </section>

          {/* ──────── 7. CONTACT ──────── */}
          <section id="contact" className="deck-card section contact-section" data-mood="deep">
            <div className="section-container">
              <span className="section-label">Contact</span>
              <h2 className="section-title">
                Ready to stop <span className="gradient-text">landing every 30 minutes?</span>
              </h2>
              <p className="section-subtitle">
                Tell us what you fly, where you fly it, and how often you have to land.
              </p>
              <div className="contact-wrapper">
                <form className="contact-form" onSubmit={async (e) => {
                  e.preventDefault()
                  setFormStatus('sending')
                  const form = e.target
                  try {
                    const res = await fetch('https://formsubmit.co/ajax/info@zerodawn.in', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                      body: JSON.stringify({
                        name: form.name.value,
                        email: form.email.value,
                        phone: form.phone.value,
                        message: form.message.value,
                        _subject: 'Hyscend — New Contact Form Submission',
                      }),
                    })
                    if (res.ok) {
                      setFormStatus('sent')
                      form.reset()
                    } else {
                      setFormStatus('error')
                    }
                  } catch {
                    setFormStatus('error')
                  }
                }}>
                  <input type="hidden" name="_captcha" value="false" />
                  <div className="form-group">
                    <label htmlFor="name">Name <span aria-hidden="true">*</span></label>
                    <input id="name" name="name" className="form-input" type="text" placeholder="Your name" required aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Work Email <span aria-hidden="true">*</span></label>
                    <input id="email" name="email" className="form-input" type="email" placeholder="you@company.com" required aria-required="true" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input id="phone" name="phone" className="form-input" type="tel" placeholder="+91 ..." />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Mission Details</label>
                    <textarea id="message" name="message" className="form-input form-textarea" placeholder="e.g. pipeline inspection, 60 km corridor, daily ops..." />
                  </div>
                  {formStatus === 'sent' ? (
                    <div className="form-success" role="status">
                      <CheckCircle size={18} /> Message sent. We'll be in touch.
                    </div>
                  ) : formStatus === 'error' ? (
                    <div className="form-error" role="alert">
                      Something went wrong. Please try again or email info@zerodawn.in directly.
                      <button type="submit" className="form-submit" style={{ marginTop: '0.75rem' }}>
                        Retry <ArrowRight size={16} style={{ marginLeft: '0.3rem', verticalAlign: 'middle' }} />
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="form-submit" disabled={formStatus === 'sending'}>
                      {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
                      {formStatus !== 'sending' && <ArrowRight size={16} style={{ marginLeft: '0.3rem', verticalAlign: 'middle' }} />}
                    </button>
                  )}
                </form>
                <div className="contact-info">
                  <h3>HYSCEND</h3>
                  <p className="contact-org">by Zerodawn Technologies Pvt. Ltd.</p>
                  <p className="contact-tagline">Hydrogen-electric drone operations for India{'\u2019'}s most demanding sites.</p>
                  <div className="contact-details">
                    <div className="contact-detail">
                      <div className="contact-detail-icon"><MapPin size={18} /></div>
                      <span>Hyderabad, Telangana, India</span>
                    </div>
                    <div className="contact-detail">
                      <div className="contact-detail-icon"><Mail size={18} /></div>
                      <span>info@zerodawn.in</span>
                    </div>
                  </div>
                  <div className="contact-badges">
                    <span className="contact-badge"><BadgeCheck size={15} /> DGCA Certified</span>
                    <span className="contact-badge"><Wind size={15} /> Near-Zero Point-of-Use Emissions</span>
                    <span className="contact-badge"><Zap size={15} /> Made in India</span>
                  </div>
                  <div className="trust-strip">
                    <span className="trust-strip-label">Recognised by</span>
                    <div className="trust-logos">
                      <div className="trust-logo">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l3 3 5-6" />
                        </svg>
                        <span>DPIIT Startup India</span>
                      </div>
                      <div className="trust-logo">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="6" width="18" height="12" rx="2" />
                          <path d="M7 12h10M12 9v6" />
                        </svg>
                        <span>MSME Registered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>{/* end .card-deck */}

        {/* ──────── FOOTER ──────── */}
        <footer className="footer" role="contentinfo">
          <div className="footer-brand">
            <strong>HYSCEND</strong> by Zerodawn Technologies Pvt. Ltd. &copy; {new Date().getFullYear()}
          </div>
          <div className="footer-tagline">Hydrogen-electric drone operations for India{'\u2019'}s most demanding sites</div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a href="#hero" onClick={(e) => { e.preventDefault(); scrollTo('hero') }}>Home</a>
            <a href="#mission" onClick={(e) => { e.preventDefault(); scrollTo('mission') }}>Mission</a>
            <a href="#uptime" onClick={(e) => { e.preventDefault(); scrollTo('uptime') }}>The System</a>
            <a href="#fleetos" onClick={(e) => { e.preventDefault(); scrollTo('fleetos') }}>FleetOS</a>
            <a href="#industries" onClick={(e) => { e.preventDefault(); scrollTo('industries') }}>Industries</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }}>Contact</a>
          </nav>
        </footer>

      </div>
    </div>
    </>
  )
}
