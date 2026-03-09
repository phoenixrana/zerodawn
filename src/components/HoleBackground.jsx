import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

export default function HoleBackground({
  strokeColor = '#00C8F8',
  numberOfLines = 50,
  numberOfDiscs = 50,
  particleRGBColor = [0, 200, 248],
  className = '',
  children,
  style,
  ...props
}) {
  const canvasRef = useRef(null)
  const animationFrameIdRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const stateRef = useRef({
    discs: [],
    lines: [],
    particles: [],
    clip: {},
    startDisc: {},
    endDisc: {},
    rect: { width: 0, height: 0 },
    render: { width: 0, height: 0, dpi: 1 },
    particleArea: {},
    linesCanvas: null,
  })

  const linear = (p) => p
  const easeInExpo = (p) => (p === 0 ? 0 : Math.pow(2, 10 * (p - 1)))

  const tweenValue = useCallback(
    (start, end, p, ease = null) => {
      const delta = end - start
      const easeFn = ease === 'inExpo' ? easeInExpo : linear
      return start + delta * easeFn(p)
    },
    [],
  )

  const tweenDisc = useCallback(
    (disc) => {
      const { startDisc, endDisc } = stateRef.current
      disc.x = tweenValue(startDisc.x, endDisc.x, disc.p)
      disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, 'inExpo')
      disc.w = tweenValue(startDisc.w, endDisc.w, disc.p)
      disc.h = tweenValue(startDisc.h, endDisc.h, disc.p)
    },
    [tweenValue],
  )

  const setSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    stateRef.current.rect = { width: rect.width, height: rect.height }
    stateRef.current.render = {
      width: rect.width,
      height: rect.height,
      dpi: window.devicePixelRatio || 1,
    }
    canvas.width = stateRef.current.render.width * stateRef.current.render.dpi
    canvas.height = stateRef.current.render.height * stateRef.current.render.dpi
  }, [])

  const setDiscs = useCallback(() => {
    const { width, height } = stateRef.current.rect
    stateRef.current.discs = []
    stateRef.current.startDisc = {
      x: width * 0.5,
      y: height * 0.45,
      w: width * 0.75,
      h: height * 0.7,
    }
    stateRef.current.endDisc = {
      x: width * 0.5,
      y: height * 0.95,
      w: 0,
      h: 0,
    }
    let prevBottom = height
    stateRef.current.clip = {}
    for (let i = 0; i < numberOfDiscs; i++) {
      const p = i / numberOfDiscs
      const disc = { p, x: 0, y: 0, w: 0, h: 0 }
      tweenDisc(disc)
      const bottom = disc.y + disc.h
      if (bottom <= prevBottom) {
        stateRef.current.clip = { disc: { ...disc }, i }
      }
      prevBottom = bottom
      stateRef.current.discs.push(disc)
    }
    const clipPath = new Path2D()
    const disc = stateRef.current.clip.disc
    clipPath.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2)
    clipPath.rect(disc.x - disc.w, 0, disc.w * 2, disc.y)
    stateRef.current.clip.path = clipPath
  }, [numberOfDiscs, tweenDisc])

  const setLines = useCallback(() => {
    const { width, height } = stateRef.current.rect
    stateRef.current.lines = []
    const linesAngle = (Math.PI * 2) / numberOfLines
    for (let i = 0; i < numberOfLines; i++) {
      stateRef.current.lines.push([])
    }
    stateRef.current.discs.forEach((disc) => {
      for (let i = 0; i < numberOfLines; i++) {
        const angle = i * linesAngle
        const p = {
          x: disc.x + Math.cos(angle) * disc.w,
          y: disc.y + Math.sin(angle) * disc.h,
        }
        stateRef.current.lines[i].push(p)
      }
    })
    const offCanvas = document.createElement('canvas')
    offCanvas.width = width
    offCanvas.height = height
    const ctx = offCanvas.getContext('2d')
    if (!ctx) return
    stateRef.current.lines.forEach((line) => {
      ctx.save()
      let lineIsIn = false
      line.forEach((p1, j) => {
        if (j === 0) return
        const p0 = line[j - 1]
        if (
          !lineIsIn &&
          (ctx.isPointInPath(stateRef.current.clip.path, p1.x, p1.y) ||
            ctx.isPointInStroke(stateRef.current.clip.path, p1.x, p1.y))
        ) {
          lineIsIn = true
        } else if (lineIsIn) {
          ctx.clip(stateRef.current.clip.path)
        }
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.closePath()
      })
      ctx.restore()
    })
    stateRef.current.linesCanvas = offCanvas
  }, [numberOfLines, strokeColor])

  const initParticle = useCallback(
    (start = false) => {
      const sx =
        stateRef.current.particleArea.sx +
        stateRef.current.particleArea.sw * Math.random()
      const ex =
        stateRef.current.particleArea.ex +
        stateRef.current.particleArea.ew * Math.random()
      const dx = ex - sx
      const y = start
        ? stateRef.current.particleArea.h * Math.random()
        : stateRef.current.particleArea.h
      const r = 0.5 + Math.random() * 4
      const vy = 1.2 + Math.random() * 1.5
      return {
        x: sx,
        sx,
        dx,
        y,
        vy,
        p: 0,
        r,
        c: `rgba(${particleRGBColor[0]}, ${particleRGBColor[1]}, ${particleRGBColor[2]}, ${Math.random()})`,
      }
    },
    [particleRGBColor],
  )

  const setParticles = useCallback(() => {
    const { width, height } = stateRef.current.rect
    stateRef.current.particles = []
    const disc = stateRef.current.clip.disc
    stateRef.current.particleArea = {
      sw: disc.w * 0.5,
      ew: disc.w * 2,
      h: height * 0.85,
    }
    stateRef.current.particleArea.sx =
      (width - stateRef.current.particleArea.sw) / 2
    stateRef.current.particleArea.ex =
      (width - stateRef.current.particleArea.ew) / 2
    const totalParticles = 50
    for (let i = 0; i < totalParticles; i++) {
      stateRef.current.particles.push(initParticle(true))
    }
  }, [initParticle])

  const drawDiscs = useCallback(
    (ctx) => {
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      const outerDisc = stateRef.current.startDisc
      ctx.beginPath()
      ctx.ellipse(outerDisc.x, outerDisc.y, outerDisc.w, outerDisc.h, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.closePath()
      stateRef.current.discs.forEach((disc, i) => {
        if (i % 5 !== 0) return
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.save()
          ctx.clip(stateRef.current.clip.path)
        }
        ctx.beginPath()
        ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.closePath()
        if (disc.w < stateRef.current.clip.disc.w - 5) {
          ctx.restore()
        }
      })
    },
    [strokeColor],
  )

  const drawLines = useCallback((ctx) => {
    if (stateRef.current.linesCanvas) {
      ctx.drawImage(stateRef.current.linesCanvas, 0, 0)
    }
  }, [])

  const drawParticles = useCallback((ctx) => {
    ctx.save()
    ctx.clip(stateRef.current.clip.path)
    stateRef.current.particles.forEach((particle) => {
      ctx.fillStyle = particle.c
      ctx.beginPath()
      ctx.rect(particle.x, particle.y, particle.r, particle.r)
      ctx.closePath()
      ctx.fill()
    })
    ctx.restore()
  }, [])

  const moveDiscs = useCallback(() => {
    stateRef.current.discs.forEach((disc) => {
      disc.p = (disc.p + 0.003) % 1
      tweenDisc(disc)
    })
  }, [tweenDisc])

  const moveParticles = useCallback(() => {
    stateRef.current.particles.forEach((particle, idx) => {
      particle.p = 1 - particle.y / stateRef.current.particleArea.h
      particle.x = particle.sx + particle.dx * particle.p
      particle.y -= particle.vy
      if (particle.y < 0) {
        stateRef.current.particles[idx] = initParticle()
      }
    })
  }, [initParticle])

  const tick = useCallback((timestamp) => {
    animationFrameIdRef.current = requestAnimationFrame(tick)
    // Throttle to ~30fps (33ms interval)
    if (timestamp - lastFrameTimeRef.current < 33) return
    lastFrameTimeRef.current = timestamp

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(stateRef.current.render.dpi, stateRef.current.render.dpi)
    moveDiscs()
    moveParticles()
    drawDiscs(ctx)
    drawLines(ctx)
    drawParticles(ctx)
    ctx.restore()
  }, [moveDiscs, moveParticles, drawDiscs, drawLines, drawParticles])

  const init = useCallback(() => {
    setSize()
    setDiscs()
    setLines()
    setParticles()
  }, [setSize, setDiscs, setLines, setParticles])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    init()
    tick()
    const handleResize = () => {
      setSize()
      setDiscs()
      setLines()
      setParticles()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameIdRef.current)
    }
  }, [init, tick, setSize, setDiscs, setLines, setParticles])

  return (
    <div
      className={`hole-bg ${className}`}
      style={style}
      {...props}
    >
      {children}
      <canvas
        ref={canvasRef}
        className="hole-bg-canvas"
      />
      <div className="hole-bg-glow" />
      <div className="hole-bg-scanlines" />
    </div>
  )
}
