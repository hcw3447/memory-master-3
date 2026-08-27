'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  color: string
  life: number
}

const COLORS = ['#f0b429', '#ffd479', '#4fb8d6', '#f4f1f7', '#e08a2e']

/** 의존성 없는 캔버스 폭죽. active가 true가 되는 순간 두 방향에서 파티클을 발사한다. */
export function Confetti({ active, duration = 4200 }: { active: boolean; duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const w = () => canvas.width / dpr
    const h = () => canvas.height / dpr
    const particles: Particle[] = []

    const burst = (originX: number, originY: number, count: number, angle: number) => {
      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 1.1
        const speed = 7 + Math.random() * 9
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle + spread) * speed,
          vy: Math.sin(angle + spread) * speed,
          size: 5 + Math.random() * 7,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.28,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 1,
        })
      }
    }

    burst(w() * 0.14, h() * 0.82, 70, -Math.PI / 2.6)
    burst(w() * 0.86, h() * 0.82, 70, -Math.PI + Math.PI / 2.6)
    const mid = window.setTimeout(() => burst(w() * 0.5, h() * 0.28, 80, -Math.PI / 2), 550)

    let raf = 0
    const start = performance.now()

    const frame = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, w(), h())

      for (const p of particles) {
        p.vy += 0.22
        p.vx *= 0.995
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        if (elapsed > duration * 0.55) p.life -= 0.012

        if (p.life <= 0) continue
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55)
        ctx.restore()
      }

      if (elapsed < duration) {
        raf = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, w(), h())
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(mid)
      window.removeEventListener('resize', resize)
    }
  }, [active, duration])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  )
}
