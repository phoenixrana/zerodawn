/**
 * useResponsive — React hook powered by react-responsive
 *
 * Provides boolean flags for common breakpoints so components can
 * conditionally render or adapt layout at the JS level.
 *
 * Breakpoints mirror the CSS media queries in index.css.
 */

import { useMediaQuery } from 'react-responsive'

export default function useResponsive() {
  const isUltrawide   = useMediaQuery({ minWidth: 2560 })
  const isLargeDesktop = useMediaQuery({ minWidth: 1600 })
  const isDesktop      = useMediaQuery({ minWidth: 1025 })
  const isSmallLaptop  = useMediaQuery({ maxWidth: 1280 })
  const isTablet       = useMediaQuery({ maxWidth: 1024 })
  const isSmallTablet  = useMediaQuery({ maxWidth: 768 })
  const isMobile       = useMediaQuery({ maxWidth: 640 })
  const isSmallMobile  = useMediaQuery({ maxWidth: 480 })
  const isTinyMobile   = useMediaQuery({ maxWidth: 360 })
  const isLandscape    = useMediaQuery({ orientation: 'landscape' })
  const isPortrait     = useMediaQuery({ orientation: 'portrait' })
  const prefersReducedMotion = useMediaQuery({ query: '(prefers-reduced-motion: reduce)' })
  const isTouch        = useMediaQuery({ query: '(hover: none) and (pointer: coarse)' })

  return {
    isUltrawide,
    isLargeDesktop,
    isDesktop,
    isSmallLaptop,
    isTablet,
    isSmallTablet,
    isMobile,
    isSmallMobile,
    isTinyMobile,
    isLandscape,
    isPortrait,
    prefersReducedMotion,
    isTouch,
  }
}
