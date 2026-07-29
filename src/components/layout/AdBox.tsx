import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AdBoxComponent = () => {
 const [adError, setAdError] = useState(false);
 const isAdNetworkNone = import.meta.env.VITE_AD_NETWORK === 'none';

 useEffect(() => {
 if (isAdNetworkNone || import.meta.env.VITE_AD_NETWORK !== 'adsense') return;

 if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
 const script = document.createElement('script');
 script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7486443223745997";
 script.async = true;
 script.crossOrigin = "anonymous";
 script.onerror = () => setAdError(true);
 document.head.appendChild(script);
 }

 try {
 if (typeof window !== 'undefined') {
 setTimeout(() => {
 try {
 (window.adsbygoogle = window.adsbygoogle || []).push({});
 } catch (e) {
 console.error('AdSense push error', e);
 setAdError(true);
 }
 }, 100);
 }
 } catch (e) {
 console.error('AdSense setup error', e);
 }
 }, [isAdNetworkNone]);

 const showFallback = adError || isAdNetworkNone;

 return (
 <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid var(--border-color)', textAlign: 'center', overflow: 'hidden', flexShrink: 0 }}>
 {!showFallback && (
 <>
 <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
 Advertisement
 </div>
 <ins className="adsbygoogle"
 style={{ display: 'block', width: '100%', minHeight: '50px' }}
 data-ad-client="ca-pub-7486443223745997"
 data-ad-slot="7891038231"
 data-ad-format="horizontal"
 data-full-width-responsive="true"></ins>
 </>
 )}

 {showFallback && (
 <div style={{
 width: '100%',
 display: 'grid',
 gridTemplateColumns: 'auto 1fr auto',
 alignItems: 'center',
 gap: '1rem',
 padding: '0.25rem 1rem'
 }}>
 <div style={{
 width: '40px',
 height: '40px',
 borderRadius: '8px',
 background: 'rgba(34, 211, 238, 0.1)',
 border: '1px solid rgba(34, 211, 238, 0.2)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 color: '#22d3ee',
 fontWeight: 'bold',
 fontSize: '1.2rem'
 }}>
 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
 <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '1px' }}>
 SUPPORT REBIND
 </span>
 <span style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
 Help keep this EPUB tool 100% free.
 </span>
 </div>
 <a
 href="https://ko-fi.com/ashenara"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[0.9rem] font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100 "
 style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
 >
 Support ❤️
 </a>
 </div>
 )}
 </div>
 );
};

export const AdBox = React.memo(AdBoxComponent, () => true);
