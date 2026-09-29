import React, { useState, useEffect, useMemo } from 'react';
import { Channel, MarketProduct, UserAccount } from '../types';
import { AmazonProductCard } from './AmazonProductCard';
import { 
  ArrowLeft, 
  Share2, 
  UserPlus, 
  UserCheck, 
  Eye, 
  ShoppingBag, 
  Calendar, 
  Globe, 
  Instagram, 
  Youtube, 
  Twitter, 
  Facebook, 
  Tag, 
  Store, 
  ShieldCheck, 
  ExternalLink,
  Plus,
  Settings,
  Search,
  Check,
  Flag,
  Sparkles,
  Layers,
  Percent
} from 'lucide-react';
import { isFollowing, followChannel, unfollowChannel, recordChannelView } from '../services/channelService';

interface Props {
  channel: Channel;
  products: MarketProduct[];
  currentUser: UserAccount | null;
  onBack: () => void;
  onSelectProduct: (product: MarketProduct) => void;
  onAddToCart: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenDashboard?: () => void;
  onOpenAddProduct?: () => void;
  onOpenEditChannel?: () => void;
  onOpenReport?: (type: 'channel' | 'product', id: string, title: string) => void;
  onRequireAuth?: (reason: 'save' | 'order', title: string, action: () => void) => boolean;
  onShowToast: (msg: string) => void;
}

export const ChannelProfileView: React.FC<Props> = ({
  channel,
  products,
  currentUser,
  onBack,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onOpenDashboard,
  onOpenAddProduct,
  onOpenEditChannel,
  onOpenReport,
  onRequireAuth,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'deals' | 'about'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(channel.followersCount || 0);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = Boolean(currentUser && currentUser.id === channel.ownerId);

  // Check if following
  useEffect(() => {
    if (currentUser) {
      isFollowing(currentUser.id, channel.id).then((val) => setIsFollowed(val));
    } else {
      setIsFollowed(false);
    }
  }, [currentUser, channel.id]);

  // Record view on mount
  useEffect(() => {
    recordChannelView(channel.id, currentUser?.id);
  }, [channel.id, currentUser?.id]);

  // Channel products
  const channelProducts = useMemo(() => {
    return products.filter((p) => {
      const matchChannel = p.channelId === channel.id || (p.channelUsername && p.channelUsername.toLowerCase() === channel.username.toLowerCase());
      if (!matchChannel) return false;
      // If not owner, show only published products
      if (!isOwner && p.status && p.status !== 'published') return false;
      return true;
    });
  }, [products, channel.id, channel.username, isOwner]);

  // Filtered by tab and search
  const filteredProducts = useMemo(() => {
    return channelProducts.filter((p) => {
      if (activeTab === 'deals') {
        const isDeal = (p.discount && p.discount > 0) || p.productType === 'Deal/Offer' || (p.originalPrice > p.price);
        if (!isDeal) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        const inCat = p.category.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCat) return false;
      }
      return true;
    });
  }, [channelProducts, activeTab, searchQuery]);

  // Follow / Unfollow
  const handleToggleFollow = async () => {
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth('save', `Follow @${channel.username}`, handleToggleFollow);
      }
      return;
    }

    if (isFollowed) {
      await unfollowChannel(currentUser.id, channel.id);
      setIsFollowed(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      onShowToast(`Unfollowed @${channel.username}`);
    } else {
      await followChannel(currentUser.id, channel.id);
      setIsFollowed(true);
      setFollowersCount((prev) => prev + 1);
      onShowToast(`Now following @${channel.username}!`);
    }
  };

  // Share Channel URL
  const handleShare = () => {
    const publicUrl = `${window.location.origin}/channel/${channel.username}`;
    try {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      onShowToast(`Channel link copied: /channel/${channel.username}`);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      onShowToast(`Public URL: ${publicUrl}`);
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(channel.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  }, [channel.createdAt]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-left">
      
      {/* Top Back Navigation Bar */}
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
              onClick={() => onOpenReport('channel', channel.id, `@${channel.username} (${channel.name})`)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 px-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Report channel"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs transition-all"
            title="Share Channel URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Channel'}</span>
          </button>
        </div>
      </div>

      {/* Main Channel Banner & Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Banner Image */}
        <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
          {channel.banner && channel.banner.trim() !== '' ? (
            <img
              src={channel.banner}
              alt={channel.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800" />
          )}

          {/* Badges on Banner */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Store className="w-3 h-3 text-indigo-300" />
              <span>{channel.channelType}</span>
            </span>
            <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
              {channel.category}
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* Logo + Identity */}
            <div className="flex items-end gap-3.5 sm:gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white shrink-0">
                <img
                  src={channel.logo && channel.logo.trim() !== '' ? channel.logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channel.name)}`}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channel.name)}`;
                  }}
                />
              </div>

              <div className="space-y-0.5 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                    {channel.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Channel
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-indigo-600">
                  @{channel.username}
                </div>
              </div>
            </div>

            {/* Follow / Owner Action Buttons */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {isOwner ? (
                <>
                  {onOpenAddProduct && (
                    <button
                      onClick={onOpenAddProduct}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  )}
                  {onOpenDashboard && (
                    <button
                      onClick={onOpenDashboard}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Seller Dashboard</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full shadow-sm transition-all active:scale-[0.98] ${
                    isFollowed
                      ? 'bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-rose-600 border border-slate-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tagline & Description */}
          {channel.tagline && (
            <p className="text-xs sm:text-sm font-medium text-slate-700 italic mb-2">
              "{channel.tagline}"
            </p>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line mb-4">
            {channel.description}
          </p>

          {/* Metrics & Metadata Chips Bar */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span><strong className="text-slate-900 font-semibold">{channelProducts.length}</strong> Products</span>
            </div>

            <div className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-slate-400" />
              <span><strong className="text-slate-900 font-semibold">{followersCount}</strong> Followers</span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span><strong className="text-slate-900 font-semibold">{channel.views || 0}</strong> Views</span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined {formattedDate}</span>
            </div>

            {channel.country && (
              <div className="flex items-center gap-1">
                <span>📍 {channel.country}</span>
              </div>
            )}

            {/* Social Links */}
            <div className="ml-auto flex items-center gap-2">
              {channel.websiteUrl && (
                <a
                  href={channel.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {channel.instagramUrl && (
                <a
                  href={channel.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {channel.youtubeUrl && (
                <a
                  href={channel.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {channel.twitterUrl && (
                <a
                  href={channel.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="X / Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {channel.facebookUrl && (
                <a
                  href={channel.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Products ({channelProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'deals'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Deals & Offers
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'about'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            About Channel
          </button>
        </div>

        {/* Search within channel */}
        {activeTab !== 'about' && (
          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this channel..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-indigo-600 outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'about' ? (
        /* About Tab */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 mb-2">
              About {channel.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {channel.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-slate-700 block">Channel Details</span>
              <div className="text-slate-600 space-y-1">
                <div>Category: <strong className="text-slate-900">{channel.category}</strong></div>
                <div>Channel Type: <strong className="text-slate-900">{channel.channelType}</strong></div>
                <div>Country: <strong className="text-slate-900">{channel.country || 'Global'}</strong></div>
                <div>Language: <strong className="text-slate-900">{channel.language || 'English'}</strong></div>
                <div>Channel ID: <span className="font-mono text-[11px] text-slate-500">{channel.id}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-700 block">Seller & Support</span>
              <div className="text-slate-600 space-y-1">
                {channel.businessName && <div>Business: <strong className="text-slate-900">{channel.businessName}</strong></div>}
                {channel.gstInfo && <div>GST / Tax ID: <strong className="text-slate-900 font-mono">{channel.gstInfo}</strong></div>}
                <div>Contact Email: <strong className="text-slate-900">{channel.contactEmail}</strong></div>
                {channel.sellerContact && <div>Support Line: <strong className="text-slate-900">{channel.sellerContact}</strong></div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Products / Deals Grid */
        <div>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">
                  {searchQuery ? 'No matching products found' : 'No products published yet'}
                </h3>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? 'Try searching with a different keyword.'
                    : isOwner
                    ? 'Start building your storefront by adding your first product!'
                    : 'Check back soon for new curated deals and recommendations.'}
                </p>
              </div>

              {isOwner && onOpenAddProduct && (
                <button
                  onClick={onOpenAddProduct}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Product</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((p) => (
                <AmazonProductCard
                  key={p.id}
                  product={p}
                  viewMode="grid"
                  onSelectProduct={() => onSelectProduct(p)}
                  onAddToCart={() => onAddToCart(p)}
                  onBuyNow={() => onBuyNow(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
