import React, { useState, useMemo } from 'react';
import { Channel, MarketProduct, UserAccount } from '../types';
import { AmazonProductCard } from './AmazonProductCard';
import { 
  Compass, 
  Store, 
  TrendingUp, 
  Sparkles, 
  UserPlus, 
  UserCheck, 
  Flame, 
  ArrowRight, 
  Search, 
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { followChannel, unfollowChannel, isFollowing } from '../services/channelService';

interface Props {
  channels: Channel[];
  products: MarketProduct[];
  currentUser: UserAccount | null;
  onOpenChannelProfile: (channel: Channel) => void;
  onSelectProduct: (product: MarketProduct) => void;
  onAddToCart: (product: MarketProduct) => void;
  onBuyNow: (product: MarketProduct) => void;
  onOpenCreateChannel: () => void;
  hasChannel?: boolean;
  onNavigateToDashboard?: () => void;
  onRequireAuth?: (reason: 'save' | 'order', title: string, action: () => void) => boolean;
  onShowToast: (msg: string) => void;
}

export const ChannelDiscoveryView: React.FC<Props> = ({
  channels,
  products,
  currentUser,
  onOpenChannelProfile,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onOpenCreateChannel,
  hasChannel,
  onNavigateToDashboard,
  onRequireAuth,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Active channels
  const activeChannels = useMemo(() => {
    return channels.filter((c) => c.status !== 'suspended');
  }, [channels]);

  // Check follow status for active user
  React.useEffect(() => {
    if (currentUser) {
      Promise.all(
        activeChannels.map(async (c) => ({
          id: c.id,
          isFollowing: await isFollowing(currentUser.id, c.id),
        }))
      ).then((results) => {
        const map: Record<string, boolean> = {};
        results.forEach((r) => {
          map[r.id] = r.isFollowing;
        });
        setFollowingMap(map);
      });
    } else {
      setFollowingMap({});
    }
  }, [currentUser, activeChannels]);

  // Toggle follow on a channel
  const handleToggleFollow = async (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth('save', `Follow @${channel.username}`, () => {});
      }
      return;
    }

    const current = Boolean(followingMap[channel.id]);
    if (current) {
      await unfollowChannel(currentUser.id, channel.id);
      setFollowingMap((prev) => ({ ...prev, [channel.id]: false }));
      onShowToast(`Unfollowed @${channel.username}`);
    } else {
      await followChannel(currentUser.id, channel.id);
      setFollowingMap((prev) => ({ ...prev, [channel.id]: true }));
      onShowToast(`Following @${channel.username}!`);
    }
  };

  // Popular channels (sorted by public follower count & views)
  const popularChannels = useMemo(() => {
    return [...activeChannels].sort((a, b) => ((b.followersCount || 0) + (b.views || 0)) - ((a.followersCount || 0) + (a.views || 0)));
  }, [activeChannels]);

  // New channels (sorted by createdAt)
  const newChannels = useMemo(() => {
    return [...activeChannels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeChannels]);

  // Trending products (sorted by views/clicks)
  const trendingProducts = useMemo(() => {
    return products
      .filter((p) => !p.status || p.status === 'published')
      .sort((a, b) => ((b.views || 0) + (b.clicks || 0) * 2) - ((a.views || 0) + (a.clicks || 0) * 2))
      .slice(0, 8);
  }, [products]);

  // Latest Deals
  const latestDeals = useMemo(() => {
    return products
      .filter((p) => (!p.status || p.status === 'published') && ((p.discount && p.discount > 0) || p.productType === 'Deal/Offer'))
      .slice(0, 8);
  }, [products]);

  // Filtered channels list by search/category
  const filteredChannels = useMemo(() => {
    return activeChannels.filter((c) => {
      if (selectedCategory !== 'all' && c.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = c.name.toLowerCase().includes(q);
        const inUser = c.username.toLowerCase().includes(q);
        const inDesc = c.description.toLowerCase().includes(q);
        if (!inName && !inUser && !inDesc) return false;
      }
      return true;
    });
  }, [activeChannels, selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    activeChannels.forEach((c) => set.add(c.category));
    return ['all', ...Array.from(set)];
  }, [activeChannels]);

  return (
    <div className="space-y-8 text-left">
      
      {/* Hero Discovery Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-200 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Channel Marketplace</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Discover Verified Channels & Top Curators
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Follow specialized curator stores, find honest reviews, and never miss an affiliate deal on electronics, books, comics, fashion, and gadgets.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={hasChannel && onNavigateToDashboard ? onNavigateToDashboard : onOpenCreateChannel}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-indigo-950 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-all"
            >
              <Store className="w-4 h-4 text-indigo-600" />
              <span>{hasChannel ? 'My Channel Studio' : 'Create Your Channel'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels by name, username, or niche..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white outline-none"
          />
        </div>

        {/* Categories Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All Channels' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: POPULAR & FEATURED CHANNELS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
              Popular Channels
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{popularChannels.length} channels</span>
        </div>

        {popularChannels.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No channels created yet. Be the first to launch a channel!</p>
            <button
              onClick={onOpenCreateChannel}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full"
            >
              Create First Channel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularChannels.slice(0, 8).map((c) => {
              const isOwner = currentUser?.id === c.ownerId;
              const isFollowed = Boolean(followingMap[c.id]);
              const prodCount = products.filter((p) => p.channelId === c.id || p.channelUsername === c.username).length;

              return (
                <div
                  key={c.id}
                  onClick={() => onOpenChannelProfile(c)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    {/* Header: Logo + Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={c.logo && c.logo.trim() !== '' ? c.logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-1">
                          <span className="truncate">{c.name}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-xs text-indigo-600 font-semibold truncate">
                          @{c.username}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">
                          {c.category}
                        </span>
                      </div>
                    </div>

                    {/* Tagline / Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {c.tagline || c.description}
                    </p>
                  </div>

                  {/* Footer: Follow button & Counts */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      <strong className="text-slate-700">{c.followersCount || 0}</strong> followers · <strong className="text-slate-700">{prodCount}</strong> products
                    </span>

                    {!isOwner && (
                      <button
                        onClick={(e) => handleToggleFollow(e, c)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                          isFollowed
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TRENDING PRODUCTS ACROSS ALL CHANNELS */}
      {trendingProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                Trending Channel Products
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Most Viewed & Clicked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trendingProducts.map((p) => (
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
        </div>
      )}

      {/* SECTION 3: LATEST DEALS & OFFERS */}
      {latestDeals.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                Latest Deals & Discounts
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestDeals.map((p) => (
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
        </div>
      )}

    </div>
  );
};
