import type { Metadata } from 'next'
import { isDemoMode } from '@/lib/command-center/mode'
import { LiveProposalPublicProvider } from '@/lib/proposals/access/live-public-provider'
import {
  PUBLIC_TEMPORARILY_UNAVAILABLE_DETAIL,
  PUBLIC_TEMPORARILY_UNAVAILABLE_TITLE,
} from '@/lib/proposals/access/provider'
import { ProposalPublicView } from './proposal-public-view'
import { PublicNotice } from './public-chrome'

// The secure client proposal route.
//
// The one page in this application that an unauthenticated stranger is meant to reach. It is
// deliberately NOT under /dashboard and NOT in middleware's matcher: a client holding a link
// has no account, and sending them to a sign-in page would make the link useless.
//
// What protects it is the token and nothing else, so the token is the only thing that decides
// what is shown. There is no proposal id in the URL, no workspace in the URL, and no query
// parameter that changes what is rendered — a reader can only see the one document their link
// addresses, and cannot walk to a second one by editing the address.
//
// Unknown, malformed, expired, revoked and foreign tokens all resolve through the same code
// path to the same shaped response. Nothing in the output tells a probe which of those it hit.

export const metadata: Metadata = {
  title: 'Proposal',
  // A client's commercial terms have no business in a search index, and the URL is the secret.
  robots: { index: false, follow: false, nocache: true },
}

export default async function SecureProposalPage({
  params,
}: {
  params: Promise<{ secureToken: string }>
}) {
  const { secureToken } = await params
  if (isDemoMode()) return <ProposalPublicView token={secureToken} />

  let view
  try {
    view = await new LiveProposalPublicProvider().resolve(secureToken)
  } catch {
    return (
      <PublicNotice
        heading={PUBLIC_TEMPORARILY_UNAVAILABLE_TITLE}
        detail={PUBLIC_TEMPORARILY_UNAVAILABLE_DETAIL}
      />
    )
  }

  return <ProposalPublicView token={secureToken} live initialView={view} />
}
