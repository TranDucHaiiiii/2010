import { useEffect, useRef } from 'react';
import './atmosphere.css';

const burstListeners = new Set();

/** Emit decorative particles at viewport coordinates, independent of scene layout. */
export function burstAt(x, y, kind = 'petals') {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  burstListeners.forEach((listener) => listener({ x, y, kind }));
}

const random = (min, max) => min + Math.random() * (max - min);
const PETAL_COLORS = ['#c87782', '#da8c95', '#edb0b4', '#b85b70', '#e8a1ab'];
const CONFETTI_COLORS = ['#d38a9b', '#e5bd78', '#f3d7b8', '#c97084', '#f5d9df'];

function petalPath(ctx, size) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.8);
  ctx.bezierCurveTo(-size * 0.85, size * 0.1, -size * 0.5, -size * 0.9, size * 0.2, -size * 0.7);
  ctx.bezierCurveTo(size * 1.1, -size * 0.65, size * 0.8, size * 0.45, 0, size * 0.8);
  ctx.closePath();
}

function heartPath(ctx, size) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.65);
  ctx.bezierCurveTo(-size * 1.4, -size * 0.2, -size * 0.55, -size * 1.2, 0, -size * 0.5);
  ctx.bezierCurveTo(size * 0.55, -size * 1.2, size * 1.4, -size * 0.2, 0, size * 0.65);
  ctx.closePath();
}

export default function Atmosphere({ dark = false, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const darkRef = useRef(dark);

  useEffect(() => {
    darkRef.current = dark;
  }, [dark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let frameId = 0;
    let lastTime = 0;
    let elapsed = 0;
    let disposed = false;
    let particles = [];
    let ambient = [];

    const makeAmbient = (index, count) => {
      const isDust = index % 3 !== 0;
      return {
        x: random(0, width),
        y: (height / count) * index + random(-20, 20),
        size: isDust ? random(0.7, 1.7) : random(5, 10),
        vx: random(-4, 4),
        vy: isDust ? random(-4, -1) : random(9, 20),
        phase: random(0, Math.PI * 2),
        rotation: random(0, Math.PI * 2),
        spin: random(-0.3, 0.3),
        alpha: isDust ? random(0.17, 0.44) : random(0.2, 0.43),
        color: PETAL_COLORS[index % PETAL_COLORS.length],
        kind: isDust ? 'dust' : 'petal',
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reducedMotion ? 9 : width < 640 ? 25 : 39;
      ambient = Array.from({ length: count }, (_, index) => makeAmbient(index, count));
      if (reducedMotion) draw(0);
    };

    const drawParticle = (p, alpha) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      if (p.kind === 'dust' || p.kind === 'spark') {
        ctx.fillStyle = darkRef.current ? '#f5d79e' : '#bc975d';
        ctx.shadowColor = '#eec28b';
        ctx.shadowBlur = p.kind === 'spark' ? 8 : 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.kind === 'spark' && p.size > 1.5) {
          ctx.globalAlpha *= 0.6;
          ctx.fillRect(-p.size * 3, -0.5, p.size * 6, 1);
          ctx.fillRect(-0.5, -p.size * 3, 1, p.size * 6);
        }
      } else {
        ctx.fillStyle = p.color;
        if (p.kind === 'heart') heartPath(ctx, p.size);
        else if (p.kind === 'confetti') {
          ctx.scale(1, Math.max(0.2, Math.cos(p.rotation)));
          ctx.beginPath();
          ctx.rect(-p.size * 0.45, -p.size * 0.8, p.size * 0.9, p.size * 1.6);
        } else {
          ctx.scale(1, 0.65 + Math.abs(Math.sin(p.phase + elapsed * 0.6)) * 0.35);
          petalPath(ctx, p.size);
        }
        ctx.fill();
        if (p.kind === 'petal' && p.size > 5) {
          ctx.globalAlpha *= 0.26;
          ctx.strokeStyle = '#fff6ed';
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(0, p.size * 0.55);
          ctx.quadraticCurveTo(p.size * 0.15, 0, p.size * 0.2, -p.size * 0.4);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    function draw(delta) {
      ctx.clearRect(0, 0, width, height);
      elapsed += delta;
      ambient.forEach((p) => {
        if (!reducedMotion) {
          p.x += (p.vx + Math.sin(elapsed * 0.45 + p.phase) * 8) * delta;
          p.y += p.vy * delta;
          p.rotation += p.spin * delta;
          if (p.y > height + 20) { p.y = -20; p.x = random(0, width); }
          if (p.y < -20) p.y = height + 20;
          if (p.x < -25) p.x = width + 25;
          if (p.x > width + 25) p.x = -25;
        }
        const twinkle = reducedMotion || p.kind !== 'dust' ? 1 : 0.65 + Math.sin(elapsed + p.phase) * 0.35;
        drawParticle(p, p.alpha * twinkle);
      });
      particles = particles.filter((p) => {
        p.age += delta;
        if (p.age >= p.life) return false;
        if (!reducedMotion) {
          p.vx *= Math.pow(0.99, delta * 60);
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.vy += p.gravity * delta;
          p.rotation += p.spin * delta;
        }
        const fade = Math.pow(1 - p.age / p.life, 0.7);
        drawParticle(p, p.alpha * fade);
        return true;
      });
    }

    const tick = (time) => {
      if (disposed || document.hidden) { frameId = 0; return; }
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0.016;
      lastTime = time;
      draw(delta);
      frameId = !reducedMotion || particles.length > 0 ? requestAnimationFrame(tick) : 0;
    };

    const requestFrame = () => {
      if (!frameId && !document.hidden && !disposed) {
        lastTime = 0;
        frameId = requestAnimationFrame(tick);
      }
    };

    const emit = ({ x, y, kind }) => {
      if (document.hidden) return;
      const count = reducedMotion ? 4 : kind === 'celebration' ? (width < 640 ? 85 : 125) : kind === 'hearts' ? 8 : 24;
      const next = Array.from({ length: count }, (_, index) => {
        const angle = random(-Math.PI, 0);
        const speed = kind === 'celebration' ? random(70, 300) : random(25, 145);
        const particleKind = kind === 'hearts' ? 'heart' : kind === 'celebration' ? ['confetti', 'spark', 'petal'][index % 3] : 'petal';
        return {
          x: x + (reducedMotion ? random(-20, 20) : random(-8, 8)),
          y: y + (reducedMotion ? random(-20, 10) : random(-8, 8)),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (kind === 'hearts' ? 35 : 0),
          gravity: kind === 'hearts' ? -8 : kind === 'celebration' ? 70 : 35,
          size: particleKind === 'spark' ? random(1, 2.3) : random(3.2, kind === 'hearts' ? 7 : 9),
          rotation: kind === 'hearts' ? random(-0.3, 0.3) : random(0, Math.PI * 2),
          spin: particleKind === 'heart' ? random(-0.2, 0.2) : random(-3, 3),
          phase: random(0, Math.PI * 2),
          alpha: random(0.65, 0.95),
          color: kind === 'celebration' ? CONFETTI_COLORS[index % CONFETTI_COLORS.length] : PETAL_COLORS[index % PETAL_COLORS.length],
          kind: particleKind,
          life: reducedMotion ? 0.45 : kind === 'celebration' ? random(2, 3.7) : random(1.1, 2.4),
          age: 0,
        };
      });
      particles = [...particles, ...next].slice(-180);
      requestFrame();
    };

    let lastTap = 0;
    const onPointerDown = (event) => {
      if (!event.isPrimary || event.button !== 0 || performance.now() - lastTap < 160) return;
      lastTap = performance.now();
      emit({ x: event.clientX, y: event.clientY, kind: 'hearts' });
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
      else requestFrame();
    };

    burstListeners.add(emit);
    resize();
    if (!reducedMotion) requestFrame();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      burstListeners.delete(emit);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className={`gift-atmosphere${dark ? ' gift-atmosphere--dark' : ''}`} aria-hidden="true" />;
}
