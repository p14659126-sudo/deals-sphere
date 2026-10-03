import React, { useState, useMemo } from 'react';
import { CreatorChannel, MarketProduct, UserAccount, ProductClickEvent } from '../types';
import { AmazonProductCard } from './AmazonProductCard';
import { 
  ArrowLeft, 
  Check, 
  Share2, 
  ExternalLink, 
  Plus, 
  Edit3, 
  BarChart3, 
  Video, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Users, 
  Clock, 
  Play, 
  Calendar, 
  Store, 
  Sparkles,
  Youtube,
  Instagram,
  Globe,
  Tag,
  ArrowUpRight,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { formatSocialCount, getYouTubeEmbedUrl, detectVideoType } from '../utils/video';
import { getDomainFromUrl } from '../utils/url';
import { getProductStoreGroup, getStoreGroupConfig, StoreGroup } from '../utils/merchant';

interface Props {
  channel: CreatorChannel;
  currentUser: UserAccount | null;
  products: MarketProduct[];
  isFollowing: boolean;
  onToggleFollow: (channel: CreatorChannel) => void;
  onBack: () => void;
  onSelectProduct: (product: MarketProduct) => void;
  onAddToCart: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenUpload: () => void;
  onEditChannel?: () => void;
  clickEvents?: ProductClickEvent[];
}

export type ChannelTab = 'home' | 'products' | 'videos' | 'analytics' | 'about';

export const ChannelView: React.FC<Props> = ({
  channel,
  currentUser,
  products,
  isFollowing,
  onToggleFollow,
  onBack,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onOpenUpload,
  onEditChannel,
  clickEvents = [],
}) => {
  const [activeTab, setActiveTab] = useState<ChannelTab>('home');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePlayingVideo, setActivePlayingVideo] = useState<MarketProduct | null>(null);

  const isOwner = currentUser?.id === channel.ownerId;

  // Filter products belonging to this channel
  const channelProducts = useMemo(() => {
    return products.filter(
      (p) => p.channelId === channel.id || p.sellerId === channel.ownerId
    );
  }, [products, channel.id, channel.ownerId]);

  // Store group filter state & grouped view state
  const [selectedStoreGroup, setSelectedStoreGroup] = useState<'all' | StoreGroup>('all');
  const [groupByStore, setGroupByStore] = useState(false);

  // Group counts for store breakdown
  const storeGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    channelProducts.forEach((p) => {
      const g = getProductStoreGroup(p);
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [channelProducts]);

  // Filtered products for display
  const displayedProducts = useMemo(() => {
    if (selectedStoreGroup === 'all') return channelProducts;
    return channelProducts.filter((p) => getProductStoreGroup(p) === selectedStoreGroup);
  }, [channelProducts, selectedStoreGroup]);

  // Products clustered into store groups (for divided view mode)
  const groupedProducts = useMemo(() => {
    const map: Record<string, MarketProduct[]> = {};
    displayedProducts.forEach((p) => {
      const g = getProductStoreGroup(p);
      if (!map[g]) map[g] = [];
      map[g].push(p);
    });
    return map;
  }, [displayedProducts]);

  // Products with video
  const videoProducts = useMemo(() => {
    return channelProducts.filter((p) => p.videoUrl && p.videoUrl.trim().length > 0);
  }, [channelProducts]);

  // Filter clicks related to this channel's products
  const channelClicks = useMemo(() => {
    return clickEvents.filter(
      (c) => c.channelId === channel.id || c.sellerId === channel.ownerId
    );
  }, [clickEvents, channel.id, channel.ownerId]);

  // Analytics Metrics Calculation
  const totalClicksCount = useMemo(() => {
    const fromEvents = channelClicks.length;
    const fromProducts = channelProducts.reduce((sum, p) => sum + (p.clicksCount || 0), 0);
    return Math.max(fromEvents, fromProducts, channel.totalClicks || 0);
  }, [channelClicks, channelProducts, channel.totalClicks]);

  const totalViewsCount = useMemo(() => {
    const fromProducts = channelProducts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    return Math.max(fromProducts, (channel.totalViews || 0) + totalClicksCount * 3);
  }, [channelProducts, channel.totalViews, totalClicksCount]);

  const overallCTR = totalViewsCount > 0 
    ? ((totalClicksCount / totalViewsCount) * 100).toFixed(1)
    : '0.0';

  const memberClicks = useMemo(() => {
    return channelClicks.filter((c) => c.isMember).length;
  }, [channelClicks]);

  const guestClicks = useMemo(() => {
    return Math.max(0, channelClicks.length - memberClicks);
  }, [channelClicks, memberClicks]);

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left pb-16">
      
      {/* Top Navigation Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && onEditChannel && (
            <button
              onClick={onEditChannel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Customize Channel</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-2xs transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Channel Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* YOUTUBE-STYLE CHANNEL HEADER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Channel Banner Cover */}
        <div className="relative w-full h-40 sm:h-56 md:h-64 bg-slate-900 overflow-hidden">
          <img
            src={channel.bannerUrl}
            alt={`${channel.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
          
          <div className="absolute bottom-3 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>{channel.category}</span>
          </div>
        </div>

        {/* Channel Identity & Actions Bar */}
        <div className="p-5 sm:p-7 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            
            {/* Avatar & Info */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={channel.avatarUrl}
                  alt={channel.name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl border-4 border-white shadow-xl object-cover bg-white"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                    {channel.name}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="font-bold text-slate-800">{channel.handle || channel.username}</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-900">
                    {formatSocialCount(channel.followerCount ?? channel.followersCount ?? 0)} {(channel.followerCount ?? channel.followersCount ?? 0) === 1 ? 'follower' : 'followers'}
                  </span>
                  <span>·</span>
                  <span>{channelProducts.length} {channelProducts.length === 1 ? 'deal' : 'deals'} listed</span>
                  {videoProducts.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {videoProducts.length} {videoProducts.length === 1 ? 'video review' : 'video reviews'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Instagram-style Follow & Creator Management */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0">
              {/* Instagram-style Follow Button */}
              <button
                onClick={() => onToggleFollow(channel)}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 ${
                  isFollowing
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>

              {isOwner && (
                <button
                  onClick={onOpenUpload}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition-all"
                  title="List product under this channel"
                >
                  <Plus className="w-4 h-4" />
                  <span>List Deal</span>
                </button>
              )}
            </div>
          </div>

          {/* Bio Preview */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {channel.bio || 'Curated affiliate product recommendations and deals.'}
          </p>

          {/* Social Links Bar */}
          {channel.socialLinks && (
            <div className="flex items-center gap-3 pt-3 text-xs text-slate-500">
              {channel.socialLinks.youtube && (
                <a
                  href={channel.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-rose-600 hover:underline font-medium"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube Channel</span>
                </a>
              )}
              {channel.socialLinks.instagram && (
                <a
                  href={channel.socialLinks.instagram.startsWith('http') ? channel.socialLinks.instagram : `https://instagram.com/${channel.socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-pink-600 hover:underline font-medium"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
              )}
              {channel.socialLinks.website && (
                <a
                  href={channel.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Website</span>
                </a>
              )}
            </div>
          )}

          {/* YOUTUBE-STYLE CHANNEL NAVIGATION TABS */}
          <div className="flex items-center gap-6 border-b border-slate-200 mt-6 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-3 relative transition-colors whitespace-nowrap ${
                activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Home
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'products' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Products &amp; Deals</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                {channelProducts.length}
              </span>
              {activeTab === 'products' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'videos' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-500" />
              <span>Videos &amp; Reviews</span>
              {videoProducts.length > 0 && (
                <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">
                  {videoProducts.length}
                </span>
              )}
              {activeTab === 'videos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            {/* Analytics Tab (Special for Creator/Owner) */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'analytics' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Channel Analytics</span>
              {isOwner && (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
                  Creator View
                </span>
              )}
              {activeTab === 'analytics' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 relative transition-colors whitespace-nowrap ${
                activeTab === 'about' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              About
              {activeTab === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: HOME */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Featured Showcase Item (if products exist) */}
          {channelProducts.length > 0 ? (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-3 z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Featured Channel Deal
                    </span>
                    {channelProducts[0].videoUrl && (
                      <span className="bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Video Included
                      </span>
                    )}
                  </div>

                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white leading-snug">
                    {channelProducts[0].title}
                  </h2>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {channelProducts[0].description}
                  </p>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-2xl font-black text-white font-tabular">
                      {channelProducts[0].currency}{channelProducts[0].price.toLocaleString()}
                    </span>
                    {channelProducts[0].originalPrice > channelProducts[0].price && (
                      <span className="text-xs text-slate-400 line-through">
                        {channelProducts[0].currency}{channelProducts[0].originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => onBuyNow(channelProducts[0])}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                    >
                      <span>Buy on {getDomainFromUrl(channelProducts[0].productLink)}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectProduct(channelProducts[0])}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full border border-white/20 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 flex items-center justify-center z-10">
                  <div 
                    onClick={() => onSelectProduct(channelProducts[0])}
                    className="relative cursor-pointer group bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm"
                  >
                    <img
                      src={channelProducts[0].imageUrl}
                      alt={channelProducts[0].title}
                      className="max-h-56 max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                    />
                    {channelProducts[0].videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* All Listings from this channel divided into store groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Channel Listings</span>
                <span className="text-xs font-semibold text-slate-500">({channelProducts.length})</span>
              </h3>

              <div className="flex items-center gap-2">
                {channelProducts.length > 0 && (
                  <button
                    onClick={() => setGroupByStore(!groupByStore)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      groupByStore
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{groupByStore ? 'Divided by Store' : 'Divide by Store'}</span>
                  </button>
                )}

                {isOwner && (
                  <button
                    onClick={onOpenUpload}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Store Group Filter Tabs */}
            {channelProducts.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedStoreGroup('all')}
                  className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap ${
                    selectedStoreGroup === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  All Stores ({channelProducts.length})
                </button>

                {Object.entries(storeGroupCounts).map(([groupName, count]) => {
                  const cfg = getStoreGroupConfig(groupName as StoreGroup);
                  const isActive = selectedStoreGroup === groupName;
                  return (
                    <button
                      key={groupName}
                      onClick={() => setSelectedStoreGroup(isActive ? 'all' : (groupName as StoreGroup))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : `${cfg.badgeClass} hover:border-slate-300`
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.badgeLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {channelProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-base text-slate-900">No products uploaded yet</h4>
                <p className="text-xs text-slate-500">
                  {isOwner 
                    ? 'As the channel creator, you can now add photos, videos, and affiliate links!' 
                    : 'This creator has not listed any affiliate products yet.'}
                </p>
                {isOwner && (
                  <button
                    onClick={onOpenUpload}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all"
                  >
                    List Your First Product
                  </button>
                )}
              </div>
            ) : groupByStore ? (
              /* Divided into Different Store Groups */
              <div className="space-y-6">
                {Object.entries(groupedProducts).map(([groupName, prods]) => {
                  const cfg = getStoreGroupConfig(groupName as StoreGroup);
                  return (
                    <div key={groupName} className="bg-slate-50/70 rounded-3xl border border-slate-200/90 p-4 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shadow-2xs">
                            {cfg.icon}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                              <span>From {cfg.displayName}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
                                {prods.length} {prods.length === 1 ? 'item' : 'items'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-500">Curated store selection with verified links</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {prods.map((product) => (
                          <AmazonProductCard
                            key={product.id}
                            product={product}
                            onSelect={onSelectProduct}
                            onAddToCart={onAddToCart}
                            onBuyNow={onBuyNow}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {displayedProducts.map((product) => (
                  <AmazonProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PRODUCTS & DEALS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold text-base text-slate-900">
              All Products by {channel.name} ({channelProducts.length})
            </h3>
            
            <div className="flex items-center gap-2">
              {channelProducts.length > 0 && (
                <button
                  onClick={() => setGroupByStore(!groupByStore)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    groupByStore
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{groupByStore ? 'Divided by Store' : 'Divide by Store'}</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={onOpenUpload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>List Product</span>
                </button>
              )}
            </div>
          </div>

          {/* Store Group Filter Tabs */}
          {channelProducts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedStoreGroup('all')}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap ${
                  selectedStoreGroup === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All Stores ({channelProducts.length})
              </button>

              {Object.entries(storeGroupCounts).map(([groupName, count]) => {
                const cfg = getStoreGroupConfig(groupName as StoreGroup);
                const isActive = selectedStoreGroup === groupName;
                return (
                  <button
                    key={groupName}
                    onClick={() => setSelectedStoreGroup(isActive ? 'all' : (groupName as StoreGroup))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : `${cfg.badgeClass} hover:border-slate-300`
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.badgeLabel}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {channelProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-xs text-slate-500">No products uploaded by this channel yet.</p>
            </div>
          ) : groupByStore ? (
            /* Divided into Different Store Groups */
            <div className="space-y-6">
              {Object.entries(groupedProducts).map(([groupName, prods]) => {
                const cfg = getStoreGroupConfig(groupName as StoreGroup);
                return (
                  <div key={groupName} className="bg-slate-50/70 rounded-3xl border border-slate-200/90 p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shadow-2xs">
                          {cfg.icon}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                            <span>From {cfg.displayName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
                              {prods.length} {prods.length === 1 ? 'item' : 'items'}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">Curated store selection with verified links</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {prods.map((product) => (
                        <AmazonProductCard
                          key={product.id}
                          product={product}
                          onSelect={onSelectProduct}
                          onAddToCart={onAddToCart}
                          onBuyNow={onBuyNow}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayedProducts.map((product) => (
                <AmazonProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: VIDEOS & REVIEWS */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {/* Active Video Player Modal/Display if playing */}
          {activePlayingVideo && (
            <div className="bg-slate-950 text-white rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-xs sm:text-sm text-white truncate max-w-lg">
                    {activePlayingVideo.videoTitle || activePlayingVideo.title}
                  </span>
                </div>
                <button
                  onClick={() => setActivePlayingVideo(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-full bg-slate-800"
                >
                  Close Player
                </button>
              </div>

              {/* Video Embed Frame */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                {activePlayingVideo.videoUrl && detectVideoType(activePlayingVideo.videoUrl) === 'youtube' ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activePlayingVideo.videoUrl) || ''}
                    title={activePlayingVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={activePlayingVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Direct Affiliate Shop Bar under Video */}
              <div className="bg-slate-900/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={activePlayingVideo.imageUrl}
                    alt={activePlayingVideo.title}
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      {activePlayingVideo.title}
                    </h4>
                    <span className="text-emerald-400 font-extrabold text-sm font-tabular">
                      {activePlayingVideo.currency}{activePlayingVideo.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onAddToCart(activePlayingVideo)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-semibold"
                  >
                    Save to Cart
                  </button>
                  <button
                    onClick={() => onBuyNow(activePlayingVideo)}
                    className="flex-1 sm:flex-initial px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <span>Buy Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-500" />
                <span>Video Product Reviews &amp; Demos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Watch detailed unboxings, demos, and buy directly with creator affiliate links
              </p>
            </div>

            {isOwner && (
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Video Deal</span>
              </button>
            )}
          </div>

          {videoProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <Video className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-slate-900">No video reviews yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isOwner 
                  ? 'Sellers can attach YouTube video URLs or direct video clips to any product listing so buyers can watch before they purchase!' 
                  : 'This channel has not posted any video reviews yet.'}
              </p>
              {isOwner && (
                <button
                  onClick={onOpenUpload}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-all"
                >
                  Upload Deal with Video
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {videoProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  {/* Video Thumbnail Frame with Play Button */}
                  <div
                    onClick={() => setActivePlayingVideo(product)}
                    className="relative w-full aspect-video bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

                    <div className="absolute w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white text-[10px] font-semibold flex items-center gap-1">
                      <Video className="w-3 h-3 text-rose-400" />
                      <span>Review Video</span>
                    </div>
                  </div>

                  {/* Video & Product Metadata */}
                  <div className="p-4 space-y-2 text-left flex-1 flex flex-col justify-between">
                    <div>
                      <h4 
                        onClick={() => onSelectProduct(product)}
                        className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {product.videoTitle || product.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm font-tabular">
                        {product.currency}{product.price.toLocaleString()}
                      </span>

                      <button
                        onClick={() => onBuyNow(product)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <span>Buy Deal</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: ANALYTICS OPTION FOR WHO CREATE CHANNEL */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/30 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  Channel Creator Performance
                </span>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl mt-1">
                  Affiliate Clicks &amp; Member Analytics
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Track how many members and visitors click on your affiliate product links
                </p>
              </div>

              {isOwner ? (
                <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Channel Owner Verified</span>
                </div>
              ) : (
                <div className="bg-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">
                  Public Channel Insights
                </div>
              )}
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Product Clicks */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Product Clicks</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular">
                {totalClicksCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Outbound clicks redirected to your affiliate store
              </p>
            </div>

            {/* 2. Total Impressions / Views */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Product Impressions</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular">
                {totalViewsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Total times your listings were viewed by shoppers
              </p>
            </div>

            {/* 3. Click-Through Rate (CTR) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Conversion CTR</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-tabular">
                {overallCTR}%
              </div>
              <p className="text-[11px] text-slate-500">
                Ratio of clicks to total product impressions
              </p>
            </div>

            {/* 4. Total Followers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Channel Followers</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-tabular">
                {(channel.followerCount ?? channel.followersCount ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                Active followers receiving your deal updates
              </p>
            </div>
          </div>

          {/* Member vs Guest Clicks breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4">
            <h4 className="font-bold text-sm text-slate-900">
              Audience Click Distribution
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900">Registered Members</span>
                  <p className="text-[11px] text-indigo-700">Authenticated DealSphere buyers</p>
                </div>
                <div className="text-xl font-black text-indigo-900 font-tabular">
                  {memberClicks}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Guest Visitors</span>
                  <p className="text-[11px] text-slate-500">Public browsing shoppers</p>
                </div>
                <div className="text-xl font-black text-slate-800 font-tabular">
                  {guestClicks}
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Product Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Performance by Product Listing
                </h4>
                <p className="text-xs text-slate-500">
                  Clicks recorded when customers clicked to buy your product
                </p>
              </div>
            </div>

            {channelProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No products uploaded yet. Upload products to track analytics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Product Listing</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Product Clicks</th>
                      <th className="py-3 px-4">Impressions</th>
                      <th className="py-3 px-4">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {channelProducts.map((p) => {
                      const prodClicks = p.clicksCount || channelClicks.filter(c => c.productId === p.id).length;
                      const prodViews = p.viewsCount || Math.max(1, prodClicks * 4);
                      const ctr = ((prodClicks / prodViews) * 100).toFixed(1);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                              />
                              <div className="min-w-0 max-w-xs">
                                <span className="font-semibold text-slate-900 block truncate">
                                  {p.title}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold font-tabular text-slate-800">
                            {p.currency}{p.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                              {getDomainFromUrl(p.productLink)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-600 font-tabular">
                            {prodClicks}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-tabular">
                            {prodViews}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 font-tabular">
                            {ctr}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ABOUT */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="font-display font-bold text-base text-slate-900">
              About {channel.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {channel.bio || 'Curated deal channel verified on DealSphere.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">Channel Details</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span>Category: <strong className="text-slate-800">{channel.category}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Joined DealSphere: <strong className="text-slate-800">September 2026</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Affiliate Seller</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">Channel Statistics</h4>
              <div className="space-y-2 text-slate-600">
                <div>Total Followers: <strong className="text-slate-800">{(channel.followerCount ?? channel.followersCount ?? 0).toLocaleString()}</strong></div>
                <div>Products Listed: <strong className="text-slate-800">{channelProducts.length}</strong></div>
                <div>Video Reviews: <strong className="text-slate-800">{videoProducts.length}</strong></div>
                <div>Total Product Clicks: <strong className="text-slate-800">{totalClicksCount.toLocaleString()}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
