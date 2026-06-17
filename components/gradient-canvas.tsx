'use client'
import { useEffect, useRef } from 'react'

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const colors = [
      { r: 42, g: 107, b: 90 },
      { r: 61, g: 139, b: 113 },
      { r: 200, g: 169, b: 110 },
      { r: 26, g: 74, b: 59 },
    ]

    const blobs = colors.map((color, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.min(width, height) * (0.35 + i * 0.08),
      color,
    }))

    let raf: number

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      blobs.forEach((blob) => {
        blob.x += blob.vx
        blob.y += blob.vy

        if (blob.x < -blob.radius) blob.x = width + blob.radius
        if (blob.x > width + blob.radius) blob.x = -blob.radius
        if (blob.y < -blob.radius) blob.y = height + blob.radius
        if (blob.y > height + blob.radius) blob.y = -blob.radius

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius)
        gradient.addColorStop(0, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},0.07)`)
        gradient.addColorStop(1, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  )
}
