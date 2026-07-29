import { isDemoMode } from '@/lib/command-center/mode'
import { resolveDashboardContext } from '@/lib/command-center/data'
import { ProposalAccessView } from './access-view'

export const metadata = { title: 'Client access — Command Center' }

export default async function ProposalAccessPage({
  params,
}: {
  params: Promise<{ proposalId: string }>
}) {
  const { proposalId } = await params
  // Same gate as every other dashboard route: in live mode this resolves the session and the
  // workspace before anything renders. Publishing a proposal and issuing a client link are
  // the two most consequential things in this feature, so neither is reachable without one.
  await resolveDashboardContext(`/dashboard/proposals/${proposalId}/access`)
  return <ProposalAccessView proposalId={proposalId} live={!isDemoMode()} />
}
