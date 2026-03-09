# Mobile Responsive Best Practices 2025-2026: Complete Research

> Research compiled March 2026. Focused on practical, implementable techniques for a React + Vite + GSAP stack.

---

## Table of Contents

1. [CSS Techniques](#1-modern-css-techniques)
2. [Mobile-First vs Desktop-First](#2-mobile-first-vs-desktop-first)
3. [Breakpoint Strategies](#3-breakpoint-strategies)
4. [Typography](#4-fluid-typography)
5. [Images & Media](#5-images--media)
6. [Touch Targets](#6-touch-targets)
7. [Performance on Mobile](#7-performance-on-mobile)
8. [Navigation Patterns](#8-navigation-patterns)
9. [GSAP/ScrollTrigger on Mobile](#9-gsapscrolltrigger-on-mobile)
10. [Testing Tools](#10-testing-tools)

---

## 1. Modern CSS Techniques

### Container Queries (93.92% browser support as of Dec 2025)

Container queries are the single biggest CSS advancement in a decade. They let components respond to their parent container's size rather than the viewport, making components truly reusable.

**When to use what:**
- **Media queries** -> page-level layout changes
- **Container queries** -> component-level responsiveness

```css
/* Define a containment context */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Component adapts to its container, not the viewport */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
  }
}

@container card (min-width: 700px) {
  .card {
    grid-template-columns: 300px 1fr;
  }
  .card__title {
    font-size: 1.5rem;
  }
}
```

**Sidebar example - show/hide labels based on available space:**

```css
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

.sidebar__label {
  display: none;
}

@container sidebar (min-width: 10rem) {
  .sidebar__label {
    display: inline;
  }
}
```

### Container Query Units

Use `cqi` (container query inline) for sizing relative to the container instead of the viewport:

```css
.card-wrapper {
  container-type: inline-size;
}

.card__title {
  font-size: clamp(1rem, 3cqi, 1.5rem);
}
```

### Dynamic Viewport Units (dvh, svh, lvh)

Solve the mobile address bar problem where `100vh` is wrong on mobile browsers:

```css
/* Old - broken on mobile (doesn't account for browser chrome) */
.hero { height: 100vh; }

/* New - accounts for dynamic browser UI */
.hero { height: 100dvh; }   /* dynamic: updates as browser chrome shows/hides */
.hero { height: 100svh; }   /* small: viewport when browser chrome is visible */
.hero { height: 100lvh; }   /* large: viewport when browser chrome is hidden */

/* Safe fallback pattern */
.hero {
  height: 100vh;             /* fallback */
  height: 100dvh;            /* override for supporting browsers */
}
```

### CSS :has() Selector

Style parent elements based on their children - eliminates many JS-driven class toggles:

```css
/* Style a form group when its input is focused */
.form-group:has(input:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

/* Change card layout when it contains an image */
.card:has(img) {
  grid-template-rows: 200px 1fr;
}

/* Hide placeholder when sibling has content */
.wrapper:has(.content:not(:empty)) .placeholder {
  display: none;
}

/* Cautious approach with @supports */
@supports selector(:has(*)) {
  /* :has() styles here */
}
```

### CSS Subgrid (all major browsers as of 2025)

Lets child grids inherit parent grid tracks for perfect alignment:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid;  /* inherits parent row tracks */
  grid-row: span 3;             /* card spans 3 rows: image, title, description */
}
```

### Logical Properties

Use for internationalization-ready and flexible layouts:

```css
/* Instead of: */
.element {
  margin-left: 1rem;
  margin-right: 1rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #ccc;
}

/* Use logical properties: */
.element {
  margin-inline: 1rem;         /* start + end in inline direction */
  padding-block: 2rem;         /* start + end in block direction */
  border-block-end: 1px solid #ccc;
}
```

### Scroll Snap

For carousels and horizontal scrolling sections without JS:

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: 1rem;
  padding: 1rem;
}

.carousel__item {
  scroll-snap-align: center;
  flex: 0 0 85%;              /* show partial next card */
  min-width: 0;
}

@media (min-width: 768px) {
  .carousel__item {
    flex: 0 0 45%;
  }
}
```

### Intrinsic Layouts Without Media Queries

```css
/* Auto-responsive grid - no media queries needed */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1.5rem;
}

/* Flexbox wrapping pattern */
.flex-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-responsive > * {
  flex: 1 1 300px;            /* grows/shrinks, wraps at 300px */
}
```

### CSS Math Functions Combination

```css
.section {
  /* Fluid padding: min 1rem, max 4rem, scales with viewport */
  padding: clamp(1rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
}

.container {
  /* Responsive max-width with min() */
  width: min(90%, 1200px);
  margin-inline: auto;
}

.gap {
  /* Dynamic gap */
  gap: clamp(0.5rem, 2vw, 2rem);
}
```

---

## 2. Mobile-First vs Desktop-First

### Industry Consensus (2025-2026)

**Mobile-first is the clear standard.** Key data points:

- Mobile devices account for over 62% of webpage views worldwide (Jan 2025)
- Google fully rolled out mobile-first indexing in 2023 - your mobile version IS your primary version for ranking
- Mobile-first sites achieve 15-25% higher mobile conversion rates vs desktop-first responsive designs

### Practical Approach: Hybrid

The modern consensus from Ahmad Shadeed and others is a **hybrid approach**:

```css
/* BASE STYLES: Write for mobile first (no media query) */
.section {
  padding: 2rem 1rem;
}

/* ENHANCE for larger screens with min-width */
@media (min-width: 62.5rem) {
  .section {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 4rem 2rem;
  }
}

/* USE max-width ONLY for mobile-specific overrides */
@media (max-width: 61.9375rem) {
  .nav {
    position: fixed;
    inset: 0;
    /* mobile-specific nav styling */
  }
}
```

### The Bigger Picture: Media-Query-Less CSS

Modern CSS reduces dependence on either approach:

```css
/* This card layout is responsive WITHOUT any media queries */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

.card__title {
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
}

.card__body {
  padding: clamp(1rem, 3vw, 2rem);
}
```

**Rule of thumb:** Use intrinsic/fluid CSS for simple adaptations. Reserve media queries for genuinely different layouts (e.g., mobile nav vs desktop nav).

---

## 3. Breakpoint Strategies

### 2025 Consensus: Content-Based > Device-Based

Fixed device breakpoints are falling out of favor. The recommended approach:

1. **Use fluid/intrinsic CSS** to handle most responsive needs without breakpoints
2. **Set breakpoints where your content breaks**, not at device widths
3. **Use container queries** for component-level responsiveness

### Common Breakpoint Values (when you need them)

**Tailwind CSS v4 defaults (Jan 2025):**

```css
/* Tailwind v4 - CSS-first configuration */
@theme {
  --breakpoint-sm: 40rem;    /* 640px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: 96rem;   /* 1536px */
}
```

**Practical custom breakpoints using rem (recommended):**

```css
:root {
  /* Define your breakpoints as custom properties for documentation */
  --bp-sm: 30rem;     /* 480px  - large phones landscape */
  --bp-md: 48rem;     /* 768px  - tablets */
  --bp-lg: 64rem;     /* 1024px - small laptops */
  --bp-xl: 80rem;     /* 1280px - desktops */
  --bp-2xl: 90rem;    /* 1440px - large desktops */
}

/* Use rem in media queries for accessibility (respects user font size) */
@media (min-width: 48rem) { /* tablet+ */ }
@media (min-width: 64rem) { /* laptop+ */ }
```

### Container Query Breakpoints

For components, use smaller container-based breakpoints:

```css
.component-wrapper {
  container-type: inline-size;
}

/* Container breakpoints are typically smaller than viewport ones */
@container (min-width: 20rem)  { /* ~320px - compact */ }
@container (min-width: 30rem)  { /* ~480px - medium */ }
@container (min-width: 45rem)  { /* ~720px - wide */ }
```

### Avoiding Breakpoint Gaps

```css
/* BAD - gap at exactly 500px */
@media (max-width: 500px) { ... }
@media (min-width: 500px) { ... }

/* GOOD - no gap */
@media (max-width: 499px) { ... }
@media (min-width: 500px) { ... }

/* BEST - use only min-width (mobile-first) */
/* Base styles for mobile */
@media (min-width: 500px) { /* tablet+ overrides */ }
```

---

## 4. Fluid Typography

### The clamp() Gold Standard

```css
/* FORMULA: clamp(min, preferred, max) */
/* preferred = base + viewport-scaling-factor */

:root {
  /* Base font size - accessible fluid scaling */
  font-size: clamp(1em, 16px + 0.25vw, 1.25em);
}

/* Heading scale */
h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 4rem); }
h2 { font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem); }
h4 { font-size: clamp(1.125rem, 1rem + 0.5vw, 1.35rem); }

/* Body text */
body { font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); }

/* Small text */
.small { font-size: clamp(0.875rem, 0.85rem + 0.125vw, 1rem); }
```

### Modular Scale with CSS pow() (new in 2025)

```css
:root {
  --scale: 1.2;  /* minor third */

  --text-xs:  calc(1rem * pow(var(--scale), -0.5));
  --text-sm:  calc(1rem * pow(var(--scale), -0.25));
  --text-base: 1rem;
  --text-lg:  calc(1rem * pow(var(--scale), 1));
  --text-xl:  calc(1rem * pow(var(--scale), 2));
  --text-2xl: calc(1rem * pow(var(--scale), 3));
  --text-3xl: calc(1rem * pow(var(--scale), 4));
}

/* Increase scale ratio on larger screens */
@media (min-width: 50rem) {
  :root { --scale: 1.333; }  /* perfect fourth */
}
```

### Fluid Scale with Custom Properties and Breakpoints

```css
html {
  --base-font-size: 16px;
  font-size: clamp(1em, var(--base-font-size), 1.25em);
}

@media (width > 30em) {
  html { --base-font-size: 18px; }
}

@media (width > 45em) {
  html { --base-font-size: 20px; }
}
```

### WCAG Compliance Rules

- Always use `rem` or `em` for min/max bounds (not just `px`) so users can scale
- Max font size should be no more than 2.5x the minimum
- Test at 200% zoom (WCAG 1.4.4 requirement)
- The pattern `clamp(1em, Xpx + Yvw, Z em)` allows user scaling in both directions

### Line Length for Readability

```css
.prose {
  max-width: 65ch;            /* optimal line length */
  line-height: 1.6;           /* comfortable reading */
}

/* Tighter line-height for headings */
h1, h2, h3 {
  line-height: 1.1;
}
```

---

## 5. Images & Media

### Modern Format Strategy

**Priority order:** AVIF > WebP > JPEG/PNG

- AVIF: 50% smaller than JPEG at same quality
- WebP lossy: 25-34% smaller than JPEG
- WebP lossless: 26% smaller than PNG
- Combined strategies can reduce image payload by 50-80%

### The picture Element (Art Direction + Format)

```html
<picture>
  <!-- AVIF first (best compression) -->
  <source
    type="image/avif"
    srcset="hero-400.avif 400w, hero-800.avif 800w, hero-1200.avif 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
  />
  <!-- WebP fallback -->
  <source
    type="image/webp"
    srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
  />
  <!-- JPEG ultimate fallback -->
  <img
    src="hero-800.jpg"
    srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
    alt="Hero image description"
    width="1200"
    height="675"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Art Direction (Different Crops per Viewport)

```html
<picture>
  <!-- Mobile: square crop -->
  <source media="(max-width: 767px)" srcset="hero-mobile.avif" type="image/avif" />
  <source media="(max-width: 767px)" srcset="hero-mobile.webp" type="image/webp" />
  <!-- Desktop: wide crop -->
  <source media="(min-width: 768px)" srcset="hero-desktop.avif" type="image/avif" />
  <source media="(min-width: 768px)" srcset="hero-desktop.webp" type="image/webp" />
  <img src="hero-desktop.jpg" alt="Hero" width="1200" height="675" />
</picture>
```

### Lazy Loading Best Practices

```html
<!-- ABOVE THE FOLD: eager load + high priority -->
<img
  src="hero.webp"
  fetchpriority="high"
  loading="eager"
  decoding="async"
  alt="Hero"
  width="1200"
  height="675"
/>

<!-- BELOW THE FOLD: lazy load -->
<img
  src="feature.webp"
  loading="lazy"
  decoding="async"
  alt="Feature"
  width="600"
  height="400"
/>
```

### Preventing Layout Shift with aspect-ratio

```css
/* Modern approach */
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Explicit aspect ratio for containers */
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}

/* Image with known aspect ratio */
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  object-fit: cover;
}

/* Square thumbnails */
.thumbnail {
  aspect-ratio: 1;
  object-fit: cover;
}
```

### Vite-Specific Image Optimization

For your React + Vite stack, use `vite-plugin-image-optimizer` or `@squoosh/lib`:

```javascript
// vite.config.js
import { imageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    imageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 65 },
    }),
  ],
});
```

---

## 6. Touch Targets

### Guidelines Summary

| Standard | Minimum Size | Level |
|---|---|---|
| WCAG 2.5.8 (AA) | 24 x 24 CSS px | Minimum / required |
| WCAG 2.5.5 (AAA) | 44 x 44 CSS px | Enhanced / recommended |
| Apple HIG (iOS) | 44 x 44 pt (59px) | Recommended |
| Material Design 3 | 48 x 48 dp | Recommended |
| Microsoft Fluent | 40 x 40 epx | Recommended |

### Practical Recommendation

**Target 48x48px minimum for all interactive elements.** This satisfies Material Design, is close to Apple's recommendation, and exceeds WCAG AA.

### CSS Implementation

```css
/* Base interactive element sizing */
button, a, [role="button"], input, select, textarea {
  min-height: 48px;
  min-width: 48px;
}

/* For icon buttons - expand tap area with padding */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  padding: 12px;              /* expand clickable area around icon */
}

/* For inline links - increase line-height for vertical tap area */
.prose a {
  padding-block: 4px;
  margin-block: -4px;         /* compensate to avoid layout shift */
}

/* Ensure spacing between adjacent targets */
.button-group {
  display: flex;
  gap: 8px;                   /* minimum 8px between adjacent targets */
}

/* Navigation items */
.nav-item {
  min-height: 48px;
  display: flex;
  align-items: center;
  padding-inline: 16px;
}

/* Mobile-specific: full-width buttons */
@media (max-width: 48rem) {
  .cta-button {
    width: 100%;
    min-height: 52px;
    font-size: 1rem;
  }
}
```

### Position-Based Sizing (Research-Backed)

Steven Hoober's research shows different zones need different sizes:

```css
/* Bottom of screen (harder to reach precisely) = larger targets */
.bottom-nav__item {
  min-height: 52px;            /* ~12mm */
  padding: 8px 16px;
}

/* Center of screen = standard targets */
.content-action {
  min-height: 44px;            /* ~10mm */
}

/* Top of screen = slightly larger */
.top-nav__item {
  min-height: 48px;            /* ~11mm */
}
```

---

## 7. Performance on Mobile

### Core Web Vitals Targets (2025-2026)

| Metric | Good | Description |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Loading performance |
| INP (Interaction to Next Paint) | < 200ms | Responsiveness |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |

**Current state:** Only 48% of mobile pages pass all three CWVs. LCP is the hardest - only 62% of mobile pages pass.

### Critical CSS Strategy

```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Only above-the-fold styles here */
  *,*::before,*::after{box-sizing:border-box;margin:0}
  body{font-family:system-ui,sans-serif;line-height:1.6}
  .hero{height:100dvh;display:grid;place-items:center}
  /* ... minimal critical styles ... */
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="/styles/main.css" /></noscript>
```

For Vite, use `vite-plugin-critical` or `critters` for automatic critical CSS extraction.

### Font Loading Strategy

```css
/* 1. Use font-display: swap for visible text immediately */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  /* 2. Subset to needed characters via unicode-range */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
}
```

```html
<!-- 3. Preconnect to font origin -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

<!-- 4. Preload critical font files -->
<link rel="preload" href="/fonts/custom-regular.woff2" as="font" type="font/woff2" crossorigin />
```

**Key font rules:**
- Use WOFF2 only (30% better compression, universal support)
- Subset fonts to reduce size by up to 70%
- Limit to 2-3 font files maximum
- Use `font-display: swap` (or `optional` for non-essential fonts)
- Use `size-adjust`, `ascent-override`, `descent-override` to match fallback metrics and prevent CLS

### Preventing CLS

```css
/* Always set explicit dimensions on media */
img, video, iframe {
  max-width: 100%;
  height: auto;
}

/* Use aspect-ratio for unknown-dimension containers */
.video-embed {
  aspect-ratio: 16 / 9;
}

/* Reserve space for dynamic content */
.ad-slot {
  min-height: 250px;
}

/* Font metric overrides to prevent CLS on font swap */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 20%;
  line-gap-override: 0%;
}
```

### LCP Optimization

```html
<!-- Preload LCP image -->
<link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high" />

<!-- Hero image with fetchpriority -->
<img src="/hero.avif" fetchpriority="high" loading="eager" alt="Hero" width="1200" height="675" />
```

**LCP checklist:**
- Preload LCP image with `fetchpriority="high"`
- Inline critical CSS (remove render-blocking stylesheets)
- Use modern formats (AVIF/WebP)
- Serve properly sized images (not oversized)
- Use a CDN for static assets

### INP Optimization

```javascript
// Break up long tasks
function processLargeList(items) {
  const chunk = 50;
  let i = 0;

  function processChunk() {
    const end = Math.min(i + chunk, items.length);
    for (; i < end; i++) {
      processItem(items[i]);
    }
    if (i < items.length) {
      // Yield to main thread
      setTimeout(processChunk, 0);
    }
  }

  processChunk();
}

// Use content-visibility for off-screen content
```

```css
/* content-visibility: auto for off-screen rendering optimization */
.section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;  /* estimated height */
}
```

---

## 8. Navigation Patterns

### 2025-2026 Recommendations

**Bottom Navigation Bar** is the current gold standard for mobile, placing primary nav within thumb reach. Best for 3-5 main sections.

**Hamburger Menu** is not dead but evolved - use it for secondary/overflow navigation, not primary. Key: make it discoverable and never hide critical functionality behind it.

**Hybrid Approach (recommended):**
- Bottom tab bar for primary sections (3-5 items)
- Hamburger/slide-out for secondary navigation
- Gesture support as enhancement (not sole method)

### Implementation Pattern for React

```css
/* Bottom navigation bar */
.bottom-nav {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  justify-content: space-around;
  align-items: center;
  min-height: 56px;
  padding-bottom: env(safe-area-inset-bottom);  /* iPhone notch/home indicator */
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 48px;
  min-height: 48px;
  padding: 8px 12px;
  font-size: 0.75rem;
  text-decoration: none;
  color: var(--text-secondary);
}

.bottom-nav__item--active {
  color: var(--color-primary);
}

/* Only show bottom nav on mobile */
@media (min-width: 64rem) {
  .bottom-nav { display: none; }
}

/* Account for bottom nav in page content */
@media (max-width: 63.9375rem) {
  main {
    padding-bottom: calc(56px + env(safe-area-inset-bottom));
  }
}
```

### Safe Area Handling (notch devices)

```css
/* Viewport meta tag required: */
/* <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /> */

body {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Mobile Menu Animation Pattern

```css
.mobile-menu {
  position: fixed;
  inset: 0;
  background: var(--surface);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-menu[data-open="true"] {
  transform: translateX(0);
}

/* Overlay */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 199;
}

.mobile-menu-overlay[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}
```

---

## 9. GSAP/ScrollTrigger on Mobile

### Core Principles

1. **Test on real mobile devices first** - emulators lie about performance
2. **Use GPU-accelerated properties only**: `x`, `y`, `rotation`, `scale`, `opacity` (NOT `left`, `top`, `width`, `height`)
3. **Use `gsap.matchMedia()`** to conditionally run animations per viewport
4. **Always respect `prefers-reduced-motion`**
5. **Clean up with `useGSAP`** in React

### gsap.matchMedia() - The Key API

```javascript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function AnimatedSection() {
  const container = useRef();

  useGSAP(() => {
    const mm = gsap.matchMedia();
    const breakPoint = 800;

    mm.add(
      {
        // Define conditions
        isDesktop: `(min-width: ${breakPoint}px)`,
        isMobile: `(max-width: ${breakPoint - 1}px)`,
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, isMobile, reduceMotion } = context.conditions;

        // Skip ALL animations if user prefers reduced motion
        if (reduceMotion) {
          // Set final states instantly, no animation
          gsap.set('.animate-item', { opacity: 1, y: 0 });
          return;
        }

        if (isDesktop) {
          // Full desktop animations
          gsap.from('.animate-item', {
            y: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '.animate-section',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          });
        }

        if (isMobile) {
          // Simplified mobile animations (shorter, less movement)
          gsap.from('.animate-item', {
            y: 30,            // less movement on mobile
            opacity: 0,
            duration: 0.6,     // shorter duration
            stagger: 0.1,
            scrollTrigger: {
              trigger: '.animate-section',
              start: 'top 90%',
              toggleActions: 'play none none none',  // no reverse on mobile
            },
          });
        }

        // Optional cleanup (runs when conditions change)
        return () => {
          // Custom cleanup if needed
        };
      }
    );
  }, { scope: container });

  return (
    <div ref={container}>
      <section className="animate-section">
        <div className="animate-item">Content 1</div>
        <div className="animate-item">Content 2</div>
      </section>
    </div>
  );
}
```

### useGSAP Hook - React Cleanup Pattern

```javascript
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function Component() {
  const container = useRef();

  // useGSAP automatically cleans up ALL GSAP animations and ScrollTriggers
  // created inside this callback when the component unmounts
  useGSAP(() => {
    gsap.to('.box', {
      x: 200,
      scrollTrigger: {
        trigger: '.box',
        start: 'top center',
        scrub: true,
      },
    });
  }, { scope: container }); // scope = selector text is scoped to this ref

  // For event handlers, use contextSafe
  const { contextSafe } = useGSAP({ scope: container });

  const handleClick = contextSafe(() => {
    gsap.to('.box', { rotation: 360 });
  });

  return (
    <div ref={container}>
      <div className="box" onClick={handleClick}>Animated</div>
    </div>
  );
}
```

### Mobile Performance Rules for GSAP

```javascript
// 1. Only animate transform and opacity (GPU-composited)
// GOOD:
gsap.to(el, { x: 100, y: 50, scale: 1.2, rotation: 45, opacity: 0.5 });

// BAD (causes reflow/repaint):
gsap.to(el, { left: 100, top: 50, width: '200px', height: '200px', borderRadius: '50%' });

// 2. Use will-change sparingly and remove after animation
gsap.to(el, {
  x: 100,
  onStart: () => { el.style.willChange = 'transform'; },
  onComplete: () => { el.style.willChange = 'auto'; },
});

// 3. Disable scrub-heavy animations on mobile
const mm = gsap.matchMedia();
mm.add('(min-width: 768px)', () => {
  // Parallax only on desktop
  gsap.to('.parallax-bg', {
    yPercent: -30,
    scrollTrigger: {
      trigger: '.parallax-section',
      scrub: true,
    },
  });
});

// 4. Use ScrollTrigger.config for mobile optimization
ScrollTrigger.config({
  ignoreMobileResize: true,   // prevents recalculation on mobile address bar changes
});

// 5. Batch ScrollTrigger refreshes
ScrollTrigger.addEventListener('refreshInit', () => {
  // batched refresh logic
});
```

### When to Disable/Simplify Animations on Mobile

| Animation Type | Desktop | Mobile |
|---|---|---|
| Parallax scrolling | Full scrub | Disable or very subtle |
| Horizontal scroll sections | Full experience | Consider disabling |
| Complex SVG morphs | Full | Simplify or skip |
| Simple fade-in on scroll | Full | Keep (shorter duration) |
| Hover effects | Full | Convert to tap/focus |
| Page transitions | Full | Keep (simplified) |
| Particle effects | Full | Disable |
| Scrub-based transforms | Full | Disable or reduce |

### CSS prefers-reduced-motion Fallback

```css
/* Always provide CSS-level reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 10. Testing Tools

### Tier 1: Essential (Free)

**Chrome DevTools Device Mode**
- Built-in viewport simulation, touch emulation, throttling
- Limitations: uses desktop rendering engine, not true mobile
- Best for: quick layout checks, debugging, performance auditing

**Lighthouse (in DevTools)**
- Audits performance, accessibility, best practices, SEO
- Mobile simulation built in
- Run on every build

### Tier 2: Enhanced Testing

**Responsive Viewer** (Chrome Extension)
- View multiple device viewports simultaneously in one window
- Free, 100k+ users

**Phone Simulator** (Chrome Extension)
- Accurate device frames with 2025 device models (6.3", 6.9" screens)
- Instant orientation switching
- More accurate than raw DevTools resizing

**Polypane** (paid)
- Purpose-built responsive design browser
- Multiple synced viewports, accessibility tools, layout debugging
- Best for professional responsive development

### Tier 3: Real Device Testing

**BrowserStack**
- 1000+ real mobile browsers and devices
- Cloud-based, no physical devices needed
- Essential for final QA

**Real devices** (at minimum, test on):
- iPhone (latest + iPhone SE for small screens)
- Android mid-range device (Samsung Galaxy A series)
- iPad / Android tablet

### Tier 4: Automated Testing

```javascript
// Playwright for automated responsive testing
import { test, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test('mobile layout renders correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(page.locator('.desktop-nav')).toBeHidden();
});

test.use(devices['iPad Pro 11']);

test('tablet layout works', async ({ page }) => {
  await page.goto('/');
  // assertions...
});
```

### Performance Testing

- **PageSpeed Insights** - real-world CrUX data + Lighthouse
- **WebPageTest** - detailed waterfall analysis, real devices
- **web.dev/measure** - quick Core Web Vitals check
- **Chrome DevTools Performance tab** - frame-by-frame analysis

---

## Quick Reference: The Complete Mobile-Responsive CSS Reset

A modern base stylesheet incorporating all the above principles:

```css
/* === MODERN RESPONSIVE RESET (2025) === */

/* 1. Box sizing */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 2. Fluid root font size */
html {
  font-size: clamp(1em, 16px + 0.25vw, 1.25em);
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

/* 3. Reduced motion */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 4. Body defaults */
body {
  min-height: 100dvh;
  line-height: 1.6;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 5. Responsive media */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 6. Form elements inherit fonts */
input, button, textarea, select {
  font: inherit;
}

/* 7. Touch targets */
button, a, [role="button"], input, select, textarea {
  min-height: 44px;
}

/* 8. Prose readability */
p, li, figcaption {
  max-width: 75ch;
}

h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;          /* prevent orphans in headings */
  line-height: 1.1;
}

p {
  text-wrap: pretty;           /* prevent orphans in paragraphs */
}

/* 9. Safe area padding for notch devices */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* 10. Container query ready utility */
.container-query {
  container-type: inline-size;
}
```

---

## Sources

### CSS Techniques & Container Queries
- [Ahmad Shadeed - Mobile-First vs Desktop-First](https://ishadeed.com/article/the-state-of-mobile-first-and-desktop-first/)
- [Ahmad Shadeed - Interactive Guide to CSS Container Queries](https://ishadeed.com/article/css-container-query-guide/)
- [MDN - CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries)
- [web.dev - Container Queries](https://web.dev/learn/css/container-queries)
- [The State of CSS in 2026 - CoderCops](https://www.codercops.com/blog/state-of-css-2026)
- [Sitepoint - Tailwind CSS v4 Container Queries](https://www.sitepoint.com/tailwind-css-v4-container-queries-modern-layouts/)

### Breakpoints & Frameworks
- [Tailwind Breakpoints Complete Guide](https://tailkits.com/blog/tailwind-breakpoints-complete-guide/)
- [Tailwind CSS v4 Complete Guide](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)
- [LogRocket - CSS Breakpoints for Fluid Layouts](https://blog.logrocket.com/css-breakpoints-responsive-design/)
- [DEV - Responsive Design Breakpoints 2025 Playbook](https://dev.to/gerryleonugroho/responsive-design-breakpoints-2025-playbook-53ih)

### Typography
- [Smashing Magazine - Modern Fluid Typography Using CSS Clamp](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)
- [web.dev - Responsive and Fluid Typography with Baseline CSS](https://web.dev/articles/baseline-in-action-fluid-type)
- [OddBird - Reimagining Fluid Typography](https://www.oddbird.net/2025/02/12/fluid-type/)
- [ModernCSS.dev - Generating Font-Size CSS Rules](https://moderncss.dev/generating-font-size-css-rules-and-creating-a-fluid-type-scale/)

### Images & Media
- [FrontendTools - Image Optimization 2025](https://www.frontendtools.tech/blog/modern-image-optimization-techniques-2025)
- [Request Metrics - Complete 2026 Image Guide](https://requestmetrics.com/web-performance/high-performance-images/)
- [DEV - Responsive Images Best Practices 2025](https://dev.to/razbakov/responsive-images-best-practices-in-2025-4dlb)

### Touch Targets & Accessibility
- [Smashing Magazine - Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [W3C WCAG 2.2 - Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [W3C WCAG 2.5.8 - Target Size Minimum](https://wcag.dock.codes/documentation/wcag258/)
- [LogRocket - All Accessible Touch Target Sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)

### Performance & Core Web Vitals
- [web.dev - CSS for Web Vitals](https://web.dev/articles/css-web-vitals)
- [web.dev - Font Best Practices](https://web.dev/articles/font-best-practices)
- [Core Web Vitals 2025 Complete Guide](https://mobileproxy.space/en/pages/core-web-vitals-2025-the-complete-guide-to-lcp-cls--inp-for-mobile-and-desktop.html)
- [Systems Architect - Core Web Vitals 2025 Stricter Standards](https://systemsarchitect.net/core-web-vitals-2025/)

### Navigation
- [Medium - Complete Guide to Mobile Navigation 2025](https://medium.com/@secuodsoft/the-complete-guide-to-creating-user-friendly-mobile-navigation-in-2025-59c9dd620c1d)
- [DesignStudioUIUX - Mobile Navigation UX 2026](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Acclaim - Hamburger Menus vs Tab Bars](https://acclaim.agency/blog/the-future-of-mobile-navigation-hamburger-menus-vs-tab-bars)

### GSAP/ScrollTrigger
- [GSAP - gsap.matchMedia() Documentation](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- [GSAP - React Integration](https://gsap.com/resources/React/)
- [GSAP Forum - ScrollTrigger Mobile vs Desktop Best Practice](https://gsap.com/community/forums/topic/43145-scrolltrigger-for-mobile-vs-desktop-vs-ultrawide-best-practice/)
- [GSAP Forum - ScrollTrigger Best Practices](https://gsap.com/community/forums/topic/32787-scrolltrigger-best-practices/)
- [GSAP Forum - matchMedia and prefers-reduced-motion](https://gsap.com/community/forums/topic/27141-scrolltriggermatchmedia-and-prefers-reduced-motion/)
- [@gsap/react on npm](https://www.npmjs.com/package/@gsap/react)

### Testing
- [BrowserStack - View Mobile Version on Chrome 2026](https://www.browserstack.com/guide/view-mobile-version-of-website-on-chrome)
- [Responsive Viewer](https://responsiveviewer.org)
- [Phone Simulator](https://phone-simulator.com/)
- [DebugBear - Chrome DevTools Device Mode](https://www.debugbear.com/docs/chrome-devtools-device-mode)
