'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const links=[['Services','/services'],['Industries','/industries'],['Process','/process'],['Case Studies','/case-studies'],['About','/about']]

export function Navbar(){
 const pathname=usePathname()
 const [open,setOpen]=useState(false)
 const triggerRef=useRef<HTMLButtonElement>(null)
 const menuRef=useRef<HTMLDivElement>(null)

 useEffect(()=>{
  if(!open)return
  const prevOverflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  const firstLink=menuRef.current?.querySelector<HTMLElement>('a,button')
  firstLink?.focus()
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){setOpen(false);triggerRef.current?.focus();return}
   if(e.key!=='Tab'||!menuRef.current)return
   const focusables=menuRef.current.querySelectorAll<HTMLElement>('a,button')
   if(focusables.length===0)return
   const first=focusables[0],last=focusables[focusables.length-1]
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',onKey)
  return ()=>{document.body.style.overflow=prevOverflow;document.removeEventListener('keydown',onKey)}
 },[open])

 useEffect(()=>{setOpen(false)},[pathname])

 return <><nav className="site-navbar"><div><Link href="/" className="site-logo"><img src="/assets/logo-mark.svg" alt=""/><span>Code<b>Outfitters</b></span></Link><div className="site-links">{links.map(([label,href])=>pathname===href?<span key={href}>{label}</span>:<Link key={href} href={href}>{label}</Link>)}</div>{pathname==='/contact'?<span className="site-nav-current">Contact</span>:<Link className="site-nav-cta" href="/contact">Book a Call</Link>}<button ref={triggerRef} type="button" className="site-nav-toggle" aria-expanded={open} aria-controls="site-mobile-menu" aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(v=>!v)}><span/><span/><span/></button></div></nav>{open?<div id="site-mobile-menu" className="site-mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" ref={menuRef}><button type="button" className="site-mobile-close" aria-label="Close menu" onClick={()=>{setOpen(false);triggerRef.current?.focus()}}>Close</button><div className="site-mobile-links">{links.map(([label,href])=>pathname===href?<span key={href}>{label}</span>:<Link key={href} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}<Link href="/contact" onClick={()=>setOpen(false)}>{pathname==='/contact'?'Contact':'Book a Call'}</Link></div></div>:null}<style>{`
 .site-navbar{position:sticky;top:0;z-index:50;background:rgba(247,242,234,.92);backdrop-filter:blur(14px);border-bottom:1px solid #E5DCCB}.site-navbar>div{max-width:1180px;min-height:68px;margin:0 auto;padding:10px clamp(16px,3vw,32px);display:flex;align-items:center;justify-content:space-between;gap:14px}.site-logo{display:flex;align-items:center;gap:10px;text-decoration:none;white-space:nowrap;flex-shrink:0}.site-logo img{width:28px;height:28px}.site-logo span{font:600 19px 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.01em}.site-logo b{color:#17A063}.site-links{display:flex;align-items:center;gap:clamp(14px,2vw,28px)}.site-links a,.site-links span{white-space:nowrap;font:500 15px 'Instrument Sans',sans-serif;color:#4A5248;text-decoration:none}.site-links span{font-weight:600;color:#128A54}.site-nav-current{font:600 14px 'Instrument Sans',sans-serif;color:#128A54;background:#EAF6EF;border:1px solid rgba(18,138,84,.25);border-radius:10px;padding:11px 18px;white-space:nowrap}.site-nav-cta{font:600 14px 'Instrument Sans',sans-serif;color:#F7F2EA;background:#0E2A1D;border-radius:10px;padding:11px 18px;white-space:nowrap;text-decoration:none;transition:.15s}.site-nav-cta:hover{color:#F7F2EA;background:#17A063;transform:translateY(-1px)}.site-nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:40px;height:40px;background:transparent;border:1px solid #E5DCCB;border-radius:8px;flex-shrink:0}.site-nav-toggle span{display:block;width:18px;height:2px;background:#0A120E;border-radius:1px}.site-mobile-menu{position:fixed;inset:0;z-index:60;background:#F7F2EA;padding:20px clamp(16px,4vw,32px);display:flex;flex-direction:column;gap:20px}.site-mobile-close{align-self:flex-end;font:600 14px 'Instrument Sans',sans-serif;color:#4A5248;background:transparent;border:1px solid #E5DCCB;border-radius:10px;padding:9px 16px}.site-mobile-links{display:flex;flex-direction:column;gap:22px;padding-top:12px}.site-mobile-links a,.site-mobile-links span{font:600 22px 'Space Grotesk',sans-serif;color:#0A120E;text-decoration:none}.site-mobile-links span{color:#128A54}@media(max-width:960px){.site-links{display:none}.site-nav-toggle{display:flex}}@media(min-width:961px){.site-mobile-menu{display:none}}@media(max-width:420px){.site-navbar>div{min-height:60px;padding-top:8px;padding-bottom:8px}.site-logo span{font-size:17px}.site-logo img{width:25px;height:25px}.site-nav-cta,.site-nav-current{font-size:12.5px;padding:9px 13px}.site-nav-toggle{width:36px;height:36px}}
 `}</style></>
}
