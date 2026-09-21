import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AtmosphericCanvasProps {
  temperature?: number | null;
  humidity?: number | null;
  mq135Raw?: number | null;
  isHazard?: boolean;
}

export function AtmosphericCanvas({
  temperature = 28.5,
  humidity = 65,
  mq135Raw = 1600,
  isHazard = false,
}: AtmosphericCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store telemetry values in refs for smooth frame-by-frame interpolation without restarting the scene
  const tempRef = useRef(temperature ?? 28.5);
  const humidRef = useRef(humidity ?? 65);
  const gasRef = useRef(mq135Raw ?? 1600);
  const hazardRef = useRef(isHazard);

  useEffect(() => {
    tempRef.current = temperature ?? 28.5;
  }, [temperature]);

  useEffect(() => {
    humidRef.current = humidity ?? 65;
  }, [humidity]);

  useEffect(() => {
    gasRef.current = mq135Raw ?? 1600;
  }, [mq135Raw]);

  useEffect(() => {
    hazardRef.current = isHazard;
  }, [isHazard]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08192e, 0.0018);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background

    container.appendChild(renderer.domElement);

    // 2. Generate procedural soft glow particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
      gradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.3)');
      gradient.addColorStop(1, 'rgba(8, 25, 46, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    // 3. Particle Cloud (Atmospheric Maritime Flow)
    const particleCount = 750;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number; phase: number }[] = [];

    const baseColorNormal = new THREE.Color('#38bdf8'); // Sky Cyan
    const baseColorWarm = new THREE.Color('#fb923c');   // Amber (Heat)
    const baseColorHazard = new THREE.Color('#f43f5e'); // Crimson Alert

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 1600;
      positions[idx + 1] = (Math.random() - 0.5) * 900;
      positions[idx + 2] = (Math.random() - 0.5) * 800;

      colors[idx] = baseColorNormal.r;
      colors[idx + 1] = baseColorNormal.g;
      colors[idx + 2] = baseColorNormal.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 14,
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 4. Subtle 3D Geometric Horizon Waves (Representing Sea Breeze / Terrain Grid)
    const gridGeometry = new THREE.BufferGeometry();
    const gridPoints = 60;
    const gridPositions = new Float32Array(gridPoints * 3);

    for (let i = 0; i < gridPoints; i++) {
      const x = (i / (gridPoints - 1) - 0.5) * 1400;
      const y = -260;
      const z = (Math.sin(i * 0.3) * 60);
      gridPositions[i * 3] = x;
      gridPositions[i * 3 + 1] = y;
      gridPositions[i * 3 + 2] = z;
    }
    gridGeometry.setAttribute('position', new THREE.BufferAttribute(gridPositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
    });
    const horizonLine = new THREE.Line(gridGeometry, lineMaterial);
    scene.add(horizonLine);

    // 5. Mouse Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock += 0.015;

      const currentTemp = tempRef.current;
      const currentHumid = humidRef.current;
      const currentHazard = hazardRef.current;

      // Speed & Turbulance scaled with humidity and temperature
      const speedFactor = 0.6 + (currentHumid / 100) * 0.8;
      const isWarm = currentTemp > 31.5;

      // Target Color blending
      let targetColor = baseColorNormal;
      if (currentHazard) {
        targetColor = baseColorHazard;
      } else if (isWarm) {
        targetColor = baseColorWarm;
      }

      // Parallax smooth lerp
      targetCameraX = mouseX * 120;
      targetCameraY = -mouseY * 80;
      camera.position.x += (targetCameraX - camera.position.x) * 0.04;
      camera.position.y += (targetCameraY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Animate Particles
      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
      const posArray = positionAttr.array as Float32Array;
      const colArray = colorAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const vel = velocities[i];

        // Drift flow with gentle sine waves
        posArray[idx] += (vel.x + Math.sin(clock + vel.phase) * 0.3) * speedFactor;
        posArray[idx + 1] += (vel.y + Math.cos(clock * 0.7 + vel.phase) * 0.25) * speedFactor;
        posArray[idx + 2] += vel.z * speedFactor;

        // Wrap around boundaries
        if (posArray[idx] > 800) posArray[idx] = -800;
        if (posArray[idx] < -800) posArray[idx] = 800;
        if (posArray[idx + 1] > 450) posArray[idx + 1] = -450;
        if (posArray[idx + 1] < -450) posArray[idx + 1] = 450;
        if (posArray[idx + 2] > 400) posArray[idx + 2] = -400;
        if (posArray[idx + 2] < -400) posArray[idx + 2] = 400;

        // Smoothly interpolate colors towards telemetry state
        colArray[idx] += (targetColor.r - colArray[idx]) * 0.03;
        colArray[idx + 1] += (targetColor.g - colArray[idx + 1]) * 0.03;
        colArray[idx + 2] += (targetColor.b - colArray[idx + 2]) * 0.03;
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Animate Horizon Line Wave
      const linePosAttr = gridGeometry.getAttribute('position') as THREE.BufferAttribute;
      const lineArray = linePosAttr.array as Float32Array;
      for (let i = 0; i < gridPoints; i++) {
        const yOffset = Math.sin(clock * 1.5 + i * 0.25) * 15;
        lineArray[i * 3 + 1] = -260 + yOffset;
      }
      linePosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Clean up all Three.js resources
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      gridGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    />
  );
}
