import React, { useState } from 'react';
import { MarketProduct, Channel } from '../types';
import { 
  ArrowLeft, 
  Star, 
  ShoppingBag, 
  ArrowUpRight, 
  ShieldCheck, 
  Store, 
  Share2, 
  Check, 
  Tag,
  ExternalLink,
  Clock,
  Sparkles,
  Ticket,
  Truck,
  Flag,
  Copy,
  Percent,
  Video
} from 'lucide-react';
import { getDomainFromUrl, normalizeProductLink } from '../utils/url';
import { getProductStoreGroup, getStoreGroupConfig } from '../utils/merchant';
import { AdBanner, ACTIVE_AD_CODE } from './AdBanner';

interface Props {
  product: MarketProduct;
  channel?: Channel | null;
  onBack: () => void;
  onAddToCart: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenChannelProfile?: (channelUsername: string) => void;
  onOpenReport?: (type: 'product', id: string, title: string) => void;
}

export const ProductDetailView: React.FC<Props> = ({
  product,
  channel,
  onBack,
  onAddToCart,
  onBuyNow,
  onOpenChannelProfile,
  onOpenReport,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewingVideo, setViewingVideo] = useState(false);

  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    const ytMatch = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.exec(url);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return null;
  };

  const images = (product.images && product.images.length > 0)
    ? product.images.filter((img) => typeof img === 'string' && img.trim() !== '')
    : (product.imageUrl && product.imageUrl.trim() !== '' ? [product.imageUrl] : []);

  const currentDisplayImage = images[activeImageIndex] || (product.imageUrl && product.imageUrl.trim() !== '' ? product.imageUrl : null);

  const originalPrice = product.originalPrice || product.mrp || product.price;
  const discountPercent = originalPrice > product.price
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : (product.discount || 0);

  const savingsAmount = originalPrice > product.price
    ? originalPrice - product.price
    : 0;

  const domain = product.merchant || getDomainFromUrl(product.productLink);

  const handleAddToCartClick = () => {
    onAddToCart(product);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleShare = () => {
    try {
      const shareUrl = `${window.location.origin}/#/product/${product.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      //
    }
  };

  const handleCopyCoupon = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-left">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenReport && (
            <button
              onClick={() => onOpenReport('product', product.id, product.title)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Report product"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Product'}</span>
          </button>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Product Gallery / Video */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 flex items-center justify-center relative min-h-[380px] shadow-xs overflow-hidden">
            {viewingVideo && product.videoUrl ? (
              <div className="w-full h-full min-h-[340px] flex items-center justify-center bg-black rounded-2xl overflow-hidden aspect-video">
                {getEmbedVideoUrl(product.videoUrl) ? (
                  <iframe
                    src={getEmbedVideoUrl(product.videoUrl)!}
                    title={product.title}
                    className="w-full h-full min-h-[340px]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={product.videoUrl}
                    controls
                    className="w-full h-full max-h-[360px] object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt={product.title}
                className="max-h-[360px] max-w-full object-contain rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300 mb-2" />
                <span className="text-xs">No image provided</span>
              </div>
            )}

            {discountPercent > 0 && !viewingVideo && (
              <span className="absolute top-4 left-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Percent className="w-3 h-3" />
                <span>{discountPercent}% OFF</span>
              </span>
            )}

            <span className="absolute top-4 right-4 bg-white/95 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
              {product.category}
            </span>
          </div>

          {/* Multiple Image Thumbnails and Video Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveImageIndex(idx);
                  setViewingVideo(false);
                }}
                className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-white p-1 shrink-0 transition-all ${
                  !viewingVideo && activeImageIndex === idx ? 'border-indigo-600 shadow-xs ring-2 ring-indigo-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
              </button>
            ))}

            {product.videoUrl && (
              <button
                onClick={() => setViewingVideo(true)}
                className={`h-14 px-3 rounded-xl border-2 overflow-hidden flex items-center gap-1.5 shrink-0 text-xs font-bold transition-all ${
                  viewingVideo 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100 shadow-xs' 
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Watch Video</span>
              </button>
            )}
          </div>

          {/* Video Preview Link if available */}
          {product.videoUrl && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Product Video Available</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingVideo(!viewingVideo)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  {viewingVideo ? 'View Photos' : 'Play Video Here'}
                </button>
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information & Direct Action Card */}
        <div className="lg:col-span-6 space-y-5">
          
          <div className="space-y-3">
            {/* Merchant, Type, Store Group & Verification Tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {(() => {
                const group = getProductStoreGroup(product);
                const cfg = getStoreGroupConfig(group);
                return (
                  <span className={`inline-flex items-center gap-1 font-bold border px-2.5 py-0.5 rounded-full shadow-2xs ${cfg.badgeClass}`}>
                    <span>{cfg.icon}</span>
                    <span>{cfg.badgeLabel}</span>
                  </span>
                );
              })()}

              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <span>{domain}</span>
              </span>

              {product.productType && (
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  <span>{product.productType}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Deal</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 leading-snug">
              {product.title}
            </h1>

            {/* Channel / Seller Attribution Card */}
            {(product.channelUsername || product.sellerName) && (
              <div 
                onClick={() => {
                  if (product.channelUsername && onOpenChannelProfile) {
                    onOpenChannelProfile(product.channelUsername);
                  }
                }}
                className={`bg-slate-50/90 border border-slate-200 rounded-2xl p-3 flex items-center justify-between ${
                  product.channelUsername ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={(product.channelLogo && product.channelLogo.trim() !== '') ? product.channelLogo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(product.channelName || product.sellerName || 'Seller')}`}
                    alt={product.channelName || product.sellerName}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-white"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(product.channelName || product.sellerName || 'Seller')}`;
                    }}
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                      Offered by Channel
                    </span>
                    <strong className="text-xs text-slate-900 font-bold block">
                      {product.channelName || product.sellerName}
                    </strong>
                    {product.channelUsername && (
                      <span className="text-[11px] text-indigo-600 font-semibold block">
                        @{product.channelUsername}
                      </span>
                    )}
                  </div>
                </div>

                {product.channelUsername && (
                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    <span>Visit Store</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            )}

            {/* Ratings */}
            <div className="flex items-center gap-2 text-xs pt-0.5">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900 ml-1 font-tabular">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-tabular">
                {product.reviewCount.toLocaleString()} buyer reviews
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 font-tabular tracking-tight">
                {product.currency}{product.price.toLocaleString()}
              </span>

              {originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through font-tabular">
                  {product.currency}{originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {savingsAmount > 0 && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit">
                You save {product.currency}{savingsAmount.toLocaleString()} ({discountPercent}% discount)
              </div>
            )}

            {/* Coupon / Promo Code Banner if available */}
            {product.couponCode && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-indigo-950 font-bold block">Coupon Offer:</span>
                    <code className="text-indigo-700 font-bold font-mono tracking-wider">
                      {product.couponCode}
                    </code>
                    {product.couponExpiry && (
                      <span className="text-[10px] text-slate-500 block">
                        Expires: {product.couponExpiry}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCoupon(product.couponCode!)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs"
                >
                  {copiedCoupon ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onBuyNow(product)}
                className="py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>View Deal / Buy Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleAddToCartClick}
                className="py-3 px-4 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-full shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>{addedToast ? 'Added to Saved Items!' : 'Save to Cart'}</span>
              </button>
            </div>

            {/* Delivery / Shipping Info */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
              <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{product.shippingInfo || 'Free Standard Delivery'}</span>
              {product.deliveryInfo && (
                <>
                  <span>·</span>
                  <span>{product.deliveryInfo}</span>
                </>
              )}
            </div>
          </div>

          {/* Highlights / Bullet Features */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                Key Highlights & Specifications
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">
              Product Overview
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || 'No detailed description provided by the seller.'}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Verified Ad Banner Placement on Product Details */}
      <AdBanner placement="detail" adUnitId={ACTIVE_AD_CODE} />
    </div>
  );
};
