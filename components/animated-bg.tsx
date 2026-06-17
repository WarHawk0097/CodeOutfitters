'use client'

export function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="blob-1 absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-40"
        style={{ background: 'radial-gradient(circle, #C8A96E 0%, #2A6B5A 50%, transparent 70%)' }}
      />
      <div
        className="blob-2 absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[80px] opacity-30"
        style={{ background: 'radial-gradient(circle, #2A6B5A 0%, #2A6B5A 50%, transparent 70%)' }}
      />
    </div>
  )
}
