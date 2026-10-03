import React, { useState, useEffect, useRef } from 'react';
import { MarketProduct } from '../types';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Play, 
  Pause,
  Award,
  ShieldCheck,
  Tag,
  Star,
  ChevronRight
} from 'lucide-react';

export const REWARDED_TEST_AD_UNIT_ID = 'ddcf7d341d3bffc2ba9a47de625c49cf697a5587';
export const TEST_AD_CLIENT = 'ca-pub-ddcf7d341d3bffc2ba9a47de625c49cf697a5587';
export const REWARDED_TEST_AD_SLOT = 'ddcf7d341d3bffc2ba9a47de625c49cf697a5587';

interface Props {
  isOpen: boolean;
  product: MarketProduct | null;
  onClose: () => void;
  onRewardGranted: (product: MarketProduct) => void;
  adUnitId?: string;
}

export const RewardedAdModal: React.FC<Props> = ({
  isOpen,
  product,
  onClose,
  onRewardGranted,
  adUnitId = REWARDED_TEST_AD_UNIT_ID,
}) => {
  const TOTAL_DURATION = 5; // 5-second rewarded test ad countdown
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const adSlotRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(TOTAL_DURATION);
      setIsCompleted(false);
      setIsPlaying(true);
      setShowExitWarning(false);
      setHasInteracted(false);

      // Attempt to invoke real adsbygoogle push if loaded
      if (typeof window !== 'undefined' && !pushedRef.current) {
        try {
          if (adSlotRef.current && (window as any).adsbygoogle) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            pushedRef.current = true;
          }
        } catch (e) {
          console.warn('AdMob Rewarded push info:', e);
        }
      }
    }
  }, [isOpen, product]);

  // Handle countdown timer
  useEffect(() => {
    if (!isOpen || isCompleted || !isPlaying || showExitWarning) return;

    if (timeLeft <= 0) {
      setIsCompleted(true);
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, timeLeft, isCompleted, isPlaying, showExitWarning]);

  if (!isOpen || !product) return null;

  const handleCloseAttempt = () => {
    if (isCompleted) {
      onRewardGranted(product);
      onClose();
    } else {
      setShowExitWarning(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    onClose();
  };

  const handleResumeAd = () => {
    setShowExitWarning(false);
    setIsPlaying(true);
  };

  const handleClaimReward = () => {
    setIsCompleted(true);
    onRewardGranted(product);
    onClose();
  };

  const progressPercent = Math.min(100, Math.round(((TOTAL_DURATION - timeLeft) / TOTAL_DURATION) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Test Ad Top Bar */}
        <div className="bg-slate-950/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs">
              Test Ad
            </span>
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[190px] sm:max-w-none">
              AdMob: <strong className="text-indigo-400">{adUnitId}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Countdown or Close Button */}
            {isCompleted ? (
              <button
                onClick={handleCloseAttempt}
                className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                title="Claim reward and close"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCloseAttempt}
                className="text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                title="Reward timer"
              >
                <span>Reward in {timeLeft}s</span>
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 transition-all duration-1000 ease-linear"
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </div>

        {/* Real AdSense / AdMob Hidden/Mount Container for Google Script Integration */}
        <div className="hidden" aria-hidden="true">
          <ins
            ref={adSlotRef}
            className="adsbygoogle"
            style={{ display: 'none' }}
            data-ad-client={TEST_AD_CLIENT}
            data-ad-slot={REWARDED_TEST_AD_SLOT}
            data-ad-format="auto"
          />
        </div>

        {/* Video / Interactive Ad Player Canvas */}
        <div className="relative min-h-[300px] sm:min-h-[340px] bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
          
          {/* Subtle animated background particles/glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Reward Target Header Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Reward: <strong>Save Deal to Cart</strong></span>
            </div>

            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full font-mono">
              Rewarded Ad Unit
            </span>
          </div>

          {/* Main Simulated Interactive Video Creative */}
          <div 
            onClick={() => setHasInteracted(true)}
            className="relative z-10 my-4 p-4 sm:p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 backdrop-blur-sm hover:border-indigo-500/60 transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles className="w-7 h-7 text-amber-300" />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>Google AdMob Partner Spotlight</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white truncate mt-0.5 group-hover:text-indigo-300 transition-colors">
                  Deal Sphere Prime Deals & Exclusive Discounts
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  Discover verified Amazon, Flipkart & multi-merchant flash offers curated by top creators.
                </p>

                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Partner
                  </span>
                  <span>•</span>
                  <span>4.9 ★ Rating</span>
                </div>
              </div>
            </div>

            {/* Interactive CTA Banner */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {hasInteracted ? '✓ Interaction recorded' : 'Tap to interact with sponsor'}
              </span>

              <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                <span>Explore Offers</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Reward Status Banner */}
          <div className="relative z-10 bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-indigo-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Unlocking Save Option for:</span>
                <strong className="text-xs text-white truncate block">
                  {product.title}
                </strong>
              </div>
            </div>

            <div className="shrink-0 pl-2">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/70 px-2.5 py-1 rounded-full animate-in zoom-in-75">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Unlocked!</span>
                </span>
              ) : (
                <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full">
                  {timeLeft}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 font-mono block">
              Unit: {REWARDED_TEST_AD_SLOT}
            </span>
            <span className="text-[11px] text-slate-400">
              {isCompleted ? 'Reward is ready to claim' : `Watch ${timeLeft}s to save this deal`}
            </span>
          </div>

          {isCompleted ? (
            <button
              onClick={handleClaimReward}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all active:scale-[0.98] animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Claim & Save Deal</span>
            </button>
          ) : (
            <button
              onClick={handleCloseAttempt}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Exit Warning Dialog (if user attempts to close early) */}
        {showExitWarning && (
          <div className="absolute inset-0 bg-slate-950/95 z-30 flex items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-white">
                  Close ad without reward?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If you close before the timer ends, your reward will not be granted and <strong className="text-white">"{product.title.slice(0, 30)}..."</strong> won't be saved.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleResumeAd}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  Resume & Keep Watching ({timeLeft}s left)
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="w-full py-2 px-4 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Skip Ad & Forfeit Reward
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
