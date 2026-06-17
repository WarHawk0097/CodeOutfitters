import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center px-5 text-center">
      <div className="text-9xl font-heading font-bold text-gradient mb-4">
        404
      </div>
      <h1 className="text-2xl font-heading font-bold text-[#1C1612] mb-3">
        Page not found
      </h1>
      <p className="text-[#6B6155] mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist.
        Maybe it was automated away.
      </p>
      <Link href="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  )
}
