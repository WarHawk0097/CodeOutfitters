import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard/server";
import { getExtensionAuthRequestStatus } from "@/lib/extension-auth/server";
import { ConnectExtensionForm } from "./connect-extension-form";

export const dynamic = "force-dynamic";

export default async function ExtensionAuthPage({ searchParams }: { searchParams: Promise<{ requestId?: string; state?: string; code_challenge?: string; approved?: string }> }) {
  const params = await searchParams;
  const requestId = params.requestId ?? "";
  const state = params.state ?? "";
  const codeChallenge = params.code_challenge ?? "";
  if (!requestId || !state || !codeChallenge) return <AuthMessage title="Unable to connect extension" body="This authorization request is incomplete or expired." />;
  const status = await getExtensionAuthRequestStatus(requestId);
  if (status.status === "expired" || status.status === "denied") return <AuthMessage title="Authorization expired" body="Start sign-in again from the CodeOutfitters extension." />;
  const context = await getDashboardContext();
  if (!context) {
    const returnTo = `/extension-auth?requestId=${encodeURIComponent(requestId)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}`;
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (params.approved === "1" || status.status === "authorized") return <AuthMessage title="Authorization approved" body="Return to the extension to finish connecting." />;
  return (
    <main className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-5">
      <section className="w-full max-w-lg rounded-3xl border border-[#E8DED2] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#94735B]">CodeOutfitters</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1C1612]">Connect Meeting Capture</h1>
        <p className="mt-3 text-[#6B6155]">Allow the extension to capture meetings for this workspace.</p>
        <dl className="mt-7 space-y-3 rounded-2xl bg-[#FAF7F2] p-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[#6B6155]">Workspace</dt><dd className="font-medium text-[#1C1612]">{context.workspaceName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[#6B6155]">Account</dt><dd className="font-medium text-[#1C1612]">{context.name}</dd></div>
        </dl>
        <ConnectExtensionForm requestId={requestId} state={state} codeChallenge={codeChallenge} />
      </section>
    </main>
  );
}

function AuthMessage({ title, body }: { title: string; body: string }) {
  return <main className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-5"><section className="w-full max-w-lg rounded-3xl border border-[#E8DED2] bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#94735B]">CodeOutfitters</p><h1 className="mt-3 text-3xl font-semibold text-[#1C1612]">{title}</h1><p className="mt-3 text-[#6B6155]">{body}</p></section></main>;
}
