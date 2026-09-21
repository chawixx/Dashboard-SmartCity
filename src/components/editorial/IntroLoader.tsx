import { useState, useEffect } from 'react';

interface IntroLoaderProps {
  onReady: () => void;
}

export function IntroLoader({ onReady }: IntroLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Fill progress bar smoothly
    const startTime = performance.now();
    const duration = 1200;

    let frameId: number;
    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        frameId = requestAnimationFrame(updateProgress);
      } else {
        // Delay slightly before curtain slides up
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsDone(true);
            onReady();
          }, 850);
        }, 200);
      }
    };

    frameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(frameId);
  }, [onReady]);

  if (isDone) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'var(--brand-deep)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        transition: 'transform 0.85s cubic-bezier(0.65, 0, 0.35, 1)',
        transform: isExiting ? 'translateY(-105%)' : 'translateY(0%)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* Brand Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(56, 189, 248, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-light)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" opacity="0.4"/>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3"/>
          </svg>
        </div>
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand-light)', fontSize: '0.7rem', marginBottom: '2px' }}>
            <span className="eyebrow-dot" />
            <span>Urban Telemetry Observatory</span>
          </div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            TEGAL ECOSENSE
          </h2>
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: '12rem',
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--brand-light)',
            boxShadow: '0 0 10px var(--brand-light)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <span
        className="mono-text"
        style={{
          fontSize: '0.72rem',
          color: 'var(--brand-light)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Connecting IoT Nodes... {Math.round(progress)}%
      </span>
    </div>
  );
}
