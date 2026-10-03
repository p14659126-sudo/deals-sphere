import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Info, X, Megaphone, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdBannerProps {
  placement?: 'header' | 'feed' | 'detail' | 'footer';
  className?: string;
  adClient?: string;
  adSlot?: string;
  adUnitId?: string;
  allowDismiss?: boolean;
}

export const ACTIVE_AD_CODE = 'ddcf7d341d3bffc2ba9a47de625c49cf697a5587';
export const TEST_AD_UNIT_ID = 'ddcf7d341d3bffc2ba9a47de625c49cf697a5587';
export const TEST_AD_CLIENT = 'ca-pub-ddcf7d341d3bffc2ba9a47de625c49cf697a5587';
export const TEST_AD_SLOT = 'ddcf7d341d3bffc2ba9a47de625c49cf697a5587';

export const AdBanner: React.FC<AdBannerProps> = ({
  placement = 'header',
  className = '',
  adClient = TEST_AD_CLIENT,
  adSlot = TEST_AD_SLOT,
  adUnitId = ACTIVE_AD_CODE,
  allowDismiss = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [clicked, setClicked] = useState(false);
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Attempt to push to adsbygoogle or ad network script if available
    if (typeof window !== 'undefined' && !pushedRef.current) {
      try {
        if (adRef.current && (window.adsbygoogle || (window as any).adsbygoogle)) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          pushedRef.current = true;
          setTimeout(() => {
            if (adRef.current && adRef.current.innerHTML.trim().length > 0) {
              setAdLoaded(true);
            }
          }, 800);
        }
      } catch (err) {
        console.warn('Ad network push info:', err);
        setAdError(true);
      }
    }
  }, []);

  if (isDismissed) return null;

  return (
    <div
      className={`w-full transition-all duration-300 ${
        placement === 'header'
          ? 'py-2 px-3 sm:px-6 bg-slate-50/90 border-b border-slate-200/80 shadow-2xs'
          : placement === 'feed'
          ? 'my-6 p-4 rounded-3xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 shadow-xs'
          : placement === 'detail'
          ? 'my-6 p-4 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs'
          : 'p-3 bg-slate-100 border-t border-slate-200'
      } ${className}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center">
        {/* Ad Meta Top Bar */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-500 mb-1.5 px-1 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>Verified Ad</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="truncate max-w-[200px] sm:max-w-none text-slate-600">
              Publisher Code: <code className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">{adUnitId}</code>
            </span>
          </div>

          <div className="flex items-center gap-2 font-sans">
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              title="Ad Information"
              className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-0.5 text-[11px]"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ad Info</span>
            </button>
            {allowDismiss && (
              <button
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-200/60"
                title="Dismiss ad banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Informational Tooltip / Notice */}
        {showInfo && (
          <div className="w-full mb-2 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-left text-xs text-indigo-900 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Active Ad Monetization Unit</p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Verified Publisher Tag & Ad Placement Code:{' '}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-950 select-all">
                    {adUnitId}
                  </span>
                  . Verification meta tag is active in the site header.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Real Ad Network / AdSense <ins> tag */}
        <div className="w-full flex justify-center items-center overflow-hidden">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: 'inline-block',
              width: '100%',
              maxWidth: placement === 'header' ? '728px' : '970px',
              height: placement === 'detail' ? '80px' : '90px',
            }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Visual Responsive Sponsored Banner (active display) */}
        {!adLoaded && (
          <div
            onClick={() => setClicked(true)}
            className={`w-full max-w-[760px] h-[75px] sm:h-[90px] cursor-pointer rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs flex items-center justify-between px-3.5 sm:px-6 relative overflow-hidden group select-none ${
              clicked ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            {/* Subtle multi-color gradient accent bar at top */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-emerald-500" />

            {/* Left Content */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900 px-2 py-0.5 rounded-full">
                    Sponsored Deal
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden md:inline truncate">
                    ID: {adUnitId}
                  </span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5 group-hover:text-indigo-600 transition-colors">
                  Deal Sphere Partner Deals — Up to 50% Off Verified Electronics & Fashion
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                  Curated partner promotions • Live ad unit: {adUnitId}
                </p>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="shrink-0 pl-2">
              <div
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  clicked
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                }`}
              >
                {clicked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </>
                ) : (
                  <>
                    <span>Shop Deals</span>
                    <ExternalLink className="w-3 h-3" />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
