import { useEffect, useRef, useMemo } from 'react';

interface LivingAmbientCanvasProps {
  temperature: number | null;
  humidity: number | null;
  gasRaw: number | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export function LivingAmbientCanvas({
  temperature,
  humidity,
  gasRaw,
}: LivingAmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute chromatic shift colors based on microclimate telemetry (PRD Section 1 & 10)
  const chromaticShift = useMemo(() => {
    // Temperature: default 25°C baseline
    const temp = temperature ?? 25;
    // Normalized thermal hue: 0 = cool blue (200), 1 = warm amber/orange (25)
    const tempFactor = Math.min(Math.max((temp - 18) / 16, 0), 1);
    const r1 = Math.round(10 + tempFactor * 40);
    const g1 = Math.round(25 + (1 - tempFactor) * 25);
    const b1 = Math.round(45 + (1 - tempFactor) * 50);

    // Humidity: moisture haze opacity (0.12 - 0.28)
    const humid = humidity ?? 60;
    const moistureOpacity = 0.12 + Math.min(Math.max(humid / 100, 0), 1) * 0.16;

    // Gas particulate activity
    const gas = gasRaw ?? 1500;
    const particleCount = Math.min(Math.max(Math.floor(gas / 100), 15), 45);

    return {
      gradientColor1: `rgba(${r1}, ${g1}, ${b1}, ${moistureOpacity})`,
      gradientColor2: `rgba(15, 47, 99, 0.45)`,
      particleCount,
      tempFactor,
    };
  }, [temperature, humidity, gasRaw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize atmospheric data particles
    const particles: Particle[] = [];
    const count = prefersReducedMotion ? 0 : chromaticShift.particleCount;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3,
        baseAlpha: 0.1 + Math.random() * 0.3,
      });
    }

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // 30 fps cap for zero CPU thrashing (PRD Section 28)

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = currentTime - (elapsed % fpsInterval);

      ctx.clearRect(0, 0, width, height);

      // 1. Draw atmospheric radial fluid haze
      const gradient = ctx.createRadialGradient(
        width * 0.3,
        height * 0.35,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, chromaticShift.gradientColor1);
      gradient.addColorStop(1, 'rgba(6, 8, 12, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (prefersReducedMotion) return;

      // 2. Draw subtle floating data particles
      ctx.fillStyle = chromaticShift.tempFactor > 0.6 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(87, 144, 230, 0.4)';
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [chromaticShift]);

  return (
    <canvas
      ref={canvasRef}
      className="ambient-backdrop"
      aria-hidden="true"
    />
  );
}
