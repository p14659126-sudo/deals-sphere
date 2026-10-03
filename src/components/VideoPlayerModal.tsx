import React, { useEffect, useMemo, useState } from 'react';
import { ChannelVideo, MarketProduct, Channel, UserAccount } from '../types';
import { 
  X, 
  Eye, 
  Calendar, 
  Share2, 
  ExternalLink, 
  ShoppingBag, 
  Tag, 
  Check, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Play, 
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { recordVideoView } from '../services/videoService';
import { isFollowing, followChannel, unfollowChannel } from '../services/channelService';
import { getYouTubeEmbedUrl, detectVideoType } from '../utils/video';

interface Props {
  video: ChannelVideo | null;
  isOpen: boolean;
  onClose: () => void;
  products: MarketProduct[];
  channel?: Channel | null;
  currentUser: UserAccount | null;
  onSelectProduct: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenChannel: (username: string) => void;
  onShowToast: (msg: string) => void;
}

export const VideoPlayerModal: React.FC<Props> = ({
  video,
  isOpen,
  onClose,
  products,
  channel,
  currentUser,
  onSelectProduct,
  onBuyNow,
  onOpenChannel,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (isOpen && video) {
      recordVideoView(video.id);
    }
  }, [isOpen, video]);

  useEffect(() => {
    if (currentUser && video?.channelId) {
      isFollowing(currentUser.id, video.channelId).then((val) => setIsFollowed(val));
    }
  }, [currentUser, video?.channelId]);

  const attachedProducts = useMemo(() => {
    if (!video || !video.attachedProductIds || video.attachedProductIds.length === 0) {
      return [];
    }
    return products.filter((p) => video.attachedProductIds.includes(p.id));
  }, [video, products]);

  if (!isOpen || !video) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/channel/${video.channelUsername}?video=${video.id}`;
    try {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      onShowToast('Video link copied!');
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      onShowToast(`Video URL: ${url}`);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !video.channelId) {
      onShowToast('Please sign in to follow this channel.');
      return;
    }
    if (isFollowed) {
      await unfollowChannel(currentUser.id, video.channelId);
      setIsFollowed(false);
      onShowToast(`Unfollowed @${video.channelUsername}`);
    } else {
      await followChannel(currentUser.id, video.channelId);
      setIsFollowed(true);
      onShowToast(`Now following @${video.channelUsername}!`);
    }
  };

  const videoType = detectVideoType(video.videoUrl);
  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);

  const formattedDate = (() => {
    try {
      return new Date(video.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
              VIDEO
            </span>
            <span className="truncate max-w-[280px] sm:max-w-md font-semibold text-slate-200">
              {video.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Share video"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 space-y-5">
          
          {/* Video Player Box */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative shadow-lg border border-slate-800">
            {embedUrl ? (
              <iframe
                src={`${embedUrl}?autoplay=1&rel=0`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : video.videoUrl && (video.videoUrl.endsWith('.mp4') || video.videoUrl.endsWith('.webm')) ? (
              <video
                src={video.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={video.thumbnailUrl}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-60 absolute inset-0"
                  />
                ) : null}
                <div className="relative z-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <h4 className="font-bold text-sm text-white max-w-md mx-auto">{video.title}</h4>
                  {video.videoUrl && (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                    >
                      <span>Open External Video Player</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Info Section */}
          <div className="space-y-4">
            <h1 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
              {video.title}
            </h1>

            {/* Channel Bar (YouTube Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div 
                onClick={() => {
                  onClose();
                  onOpenChannel(video.channelUsername);
                }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                  <img
                    src={video.channelLogo || channel?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelName)}`}
                    alt={video.channelName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                    <span>{video.channelName}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    @{video.channelUsername}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-3 pr-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <strong className="text-slate-300 font-semibold">{video.views || 0}</strong> views
                  </span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>

                {currentUser && currentUser.id !== video.ownerId && (
                  <button
                    onClick={handleToggleFollow}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                      isFollowed
                        ? 'bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 border border-slate-700'
                        : 'bg-white hover:bg-slate-200 text-slate-900 shadow-xs'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Description and tags */}
            {video.description && (
              <div className="bg-slate-800/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-line border border-slate-800">
                <p>{video.description}</p>

                {video.keywords && video.keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    {video.keywords.map((kw, i) => (
                      <span key={i} className="text-indigo-400 hover:underline cursor-pointer">
                        #{kw.replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ATTACHED PRODUCTS SECTION (The core Shopping + Video bridge) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span>Featured Products in this Video</span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800">
                    {attachedProducts.length} Deals
                  </span>
                </h3>
                {video.affiliateLink && (
                  <a
                    href={video.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Creator Affiliate Link</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {attachedProducts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 text-center">
                  No individual products attached to this video yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachedProducts.map((p) => {
                    const discount = p.discount || (p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
                    return (
                      <div
                        key={p.id}
                        className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all group"
                      >
                        <div 
                          onClick={() => {
                            onClose();
                            onSelectProduct(p);
                          }}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 overflow-hidden flex items-center justify-center">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                              {p.merchant || 'Deal Sphere'}
                            </span>
                            <h4 className="font-bold text-xs text-white truncate group-hover:text-indigo-400 transition-colors">
                              {p.title}
                            </h4>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="font-extrabold text-sm text-emerald-400">
                                {p.currency}{p.price.toLocaleString()}
                              </span>
                              {p.originalPrice > p.price && (
                                <span className="text-[11px] text-slate-400 line-through">
                                  {p.currency}{p.originalPrice.toLocaleString()}
                                </span>
                              )}
                              {discount > 0 && (
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* View Deal Button */}
                        <div className="shrink-0 pl-1">
                          <button
                            onClick={() => onBuyNow(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs"
                            title="View Deal"
                          >
                            <span>View Deal</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
