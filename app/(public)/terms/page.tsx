import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] py-12">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-light text-[#1C1612] mb-6">Terms of Service</h1>
        <div className="prose prose-sm text-[#6B6155] space-y-4">
          <p>Last updated: May 2026</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Service Description</h2>
          <p>CodeOutfitters LLC provides bespoke web application development services, including business platforms and portals, workflow integrations and product modernization. Each engagement is defined by a scope of work agreed upon before delivery.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Payment</h2>
          <p>Each engagement is quoted as a one-time setup fee unless otherwise specified. Ongoing support plans are billed monthly. All prices are in USD. Payment is due before work begins.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Delivery</h2>
          <p>Delivery dates are set in the written scope agreed before a project starts. Where a project runs in phases, each phase carries its own dates in that scope.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Ownership</h2>
          <p>You own 100% of every workflow, credential, and connection built during your engagement. No proprietary lock-in. You can cancel anytime.</p>
          <h2 className="text-[#1C1612] font-semibold text-lg mt-8">Limitation of Liability</h2>
          <p>CodeOutfitters is not liable for indirect damages resulting from automation failures. Our liability is limited to the amount paid for the specific service.</p>
          <div className="pt-8"><Link href="/" className="btn-primary">Back to Home</Link></div>
        </div>
      </div>
    </div>
  )
}
