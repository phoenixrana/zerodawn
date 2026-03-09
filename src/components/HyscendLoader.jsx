import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════
   HYSCEND — Cinematic 5-Act Loader v2
   Acts: Void → Genesis → Ignition → Critical Mass → Launch
   Duration: 3.8s (3.0s on small mobile)
   ══════════════════════════════════════════════════ */

const C = {
  accent: "#00C8F8",
  blue: "#0A84FF",
  blueM: "#4BA0FF",
  teal: "#22D4D0",
  bg: "#060A14",
  light: "#F0F4FA",
  muted: "#6B7D99",
};

const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

/* ── Viewport helper (handles mobile browser chrome) ── */
const getViewport = () => {
  const vv = window.visualViewport;
  return {
    w: vv ? vv.width : window.innerWidth,
    h: vv ? vv.height : window.innerHeight,
  };
};

/* ── Telemetry data (8 curated lines) ── */
const telemetry = [
  { cmd: "SYS::INIT",  msg: "PEM STACK HANDSHAKE",  st: "OK" },
  { cmd: "H2_VALVE",   msg: "SOLENOID_A 350BAR",    st: "NOMINAL" },
  { cmd: "FUEL_CELL",  msg: "MEA TEMP 72.3°C",      st: "NOMINAL" },
  { cmd: "PWR_BUS",    msg: "48.2V OUTPUT",          st: "STABLE" },
  { cmd: "NAV_LOCK",   msg: "GPS ACQUIRED",          st: "LOCK" },
  { cmd: "PREFLIGHT",  msg: "22/22 CHECKS",          st: "PASSED" },
  { cmd: "STATUS",     msg: "ALL SUBSYSTEMS",         st: "GREEN" },
  { cmd: "LAUNCH",     msg: "SEQUENCE",               st: "AUTHORIZED" },
];

/* ── Burst timing schedule (ms offsets from ignition start) ── */
const BURST_SCHEDULE = [
  0, 70, 140,        // lines 0-2: rapid burst
  490, 560, 630,     // lines 3-5: second burst after 350ms pause
  980, 1180,         // lines 6-7: slow finish
];

/* ── Easing helpers ── */
const springEase = (t) => {
  // cubic-bezier(0.34, 1.56, 0.64, 1) approximation
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const p = 1 - t;
  return 1 - p * p * (1 + 1.56 * p - 0.56 * p * p) * (t < 0.5 ? 1 : 1);
};

// Simple spring with overshoot
const spring = (t) => {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -10 * t) * Math.cos(t * Math.PI * 2.5);
};

const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

/* ── Breakpoint logic ── */
const getBreakpoint = (w) => {
  if (w < 480) return "small";
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const getMoleculeSize = (bp) => {
  switch (bp) {
    case "small": return 220;
    case "mobile": return 280;
    case "tablet": return 420;
    default: return 550;
  }
};

const getWordmarkSize = (bp) => {
  switch (bp) {
    case "small": return 15;
    case "mobile": return 18;
    case "tablet": return 22;
    default: return 28;
  }
};

export default function HyscendLoader({ onComplete, hide }) {
  const [bp, setBp] = useState("desktop");
  const [moleculeSize, setMoleculeSize] = useState(550);
  const [wordmarkSize, setWordmarkSize] = useState(28);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const completedRef = useRef(false);

  // Animation state (driven by rAF, stored in refs for perf)
  const [act, setAct] = useState(0); // 0-5
  const [t, setT] = useState(0); // normalized 0→1
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState([]);
  const [phase, setPhase] = useState("");
  const [wordmarkLetters, setWordmarkLetters] = useState(0);
  const [atomSplit, setAtomSplit] = useState(0); // 0→1 spring
  const [innerRingOn, setInnerRingOn] = useState(false);
  const [outerRingOn, setOuterRingOn] = useState(false);
  const [dotVisible, setDotVisible] = useState(false);
  const [orbitActive, setOrbitActive] = useState(false);
  const [coresBright, setCoresBright] = useState(false);
  const [energyArcs, setEnergyArcs] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [moleculeScale, setMoleculeScale] = useState(1);
  const [uiFade, setUiFade] = useState(1);

  const WORD = "HYSCEND";
  const isSmall = bp === "small";

  // Duration depends on breakpoint
  const duration = isSmall ? 3000 : 3800;

  /* ── Responsive sizing ── */
  useEffect(() => {
    let raf;
    const calc = () => {
      const { w } = getViewport();
      const b = getBreakpoint(w);
      setBp(b);
      setMoleculeSize(getMoleculeSize(b));
      setWordmarkSize(getWordmarkSize(b));
    };
    calc();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    window.addEventListener("resize", onResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", onResize);
    };
  }, []);

  /* ── Master animation loop ── */
  useEffect(() => {
    const ignitionStart = isSmall ? 0.26 : 0.342; // When ACT 3 starts
    const burstDuration = isSmall ? 1400 : 1300; // How long telemetry plays
    const lineTimers = [];

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const normalT = Math.min(elapsed / duration, 1);

      setT(normalT);

      // ─── ACT boundaries ───
      // ACT 1: Void       0.000 → 0.105
      // ACT 2: Genesis    0.105 → 0.342
      // ACT 3: Ignition   0.342 → 0.684
      // ACT 4: Critical   0.684 → 0.816
      // ACT 5: Launch     0.816 → 1.000
      const sm = isSmall; // shorter timing for small screens
      const acts = sm
        ? { a1: 0.10, a2: 0.26, a3: 0.55, a4: 0.72, a5: 1.0 }
        : { a1: 0.105, a2: 0.342, a3: 0.684, a4: 0.816, a5: 1.0 };

      let currentAct;
      if (normalT < acts.a1) currentAct = 1;
      else if (normalT < acts.a2) currentAct = 2;
      else if (normalT < acts.a3) currentAct = 3;
      else if (normalT < acts.a4) currentAct = 4;
      else currentAct = 5;
      setAct(currentAct);

      // ── ACT 1: Dot fade in ──
      if (currentAct >= 1) {
        setDotVisible(true);
      }

      // ── ACT 2: Genesis — atom split, rings snap on ──
      if (currentAct >= 2) {
        const genT = clamp01((normalT - acts.a1) / (acts.a2 - acts.a1));
        setAtomSplit(spring(genT));

        // Inner ring snaps on at 30% through genesis
        if (genT > 0.3) setInnerRingOn(true);
        // Outer ring + ticks 200ms later (~50% through)
        if (genT > 0.5) setOuterRingOn(true);
      }

      // ── ACT 3: Ignition — orbits, wordmark, progress, telemetry ──
      if (currentAct >= 3) {
        setOrbitActive(true);
        setCoresBright(true);
        setEnergyArcs(true);

        const igT = clamp01((normalT - acts.a2) / (acts.a3 - acts.a2));

        // Wordmark: staggered letter reveal (40ms/letter = 280ms total)
        const wordmarkDur = 280 / (duration * (acts.a3 - acts.a2));
        const letterProgress = clamp01(igT / wordmarkDur);
        setWordmarkLetters(Math.floor(letterProgress * WORD.length));

        // Progress bar
        setProgress(Math.min(igT * 100, currentAct >= 4 ? 100 : igT * 95));

        // Phase labels
        if (igT < 0.33) setPhase("H₂ CORE ONLINE");
        else if (igT < 0.66) setPhase("SYSTEMS NOMINAL");
        else setPhase("PREFLIGHT COMPLETE");
      }

      // ── ACT 4: Critical mass — hold, pulse ──
      if (currentAct >= 4) {
        setProgress(100);
        setPhase("LAUNCH ── AUTHORIZED");
        setFrozen(true);
        setWordmarkLetters(WORD.length);
      }

      // ── ACT 5: Launch — flash, scale, fade ──
      if (currentAct >= 5 && !completedRef.current) {
        setFrozen(false);
        setLaunching(true);

        const launchT = clamp01((normalT - acts.a4) / (acts.a5 - acts.a4));

        // Flash: 0→0.7 in first 10%, then decay
        if (launchT < 0.07) {
          setFlashOpacity(launchT / 0.07 * 0.7);
        } else {
          setFlashOpacity(0.7 * Math.pow(1 - clamp01((launchT - 0.07) / 0.6), 2));
        }

        // Scale up molecule 1→8
        setMoleculeScale(1 + easeOut(launchT) * 7);

        // UI fade
        setUiFade(Math.max(0, 1 - launchT * 5));

        // Fire onComplete at flash peak so GSAP starts while loader still covers
        if (launchT > 0.15 && !completedRef.current) {
          completedRef.current = true;
          onComplete();
        }

        // Stop animation loop when done
        if (normalT >= 1) return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // ── Telemetry burst scheduling ──
    const ignitionMs = duration * (isSmall ? 0.26 : 0.342);
    const maxLines = isSmall ? 0 : bp === "mobile" ? 6 : 8;

    if (maxLines > 0) {
      BURST_SCHEDULE.slice(0, maxLines).forEach((offset, i) => {
        const timer = setTimeout(() => {
          setVisibleLines((prev) => [...prev, telemetry[i]]);
        }, ignitionMs + offset);
        lineTimers.push(timer);
      });
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      lineTimers.forEach(clearTimeout);
    };
  }, [duration, isSmall, bp, onComplete]);

  // ── Molecule SVG params ──
  const viewBox = 340;
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const atomSpacing = 42; // distance from center to each atom
  const leftX = cx - atomSpacing * atomSplit;
  const rightX = cx + atomSpacing * atomSplit;

  const dotPulse = act === 1 ? "hPulse 0.8s ease-in-out 1" : "none";

  // When hide becomes true, start fade-out. Unmount after transition.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (hide) {
      const timer = setTimeout(() => setGone(true), 700);
      return () => clearTimeout(timer);
    }
  }, [hide]);

  if (gone) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: C.bg,
        overflow: "hidden",
        zIndex: 9999,
        opacity: hide ? 0 : 1,
        transition: hide ? "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
        pointerEvents: hide ? "none" : "auto",
        touchAction: hide ? "auto" : "none",
        WebkitOverflowScrolling: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes hPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 1; }
        }
        @keyframes hRot {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hRotR {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes hOrbitAccel {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hGlow {
          0%, 100% { filter: drop-shadow(0 0 4px ${rgba(C.accent, 0.2)}); }
          50% { filter: drop-shadow(0 0 14px ${rgba(C.accent, 0.6)}) drop-shadow(0 0 30px ${rgba(C.blue, 0.2)}); }
        }
        @keyframes hEnergy {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes hLineIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes hFrozenPulse {
          0%, 100% { filter: drop-shadow(0 0 8px ${rgba(C.accent, 0.3)}); }
          50% { filter: drop-shadow(0 0 30px ${rgba(C.accent, 0.9)}) drop-shadow(0 0 60px ${rgba(C.blue, 0.4)}); }
        }
        @keyframes hWordReveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Flash overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${rgba(C.accent, 0.8)}, white 60%)`,
          opacity: flashOpacity,
          pointerEvents: "none",
          zIndex: 100,
          transition: flashOpacity > 0.5 ? "none" : "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: uiFade,
          transform: `scale(${moleculeScale})`,
          transition: launching
            ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
          filter: launching ? `blur(${(moleculeScale - 1) * 3}px)` : "none",
          willChange: launching ? "transform, filter" : "auto",
        }}
      >
        {/* ── WORDMARK ── */}
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: wordmarkSize,
            fontWeight: 600,
            letterSpacing: "0.22em",
            color: C.light,
            marginBottom: moleculeSize * 0.04,
            height: wordmarkLetters > 0 ? "auto" : 0,
            opacity: wordmarkLetters > 0 ? 0.9 : 0,
            overflow: "hidden",
            display: "flex",
            gap: 2,
          }}
        >
          {WORD.split("").map((letter, i) => (
            <span
              key={i}
              style={{
                opacity: i < wordmarkLetters ? 1 : 0,
                transform: i < wordmarkLetters ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.1s ease, transform 0.15s ease",
                display: "inline-block",
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* ── H₂ MOLECULE SVG ── */}
        <div
          style={{
            width: moleculeSize,
            height: moleculeSize,
            flexShrink: 0,
          }}
        >
          <svg viewBox={`0 0 ${viewBox} ${viewBox}`} width="100%" height="100%">
            <defs>
              <radialGradient id="atomGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
                <stop offset="50%" stopColor={C.blue} stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter>
              <filter id="blur8"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>

            {/* ── Outer rotating ring + tick marks ── */}
            <g
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: orbitActive ? "hRot 20s linear infinite" : "hRot 40s linear infinite",
                opacity: outerRingOn ? 1 : 0,
                transition: "opacity 0.05s step-end",
              }}
            >
              <circle cx={cx} cy={cy} r="155" fill="none"
                stroke={C.accent} strokeWidth="0.4" opacity="0.1" strokeDasharray="6,4" />
              {Array.from({ length: 72 }, (_, i) => {
                const a = (i * 5 * Math.PI) / 180;
                const major = i % 6 === 0;
                const mid = i % 3 === 0;
                const r1 = major ? 140 : mid ? 144 : 148;
                return (
                  <line key={i}
                    x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
                    x2={cx + 153 * Math.cos(a)} y2={cy + 153 * Math.sin(a)}
                    stroke={major ? C.accent : C.blue}
                    strokeWidth={major ? "1" : mid ? "0.5" : "0.25"}
                    opacity={major ? 0.35 : mid ? 0.15 : 0.06}
                  />
                );
              })}
            </g>

            {/* ── Inner counter-rotating ring ── */}
            <g
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: orbitActive ? "hRotR 14s linear infinite" : "hRotR 30s linear infinite",
                opacity: innerRingOn ? 1 : 0,
                transition: "opacity 0.05s step-end",
              }}
            >
              <circle cx={cx} cy={cy} r="105" fill="none"
                stroke={C.blue} strokeWidth="0.4" opacity="0.1" strokeDasharray="3,6" />
              {Array.from({ length: 36 }, (_, i) => {
                const a = (i * 10 * Math.PI) / 180;
                return (
                  <line key={i}
                    x1={cx + 100 * Math.cos(a)} y1={cy + 100 * Math.sin(a)}
                    x2={cx + 104 * Math.cos(a)} y2={cy + 104 * Math.sin(a)}
                    stroke={C.blue} strokeWidth="0.4" opacity="0.12"
                  />
                );
              })}
            </g>

            {/* ── Molecule group (glow effect) ── */}
            <g style={{
              animation: frozen
                ? "hFrozenPulse 0.3s ease-in-out infinite"
                : (coresBright ? "hGlow 3s ease-in-out infinite" : "none"),
            }}>

              {/* Energy arcs */}
              {energyArcs && atomSplit > 0.8 && (
                <>
                  <path
                    d={`M ${leftX} ${cy} Q ${cx} ${cy - 22} ${rightX} ${cy}`}
                    fill="none" stroke={C.blue} strokeWidth="0.8"
                    opacity="0.25" strokeDasharray="4,3"
                    style={{ animation: "hEnergy 2s linear infinite" }}
                  />
                  <path
                    d={`M ${leftX} ${cy} Q ${cx} ${cy + 22} ${rightX} ${cy}`}
                    fill="none" stroke={C.teal} strokeWidth="0.5"
                    opacity="0.15" strokeDasharray="3,4"
                    style={{ animation: "hEnergy 2.5s linear infinite" }}
                  />
                </>
              )}

              {/* Bond line — draws in real-time as atoms split */}
              {atomSplit > 0.05 && (
                <line
                  x1={leftX} y1={cy} x2={rightX} y2={cy}
                  stroke={coresBright ? C.accent : C.muted}
                  strokeWidth={coresBright ? 1.8 : 0.8}
                  opacity={coresBright ? 0.5 : 0.2}
                  style={{ transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s" }}
                />
              )}

              {/* ── Single cyan dot (ACT 1) / Left atom ── */}
              <g>
                {/* Ambient glow */}
                <circle cx={leftX} cy={cy} r="35" fill="url(#atomGlow)" />
                {/* Outer shell */}
                <circle cx={leftX} cy={cy} r="30" fill="none"
                  stroke={C.accent} strokeWidth="0.8"
                  opacity={coresBright ? 0.35 : 0.15}
                  style={{ transition: "opacity 0.5s" }}
                />
                {/* Inner shell */}
                <circle cx={leftX} cy={cy} r="20" fill="none"
                  stroke={C.blue} strokeWidth="0.4"
                  opacity="0.1" strokeDasharray="2,5"
                />
                {/* Core glow */}
                <circle cx={leftX} cy={cy} r="10" fill={C.accent}
                  opacity={coresBright ? 0.06 : 0.03} filter="url(#blur4)" />
                {/* Core dot */}
                <circle cx={leftX} cy={cy}
                  r={dotVisible ? (atomSplit > 0.1 ? 6 : 4) : 0}
                  fill={C.accent}
                  opacity={coresBright ? 0.9 : 0.6}
                  style={{
                    transition: "r 0.2s, opacity 0.3s",
                    animation: act === 1 ? dotPulse : "none",
                  }}
                />
                {/* Electron orbit */}
                {orbitActive && (
                  <g style={{
                    transformOrigin: `${leftX}px ${cy}px`,
                    animation: "hOrbitAccel 2s linear infinite",
                  }}>
                    <circle cx={leftX} cy={cy - 30} r="3"
                      fill={C.accent} opacity="0.85" />
                    <circle cx={leftX} cy={cy - 30} r="6"
                      fill={C.accent} opacity="0.08" filter="url(#blur4)" />
                  </g>
                )}
              </g>

              {/* ── Right atom (only visible after split starts) ── */}
              {atomSplit > 0.05 && (
                <g>
                  <circle cx={rightX} cy={cy} r="35" fill="url(#atomGlow)" />
                  <circle cx={rightX} cy={cy} r="30" fill="none"
                    stroke={C.accent} strokeWidth="0.8"
                    opacity={coresBright ? 0.35 : 0.15}
                    style={{ transition: "opacity 0.5s" }}
                  />
                  <circle cx={rightX} cy={cy} r="20" fill="none"
                    stroke={C.blue} strokeWidth="0.4"
                    opacity="0.1" strokeDasharray="2,5"
                  />
                  <circle cx={rightX} cy={cy} r="10" fill={C.accent}
                    opacity={coresBright ? 0.06 : 0.03} filter="url(#blur4)" />
                  <circle cx={rightX} cy={cy} r="6"
                    fill={C.accent}
                    opacity={coresBright ? 0.9 : 0.6}
                    style={{ transition: "opacity 0.3s" }}
                  />
                  {/* Electron orbit (reverse) */}
                  {orbitActive && (
                    <g style={{
                      transformOrigin: `${rightX}px ${cy}px`,
                      animation: "hOrbitAccel 1.6s linear reverse infinite",
                    }}>
                      <circle cx={rightX} cy={cy - 30} r="3"
                        fill={C.blueM} opacity="0.85" />
                      <circle cx={rightX} cy={cy - 30} r="6"
                        fill={C.blueM} opacity="0.08" filter="url(#blur4)" />
                    </g>
                  )}
                </g>
              )}

              {/* Shared electron cloud */}
              {energyArcs && atomSplit > 0.8 && (
                <>
                  <ellipse cx={cx} cy={cy} rx="22" ry="12"
                    fill={C.accent} opacity="0.03" />
                  <ellipse cx={cx} cy={cy} rx="22" ry="12"
                    fill={C.accent} opacity="0.02" filter="url(#blur8)" />
                </>
              )}
            </g>
          </svg>
        </div>

        {/* ── Phase label ── */}
        {phase && (
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: Math.max(10, wordmarkSize * 0.4),
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: C.light,
            opacity: 0.7,
            marginTop: moleculeSize * -0.02,
            textAlign: "center",
          }}>
            {phase}
          </div>
        )}

        {/* ── Progress bar + percentage ── */}
        {progress > 0 && (
          <div style={{
            width: Math.min(moleculeSize * 0.55, 300),
            marginTop: moleculeSize * 0.03,
            textAlign: "center",
          }}>
            {/* Bar */}
            <div style={{
              position: "relative",
              height: 2,
              background: rgba(C.accent, 0.06),
              borderRadius: 1,
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0,
                borderRadius: 1,
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${rgba(C.blue, 0.2)}, ${C.accent})`,
                boxShadow: `0 0 8px ${rgba(C.accent, 0.3)}`,
                transition: "width 0.08s linear",
              }} />
            </div>
            {/* Percentage */}
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: Math.max(11, wordmarkSize * 0.45),
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: C.accent,
              opacity: 0.8,
              marginTop: 8,
              fontVariantNumeric: "tabular-nums",
            }}>
              {Math.floor(progress).toString().padStart(3, "0")}
              <span style={{ fontSize: "0.7em", opacity: 0.5, marginLeft: 2 }}>%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── TELEMETRY FEED (bottom-left on desktop/tablet, bottom-center on mobile) ── */}
      {!isSmall && visibleLines.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: bp === "mobile" ? 24 : 32,
          left: bp === "mobile" ? "50%" : 32,
          transform: bp === "mobile" ? "translateX(-50%)" : "none",
          width: bp === "desktop" ? 380 : bp === "tablet" ? 320 : 300,
          opacity: uiFade,
          fontFamily: "'IBM Plex Mono', 'Consolas', monospace",
          color: C.accent,
          fontSize: 9,
          zIndex: 10,
        }}>
          <div style={{
            fontSize: 7,
            letterSpacing: "0.15em",
            color: C.muted,
            marginBottom: 6,
            paddingBottom: 4,
            borderBottom: `1px solid ${rgba(C.accent, 0.08)}`,
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span>TELEMETRY FEED</span>
            <span style={{ color: C.accent, opacity: 0.5 }}>● LIVE</span>
          </div>

          {visibleLines.map((line, i) => {
            const isLast = i === visibleLines.length - 1;
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "baseline",
                lineHeight: "16px",
                height: 16,
                opacity: isLast ? 0.85 : 0.25 + (i / visibleLines.length) * 0.4,
                animation: isLast ? "hLineIn 0.12s ease-out" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}>
                <span style={{
                  color: C.muted, opacity: 0.4,
                  width: bp === "mobile" ? 60 : 72,
                  flexShrink: 0,
                }}>
                  {line.cmd}
                </span>
                <span style={{
                  color: rgba(C.light, 0.5),
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {line.msg}
                </span>
                <span style={{
                  color: C.accent,
                  width: bp === "mobile" ? 62 : 76,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {line.st}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
