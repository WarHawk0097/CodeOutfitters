import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] py-12">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-[#1C1612] mb-6">Privacy Policy</h1>
        <div className="prose prose-sm text-[#6B6155] space-y-4">
          <p>Last updated: May 2026</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Information We Collect</h2>
          <p>When you fill out our contact form, we collect your name, email address, business type, and message. We do not collect payment information or sensitive personal data.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Cookies</h2>
          <p>We use minimal cookies to improve site experience and analyze traffic. You can accept or decline via our cookie consent banner. We do not use tracking cookies or third-party ad networks.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">How We Use Your Data</h2>
          <p>Contact form submissions are sent to our secure workflow system (n8n) for processing. Your data is never sold or shared with third parties. We use it only to respond to your inquiry.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Third-Party Tools</h2>
          <p>We use our custom booking system for scheduling and may use Tawk.to for live chat. These services have their own privacy policies. No sensitive data is shared with them beyond what you voluntarily provide.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Contact</h2>
          <p>Email us at <a href="mailto:hello@codeoutfitters.com" className="text-[#2A6B5A] underline">hello@codeoutfitters.com</a> with any privacy concerns.</p>
          <div className="pt-8"><Link href="/" className="btn-primary">Back to Home</Link></div>
        </div>
      </div>
    </div>
  )
}
