import React, { useState, useMemo } from 'react';
import { Channel, MarketProduct, UserAccount, ProductStatus } from '../types';
import { 
  Plus, 
  Store, 
  Package, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Archive,
  ArrowUpRight,
  Share2,
  Copy,
  ChevronDown,
  Layers,
  Percent
} from 'lucide-react';
import { updateChannel } from '../services/channelService';

interface Props {
  userChannels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  products: MarketProduct[];
  currentUser: UserAccount;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: MarketProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenCreateChannel: () => void;
  onOpenChannelProfile: (channel: Channel) => void;
  onShowToast: (msg: string) => void;
  onDeleteChannel?: (channelId: string) => void;
}

export const ChannelDashboardView: React.FC<Props> = ({
  userChannels,
  selectedChannel,
  onSelectChannel,
  products,
  currentUser,
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onOpenCreateChannel,
  onOpenChannelProfile,
  onShowToast,
  onDeleteChannel,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics' | 'settings'>('overview');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  
  // Settings Form state for current selected channel
  const [editName, setEditName] = useState(selectedChannel?.name || '');
  const [editTagline, setEditTagline] = useState(selectedChannel?.tagline || '');
  const [editDescription, setEditDescription] = useState(selectedChannel?.description || '');
  const [editLogo, setEditLogo] = useState(selectedChannel?.logo || '');
  const [editBanner, setEditBanner] = useState(selectedChannel?.banner || '');
  const [editCategory, setEditCategory] = useState(selectedChannel?.category || 'Electronics & Gadgets');
  const [editContactEmail, setEditContactEmail] = useState(selectedChannel?.contactEmail || '');
  const [editWebsite, setEditWebsite] = useState(selectedChannel?.websiteUrl || '');
  const [editInstagram, setEditInstagram] = useState(selectedChannel?.instagramUrl || '');
  const [editYoutube, setEditYoutube] = useState(selectedChannel?.youtubeUrl || '');
  const [editTwitter, setEditTwitter] = useState(selectedChannel?.twitterUrl || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync edit fields when channel changes
  React.useEffect(() => {
    if (selectedChannel) {
      setEditName(selectedChannel.name);
      setEditTagline(selectedChannel.tagline || '');
      setEditDescription(selectedChannel.description);
      setEditLogo(selectedChannel.logo);
      setEditBanner(selectedChannel.banner || '');
      setEditCategory(selectedChannel.category);
      setEditContactEmail(selectedChannel.contactEmail);
      setEditWebsite(selectedChannel.websiteUrl || '');
      setEditInstagram(selectedChannel.instagramUrl || '');
      setEditYoutube(selectedChannel.youtubeUrl || '');
      setEditTwitter(selectedChannel.twitterUrl || '');
    }
  }, [selectedChannel]);

  const hasChannels = Boolean(userChannels && userChannels.length > 0);
  const currentChannel = hasChannels ? (selectedChannel || userChannels[0]) : null;

  // Channel products (hook called unconditionally before any early returns)
  const channelProducts = useMemo(() => {
    if (!currentChannel) return [];
    return products.filter((p) => p.channelId === currentChannel.id || (p.channelUsername && p.channelUsername.toLowerCase() === currentChannel.username.toLowerCase()));
  }, [products, currentChannel?.id, currentChannel?.username]);

  // Metrics (hook called unconditionally before any early returns)
  const metrics = useMemo(() => {
    if (!currentChannel) {
      return {
        total: 0,
        published: 0,
        draft: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalClicks: 0,
        ctr: '0.0',
        channelViews: 0,
        followers: 0,
      };
    }
    const total = channelProducts.length;
    const published = channelProducts.filter((p) => !p.status || p.status === 'published').length;
    const draft = channelProducts.filter((p) => p.status === 'draft').length;
    const pending = channelProducts.filter((p) => p.status === 'pending').length;
    const rejected = channelProducts.filter((p) => p.status === 'rejected').length;

    const totalViews = channelProducts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalClicks = channelProducts.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    return {
      total,
      published,
      draft,
      pending,
      rejected,
      totalViews,
      totalClicks,
      ctr,
      channelViews: currentChannel.views || 0,
      followers: currentChannel.followersCount || 0,
    };
  }, [channelProducts, currentChannel]);

  // Filtered products list (hook called unconditionally)
  const filteredProducts = useMemo(() => {
    if (!currentChannel) return [];
    return channelProducts.filter((p) => {
      if (statusFilter !== 'all') {
        const prodStatus = p.status || 'published';
        if (prodStatus !== statusFilter) return false;
      }
      if (searchProductQuery.trim()) {
        const q = searchProductQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [channelProducts, statusFilter, searchProductQuery, currentChannel]);

  // Top products by views (hook called unconditionally)
  const topViewedProducts = useMemo(() => {
    if (!currentChannel) return [];
    return [...channelProducts]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [channelProducts, currentChannel]);

  // Top products by clicks (hook called unconditionally)
  const topClickedProducts = useMemo(() => {
    if (!currentChannel) return [];
    return [...channelProducts]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);
  }, [channelProducts, currentChannel]);

  // If no channels exist at all, render prompt AFTER all hooks have executed
  if (!hasChannels || !currentChannel) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
          <Store className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display font-bold text-xl text-slate-900">
            Create your channel first
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your channel is your store on Deal Sphere. Create one to start adding products and sharing deals.
          </p>
        </div>
        <button
          onClick={onOpenCreateChannel}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Channel</span>
        </button>
      </div>
    );
  }

  // Handle Save Channel Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      onShowToast('Channel name cannot be empty.');
      return;
    }
    setSavingSettings(true);
    try {
      await updateChannel(currentChannel.id, {
        name: editName.trim(),
        tagline: editTagline.trim(),
        description: editDescription.trim(),
        logo: editLogo.trim(),
        banner: editBanner.trim(),
        category: editCategory,
        contactEmail: editContactEmail.trim(),
        websiteUrl: editWebsite.trim(),
        instagramUrl: editInstagram.trim(),
        youtubeUrl: editYoutube.trim(),
        twitterUrl: editTwitter.trim(),
      });
      onShowToast('Channel settings saved successfully!');
    } catch (err: any) {
      onShowToast(err?.message || 'Failed to update channel settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const channelLogoSrc = (currentChannel.logo && currentChannel.logo.trim() !== '')
    ? currentChannel.logo
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentChannel.name)}`;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-left">
      
      {/* Top Bar with Channel Selector & Create Button */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Active Channel Info & Switcher */}
        <div className="flex items-center gap-3.5">
          <img
            src={channelLogoSrc}
            alt={currentChannel.name}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs bg-slate-50 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentChannel.name)}`;
            }}
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg sm:text-xl text-slate-900">
                {currentChannel.name}
              </h1>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Seller Storefront
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-indigo-600 font-semibold">@{currentChannel.username}</span>
              <span>·</span>
              <span>{currentChannel.category}</span>
              <span>·</span>
              <span>ID: <code className="font-mono text-[11px]">{currentChannel.id}</code></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenChannelProfile(currentChannel)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-colors shadow-xs"
            title="View Public Profile"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Public Profile</span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Dashboard Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Product Management ({channelProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Analytics & Insights
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Channel Settings
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Total Products</span>
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-tabular">
                {metrics.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-600 font-semibold">{metrics.published} live</span>
                <span>·</span>
                <span>{metrics.draft} draft</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Total Views</span>
                <Eye className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-tabular">
                {metrics.totalViews + metrics.channelViews}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {metrics.totalViews} product · {metrics.channelViews} channel
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Total Clicks</span>
                <MousePointerClick className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-tabular">
                {metrics.totalClicks}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Outbound visit & buy clicks
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Click-Through Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-tabular">
                {metrics.ctr}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {metrics.followers} channel followers
              </div>
            </div>
          </div>

          {/* Quick Product Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Status Breakdown Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Product Status Breakdown</span>
                <span className="text-xs text-slate-400 font-normal">{channelProducts.length} total</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Published Products
                  </span>
                  <strong className="font-bold">{metrics.published}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-800">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Review
                  </span>
                  <strong className="font-bold">{metrics.pending}</strong>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-slate-700">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    Draft Products
                  </span>
                  <strong className="font-bold">{metrics.draft}</strong>
                </div>

                {metrics.rejected > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 text-rose-800">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Needs Modification
                    </span>
                    <strong className="font-bold">{metrics.rejected}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Share & Channel Link Box */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Your Public Channel Link</span>
              </h3>
              <p className="text-xs text-slate-600">
                Share your store link with customers, social media followers, or subscribers to browse your curated inventory.
              </p>

              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-200">
                <code className="text-xs text-indigo-900 font-mono flex-1 truncate">
                  /channel/{currentChannel.username}
                </code>
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/channel/${currentChannel.username}`;
                    navigator.clipboard.writeText(fullUrl);
                    onShowToast('Channel URL copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Copy
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Followers: <strong className="text-slate-900">{metrics.followers}</strong></span>
                <button
                  onClick={() => onOpenChannelProfile(currentChannel)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  <span>Open Storefront</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5">
          
          {/* Controls: Search, Status Filter, Add Product Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  placeholder="Search products in channel..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={onOpenAddProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Product Table / Cards */}
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <h4 className="font-bold text-sm text-slate-800">No products found</h4>
              <p className="text-xs text-slate-400">
                {channelProducts.length === 0
                  ? 'Get started by listing your first product in this channel!'
                  : 'No products match the selected filters.'}
              </p>
              {channelProducts.length === 0 && (
                <button
                  onClick={onOpenAddProduct}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3 pl-2">Product</th>
                    <th className="pb-3">Price / MRP</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-center">Views</th>
                    <th className="pb-3 text-center">Clicks</th>
                    <th className="pb-3 text-center">CTR</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const prodStatus = p.status || 'published';
                    const views = p.views || 0;
                    const clicks = p.clicks || 0;
                    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-3 max-w-xs sm:max-w-sm">
                            {p.imageUrl && p.imageUrl.trim() !== '' ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white shrink-0 p-0.5"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                {p.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {p.category} · {p.merchant || 'Direct'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 whitespace-nowrap">
                          <strong className="text-slate-900 font-tabular font-bold">
                            {p.currency}{p.price.toLocaleString()}
                          </strong>
                          {p.originalPrice > p.price && (
                            <span className="text-[11px] text-slate-400 line-through block font-tabular">
                              {p.currency}{p.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="py-3 whitespace-nowrap">
                          {prodStatus === 'published' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Published
                            </span>
                          )}
                          {prodStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Pending Review
                            </span>
                          )}
                          {prodStatus === 'draft' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                          {prodStatus === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full" title={p.rejectionReason}>
                              Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-3 text-center font-tabular text-slate-600 font-semibold">
                          {views}
                        </td>

                        <td className="py-3 text-center font-tabular text-slate-600 font-semibold">
                          {clicks}
                        </td>

                        <td className="py-3 text-center font-tabular font-bold text-slate-800">
                          {ctr}%
                        </td>

                        <td className="py-3 pr-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenEditProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete product "${p.title}"?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Most Viewed Products */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Top Viewed Products</span>
                <Eye className="w-4 h-4 text-indigo-600" />
              </h3>

              {topViewedProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No product views recorded yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {topViewedProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-bold text-slate-400 font-tabular w-4">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                      </div>
                      <span className="font-tabular font-bold text-slate-900 shrink-0">
                        {p.views || 0} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Clicked Products */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Top Clicked Products (Outbound Intent)</span>
                <MousePointerClick className="w-4 h-4 text-emerald-600" />
              </h3>

              {topClickedProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No clicks recorded yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {topClickedProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-bold text-slate-400 font-tabular w-4">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                      </div>
                      <span className="font-tabular font-bold text-emerald-700 shrink-0">
                        {p.clicks || 0} clicks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHANNEL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900">Customize Your Channel</h3>
            <p className="text-xs text-slate-500">Update logo, banner, tagline, description, and social links.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                placeholder="Short punchy tagline"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Logo Image URL
              </label>
              <input
                type="url"
                value={editLogo}
                onChange={(e) => setEditLogo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banner Cover Image URL
              </label>
              <input
                type="url"
                value={editBanner}
                onChange={(e) => setEditBanner(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={editInstagram}
                onChange={(e) => setEditInstagram(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={editYoutube}
                onChange={(e) => setEditYoutube(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full shadow-sm shadow-indigo-100 transition-all"
            >
              {savingSettings ? 'Saving Changes...' : 'Save Channel Settings'}
            </button>
          </div>
        </form>

        {/* Danger Zone: Channel Deletion */}
        {onDeleteChannel && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 sm:p-6 space-y-3 mt-6">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Account Storefront Policy & Danger Zone</h4>
            </div>
            <p className="text-xs text-rose-800/80 leading-relaxed">
              Deal Sphere allows strictly <strong>one channel per account</strong>. If you want to change your channel handle or start a new storefront, you can permanently delete this channel. Deleting will release your account's single channel quota.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 rounded-full transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Channel & Reset Quota</span>
              </button>
            ) : (
              <div className="bg-white border border-rose-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <p className="text-xs font-bold text-rose-900">
                  Are you absolutely sure you want to delete "@{currentChannel.username}"?
                </p>
                <p className="text-[11px] text-slate-500">
                  This action cannot be undone. All listings under this channel will be unlinked.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteChannel(currentChannel.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors shadow-2xs"
                  >
                    Yes, Permanently Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

    </div>
  );
};
