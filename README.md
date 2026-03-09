# Hyscend — Hydrogen Drone Uptime System

The official website for **Hyscend**, an end-to-end hydrogen-powered drone system built for industrial inspection and surveillance. Developed by **Zero Dawn Technologies**.

> 2+ hour flights. Under 5-minute refuel. Zero flight emissions.

**Live:** [hyscend.com](https://hyscend.com)

---

## Overview

Hyscend is a hydrogen fuel-cell drone platform designed for India's harshest industrial environments. This website showcases the full product ecosystem:

- **Hydrogen-Electric Aircraft** — Long-endurance drones with 2+ hour flight time
- **RefuelPod Swap Station** — Field-deployable hydrogen refueling in under 5 minutes
- **FleetOS** — Mission control software for fleet management, live telemetry, and compliance reporting
- **Safety SOPs** — DGCA-compliant operational procedures

### Target Industries

- Power & Utilities
- Oil & Gas
- Solar Farms
- Ports & Logistics
- Industrial Plants
- Emergency Response

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Animations | GSAP 3 + ScrollTrigger |
| Smooth Scroll | Lenis |
| Motion | Framer Motion |
| Icons | Lucide React |
| Responsive | react-responsive + CSS Container Queries |
| Fonts | Space Grotesk, Inter, Instrument Serif, IBM Plex Mono |
| Deployment | Vercel |

---

## Project Structure

```
Hyscend-website/
├── public/
│   └── images/
│       ├── *.jpg, *.png          # Original fallback images
│       ├── *.webp                # Full-size WebP conversions
│       └── responsive/           # Responsive variants (640w, 1024w)
├── src/
│   ├── App.jsx                   # Main application (sections, GSAP animations)
│   ├── index.css                 # Complete stylesheet (~5400 lines)
│   ├── main.jsx                  # Entry point
│   ├── gsapInit.js               # GSAP + ScrollTrigger initialization
│   ├── components/
│   │   ├── ResponsiveImage.jsx   # <picture> with WebP srcset + fallback
│   │   ├── HyscendLoader.jsx     # Branded loading screen
│   │   ├── HoleBackground.jsx    # Animated particle background
│   │   ├── BlurText.jsx          # Text blur-in animation
│   │   ├── ShinyText.jsx         # Gradient shimmer text effect
│   │   ├── LetterGlitch.jsx      # Glitch text animation
│   │   ├── Cursor.jsx            # Custom cursor
│   │   ├── Parallax.jsx          # Parallax scroll effect
│   │   └── HorizontalSlides.jsx  # Horizontal scroll section
│   └── hooks/
│       └── useResponsive.js      # Breakpoint detection hook
├── index.html                    # SEO meta, Open Graph, font preloading
├── vite.config.js
└── package.json
```

---

## Key Features

### Scroll Animation System
The desktop experience uses a **GSAP-powered card-deck stacking animation** where sections peel away to reveal the next. On mobile and short-screen laptops (height < 850px), it gracefully degrades to a standard scroll with reveal animations.

### Responsive Design
Comprehensive breakpoint coverage from **320px to 2560px+**:

| Breakpoint | Target |
|-----------|--------|
| `320px` | Micro mobile (iPhone SE) |
| `360px` | Small mobile |
| `480px` | Standard mobile |
| `640px` | Large mobile / small tablet |
| `768px` | Tablet |
| `1024px` | Tablet / small laptop |
| `1100px` | Narrow desktop |
| `1280px` | Small laptop (13") |
| `1366px` | Common Windows laptop |
| `1440px` | Medium laptop |
| `1920px` | Full HD desktop |
| `2560px` | Ultrawide monitors |

**Height-based breakpoints** for short-screen laptops:
- `(min-width: 1025px) and (max-height: 850px)` — Disables card-deck, shows static layout
- `(min-width: 1025px) and (max-height: 900px)` — Compacts all section density

**CSS Container Queries** for component-level responsiveness on grids (advantage cards, uptime blocks, FleetOS features, industry cards, contact form).

### Image Optimization
- All images converted to **WebP** (25–90% file size reduction)
- Responsive variants at **640w** and **1024w** via `<picture>` + `srcset`
- Original JPG/PNG preserved as fallbacks
- `ResponsiveImage` component handles format selection automatically

### Accessibility
- `font-size: 100%` on `html` (WCAG 1.4.4 compliant)
- Dynamic viewport units (`100dvh`, `100svh`) for mobile address bar handling
- Safe-area insets for notched devices
- `prefers-reduced-motion` support — disables all animations
- Skip-nav and ARIA attributes
- Semantic heading hierarchy

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/phoenixrana/zerodawn.git
cd zerodawn
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview    # Preview the production build locally
```

### Deploy

```bash
npx vercel --prod
```

---

## Image Processing

To convert new images to WebP with responsive variants:

```bash
# Install cwebp (macOS)
brew install webp

# Convert a new image
cwebp -q 80 public/images/new-image.jpg -o public/images/new-image.webp
cwebp -q 80 -resize 640 0 public/images/new-image.jpg -o public/images/responsive/new-image-640w.webp
cwebp -q 80 -resize 1024 0 public/images/new-image.jpg -o public/images/responsive/new-image-1024w.webp
```

Then use `<ResponsiveImage src="/images/new-image.jpg" />` in JSX — it auto-detects and serves WebP variants.

---

## Environment

No environment variables required. The site is fully static with no backend dependencies.

---

## Deployment

The site is deployed on **Vercel** and serves at:
- **Production:** [hyscend.com](https://hyscend.com)
- **www redirect:** [www.hyscend.com](https://www.hyscend.com)

---

## License

Proprietary. All rights reserved by Zero Dawn Technologies.
