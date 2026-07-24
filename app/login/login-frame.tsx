// The /login shell: a full-height two-column composition that speaks the public
// site's visual language (Space Grotesk / Instrument Sans, the #F7F2EA canvas,
// the #0A120E ink, the #17A063 / #2BD483 green, 10px radii), NOT the dashboard's.
// Nothing here imports a Command Center token or the sidebar styling — the
// marketing site and this page are the same brand; the dashboard is a different
// surface.
//
// The public navbar is deliberately absent (app/login is outside the (public)
// route group, so it never renders one), which is why the brand panel carries
// the "Back to website" link.
import Link from 'next/link'
import type { ReactNode } from 'react'

export function LoginFrame({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand-top">
          <Link href="/" className="login-logo">
            <img src="/assets/logo-mark.svg" alt="" width={28} height={28} />
            <span>
              Code<b>Outfitters</b>
            </span>
          </Link>
          <span className="login-brand-label">Command Center</span>
        </div>

        {/* Approved product statement, taken verbatim from the public hero. No
            invented customer logos and no invented statistics. */}
        <p className="login-brand-statement">
          AI-powered automations for US small businesses — built in 7 days, zero coding required on
          your end.
        </p>

        <Link href="/" className="login-brand-back">
          <span aria-hidden="true">←</span> Back to website
        </Link>
      </section>

      <section className="login-panel">
        <div className="login-panel-inner">{children}</div>
      </section>

      <style>{`
.login-page{min-height:100dvh;display:grid;grid-template-columns:1fr;background:#F7F2EA;color:#0A120E}
.login-brand{background:#0A120E;color:#F7F2EA;display:flex;flex-direction:column;gap:18px;padding:24px clamp(16px,5vw,32px);border-bottom:1px solid #16241C}
.login-brand-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.login-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;white-space:nowrap}
.login-logo img{width:28px;height:28px}
.login-logo span{font:600 19px 'Space Grotesk',sans-serif;color:#F7F2EA;letter-spacing:-.01em}
.login-logo b{color:#2BD483}
.login-brand-label{font:600 11.5px 'Instrument Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8FBFA4;border:1px solid rgba(143,191,164,.35);border-radius:999px;padding:5px 11px}
.login-brand-statement{margin:0;max-width:34ch;font:500 15.5px/1.55 'Instrument Sans',sans-serif;color:#C9D6CD}
.login-brand-back{align-self:flex-start;font:600 14px 'Instrument Sans',sans-serif;color:#F7F2EA;text-decoration:none;border:1px solid rgba(247,242,234,.28);border-radius:10px;padding:10px 16px;transition:.15s}
.login-brand-back:hover{border-color:#2BD483;color:#2BD483}
.login-panel{display:flex;align-items:center;justify-content:center;padding:32px clamp(16px,5vw,32px) 48px}
.login-panel-inner{width:100%;max-width:400px}

.login-title{margin:0;font:600 clamp(26px,4vw,32px)/1.15 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em}
.login-subtitle{margin:8px 0 0;font:400 15px/1.5 'Instrument Sans',sans-serif;color:#4A5248}
.login-alert{margin:18px 0 0;font:500 14px/1.45 'Instrument Sans',sans-serif;color:#8A2318;background:#FBECE9;border:1px solid rgba(138,35,24,.22);border-radius:10px;padding:11px 14px}
.login-status{margin:0;font:500 14px 'Instrument Sans',sans-serif;color:#128A54}
.login-status:empty{display:none}
.login-form{display:flex;flex-direction:column;gap:16px;margin-top:22px}
.login-field{display:flex;flex-direction:column;gap:6px}
.login-label-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.login-label{font:600 14px 'Instrument Sans',sans-serif;color:#0A120E}
.login-forgot{font:500 13px 'Instrument Sans',sans-serif;color:#128A54;text-decoration:none}
.login-forgot:hover{text-decoration:underline}
.login-input{width:100%;font:400 15px 'Instrument Sans',sans-serif;color:#0A120E;background:#FFFDF8;border:1px solid #C9BEA8;border-radius:10px;padding:11px 14px;outline:none;transition:.15s}
.login-input:focus{border-color:#17A063;box-shadow:0 0 0 3px rgba(23,160,99,.18)}
.login-input[aria-invalid='true']{border-color:#8A2318}
.login-field-error{margin:0;font:500 13px 'Instrument Sans',sans-serif;color:#8A2318}
.login-password{position:relative;display:flex;align-items:center}
.login-password .login-input{padding-right:74px}
.login-reveal{position:absolute;right:6px;font:600 13px 'Instrument Sans',sans-serif;color:#4A5248;background:transparent;border:0;border-radius:8px;padding:8px 10px;cursor:pointer}
.login-reveal:hover{color:#0A120E}
.login-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.login-submit{margin-top:2px;width:100%;font:600 15px 'Instrument Sans',sans-serif;color:#F7F2EA;background:#0E2A1D;border:0;border-radius:10px;padding:13px 18px;cursor:pointer;transition:.15s}
.login-submit:hover:not(:disabled){background:#17A063}
.login-submit:disabled{opacity:.6;cursor:not-allowed}

.login-divider{display:flex;align-items:center;gap:12px;margin:22px 0}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:#E5DCCB}
.login-divider span{font:500 13px 'Instrument Sans',sans-serif;color:#6B7369}
.login-providers{display:flex;flex-direction:column;gap:10px}
.login-provider{display:flex;width:100%;align-items:center;justify-content:center;gap:10px;font:600 14.5px 'Instrument Sans',sans-serif;color:#0A120E;background:#FFFDF8;border:1px solid #C9BEA8;border-radius:10px;padding:12px 18px}
.login-provider:disabled{color:#8A8F86;background:#F1EADC;border-color:#DCD2BF;opacity:.75;cursor:not-allowed}
.login-provider:disabled svg{opacity:.55}
.login-provider-reason{margin:2px 0 0;text-align:center;font:400 13px 'Instrument Sans',sans-serif;color:#6B7369}

.login-demo{margin-top:24px;background:#EAF6EF;border:1px solid rgba(18,138,84,.22);border-radius:10px;padding:16px}
.login-demo-heading{margin:0;font:600 15px 'Space Grotesk',sans-serif;color:#0E2A1D}
.login-demo-copy{margin:5px 0 0;font:400 13.5px/1.45 'Instrument Sans',sans-serif;color:#3D5A4B}
.login-demo-list{margin:12px 0 0;display:flex;flex-direction:column;gap:5px}
.login-demo-list>div{display:flex;gap:8px;font:500 13.5px 'Instrument Sans',sans-serif}
.login-demo-list dt{min-width:74px;color:#4A5248}
.login-demo-list dd{margin:0;color:#0A120E;font-weight:600;word-break:break-all}
.login-demo-fill{margin-top:13px;width:100%;font:600 14px 'Instrument Sans',sans-serif;color:#0E2A1D;background:transparent;border:1px solid rgba(14,42,29,.35);border-radius:10px;padding:10px 16px;cursor:pointer;transition:.15s}
.login-demo-fill:hover{background:#0E2A1D;color:#F7F2EA}

@media(min-width:960px){
  .login-page{grid-template-columns:minmax(380px,42%) 1fr}
  .login-brand{border-bottom:0;justify-content:center;gap:26px;padding:clamp(40px,5vw,64px)}
  .login-brand-statement{font-size:17px;max-width:26ch}
  .login-panel{padding:clamp(40px,5vw,64px)}
}
      `}</style>
    </main>
  )
}
