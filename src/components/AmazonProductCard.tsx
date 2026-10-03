import React from 'react';
import { MarketProduct } from '../types';
import { Star, ShoppingBag, ExternalLink, ShieldCheck, Tag, ArrowUpRight, Store, Ticket, Percent } from 'lucide-react';
import { getDomainFromUrl } from '../utils/url';
import { getProductStoreGroup, getStoreGroupConfig } from '../utils/merchant';

interface Props {
  product: MarketProduct;
  viewMode?: 'grid' | 'list';
  onSelectProduct?: (product: MarketProduct) => void;
  onSelect?: (product: MarketProduct) => void;
  onAddToCart: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenChannel?: (channelUsername: string) => void;
}

export const AmazonProductCard: React.FC<Props> = ({
  product,
  viewMode = 'grid',
  onSelectProduct,
  onSelect,
  onAddToCart,
  onBuyNow,
  onOpenChannel,
}) => {
  const handleSelect = onSelectProduct || onSelect || (() => {});
  const originalPrice = product.originalPrice || product.mrp || product.price;
  const discountPercent = originalPrice > product.price
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : (product.discount || 0);

  const savingsAmount = originalPrice > product.price
    ? originalPrice - product.price
    : 0;

  const destinationDomain = product.merchant || getDomainFromUrl(product.productLink);

  const storeGroup = getProductStoreGroup(product);
  const storeConfig = getStoreGroupConfig(storeGroup);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* Clickable Image & Main Info Area */}
      <div 
        className="cursor-pointer"
        onClick={() => handleSelect(product)}
      >
        {/* Product Image Frame */}
        <div className="relative w-full h-52 sm:h-56 bg-slate-50/50 flex items-center justify-center overflow-hidden border-b border-slate-100 p-4">
          {product.imageUrl && product.imageUrl.trim() !== '' ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.img-fallback');
                  if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                }
              }}
            />
          ) : null}

          {/* Styled Image Fallback */}
          <div className={`img-fallback ${product.imageUrl && product.imageUrl.trim() !== '' ? 'hidden' : ''} flex flex-col items-center justify-center text-center p-3 text-slate-400`}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-1 shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-500 line-clamp-1">{product.category}</span>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            {/* Store Group Badge: e.g. from: Amazon / from: Flipkart / from: Meesho */}
            <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 ${storeConfig.badgeClass}`}>
              <span>{storeConfig.icon}</span>
              <span>{storeConfig.badgeLabel}</span>
            </span>

            {discountPercent > 0 && (
              <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" />
                <span>{discountPercent}% OFF</span>
              </span>
            )}

            {product.couponCode && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Ticket className="w-2.5 h-2.5" />
                <span>{product.couponCode}</span>
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-700 border border-slate-200/80 shadow-xs">
            {product.category}
          </div>
        </div>

        {/* Product Information Body */}
        <div className="p-4 space-y-2.5 text-left">
          
          {/* Store / Destination Domain Tag */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
              <Store className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{destinationDomain}</span>
            </span>
            <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Verified Deal
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Ratings & Reviews */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800 ml-1 font-tabular">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 text-[11px] font-tabular">
              {product.reviewCount.toLocaleString()} reviews
            </span>
          </div>

          {/* Price Block */}
          <div className="pt-1 space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 font-tabular tracking-tight">
                {product.currency}{product.price.toLocaleString()}
              </span>

              {originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-tabular">
                  {product.currency}{originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {savingsAmount > 0 && (
              <div className="text-[11px] font-semibold text-emerald-700">
                You save {product.currency}{savingsAmount.toLocaleString()}
              </div>
            )}
          </div>

          {/* Channel attribution */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate">
              By{' '}
              <strong 
                onClick={(e) => {
                  if (product.channelUsername && onOpenChannel) {
                    e.stopPropagation();
                    onOpenChannel(product.channelUsername);
                  }
                }}
                className={`text-slate-800 font-semibold ${product.channelUsername ? 'hover:text-indigo-600 hover:underline cursor-pointer' : ''}`}
              >
                {product.channelName || product.sellerName}
              </strong>
            </span>
            {product.channelUsername && (
              <span className="text-[10px] text-indigo-600 font-medium">
                @{product.channelUsername}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two-Button Action Cluster */}
      <div className="p-3 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full py-2 px-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
          title="Save to Cart"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
          <span>Save</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuyNow(product);
          }}
          className="w-full py-2 px-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          title="Open product on external store"
        >
          <span>Buy Now</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
