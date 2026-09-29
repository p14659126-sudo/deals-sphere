import React, { useState, useEffect } from 'react';
import { MarketProduct } from '../types';
import { normalizeProductLink, getDomainFromUrl } from '../utils/url';
import { 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  product: MarketProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurchase: (product: MarketProduct) => void;
}

export const RedirectingModal: React.FC<Props> = ({
  product,
  isOpen,
  onClose,
  onConfirmPurchase,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const targetUrl = normalizeProductLink(product.productLink);
  const domainName = getDomainFromUrl(product.productLink);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 shadow-sm">
          <ArrowUpRight className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">
            Store Tab Opened
          </span>
          <h3 className="font-display font-bold text-xl text-slate-900">
            Redirecting to Seller Store
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Opening destination listing on <strong className="text-slate-800">{domainName}</strong>
          </p>
        </div>

        {/* Product Card Summary */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl flex items-center gap-3 text-left">
          {product.imageUrl && product.imageUrl.trim() !== '' && (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-14 h-14 object-contain rounded-xl bg-white border border-slate-200 p-1 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
              {product.title}
            </h4>
            <div className="text-[11px] text-slate-500">
              Curated by: <span className="font-medium text-slate-800">{product.sellerName}</span>
            </div>
            <div className="text-xs font-black text-slate-900 font-tabular">
              {product.currency}{product.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Fallback Direct Link in case popup was blocked */}
        <div className="flex items-center gap-2">
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Re-open Seller Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-medium text-xs flex items-center justify-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Purchase Confirmation Section */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Did you complete the purchase on {domainName}?
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Products are only recorded in your <strong>Orders</strong> history if you completed the purchase.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onConfirmPurchase(product)}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Yes, I Bought It</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all"
            >
              <span>Not Yet / Browsing</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Orders history is reserved exclusively for confirmed purchases</span>
        </div>
      </div>
    </div>
  );
};
