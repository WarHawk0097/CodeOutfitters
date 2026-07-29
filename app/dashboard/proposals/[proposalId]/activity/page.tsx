import { isDemoMode } from '@/lib/command-center/mode'
import { resolveDashboardContext } from '@/lib/command-center/data'
import { ProposalActivityView } from './proposal-activity-view'

export const metadata = { title: 'Proposal activity — Command Center' }

export default async function ProposalActivityPage({
  params,
}: {
  params: Promise<{ proposalId: string }>
}) {
  const { proposalId } = await params
  // Same gate as every other dashboard route: in live mode this resolves the session and the
  // workspace before anything renders, so the page is not readable without one.
  await resolveDashboardContext(`/dashboard/proposals/${proposalId}/activity`)
  return <ProposalActivityView proposalId={proposalId} live={!isDemoMode()} />
}
