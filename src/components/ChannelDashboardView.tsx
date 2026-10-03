import React, { useState, useMemo } from 'react';
import { 
  Channel, 
  MarketProduct, 
  UserAccount, 
  ProductStatus, 
  ChannelVideo, 
  SubscriptionPlan, 
  PLAN_LIMITS 
} from '../types';
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
  Percent, 
  Video, 
  Play, 
  RefreshCw, 
  Check, 
  RotateCw, 
  Zap, 
  Crown, 
  FileText, 
  FolderMinus, 
  Calendar 
} from 'lucide-react';
import { updateChannel } from '../services/channelService';
import { getProductStoreGroup, getStoreGroupConfig, StoreGroup } from '../utils/merchant';
import { refreshProductData } from '../services/productScraperService';

interface Props {
  userChannels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  products: MarketProduct[];
  videos?: ChannelVideo[];
  currentUser: UserAccount;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: MarketProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct?: (product: MarketProduct) => void;
  onArchiveProduct?: (productId: string) => void;
  onOpenUploadVideo?: () => void;
  onEditVideo?: (video: ChannelVideo) => void;
  onDeleteVideo?: (videoId: string) => void;
  onSelectVideo?: (video: ChannelVideo) => void;
  onOpenCreateChannel: () => void;
  onOpenChannelProfile: (channel: Channel) => void;
  onSelectProduct?: (product: MarketProduct) => void;
  onUpdateProduct?: (product: MarketProduct) => void;
  onUpdateUserPlan?: (plan: SubscriptionPlan) => void;
  onShowToast: (msg: string) => void;
  onDeleteChannel?: (channelId: string) => void;
}

export const ChannelDashboardView: React.FC<Props> = ({
  userChannels,
  selectedChannel,
  onSelectChannel,
  products,
  videos = [],
  currentUser,
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onArchiveProduct,
  onOpenUploadVideo,
  onEditVideo,
  onDeleteVideo,
  onSelectVideo,
  onOpenCreateChannel,
  onOpenChannelProfile,
  onSelectProduct,
  onUpdateProduct,
  onUpdateUserPlan,
  onShowToast,
  onDeleteChannel,
}) => {
  // Main Studio Sections: Dashboard | Content | Products | Videos | Analytics | Channel | Settings
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'content' | 'products' | 'videos' | 'analytics' | 'channel' | 'settings'
  >('dashboard');

  // Content sub-tab: 'products' | 'videos' | 'drafts'
  const [contentSubTab, setContentSubTab] = useState<'products' | 'videos' | 'drafts'>('products');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [storeFilter, setStoreFilter] = useState<'all' | StoreGroup>('all');

  // Product Data Refresh State
  const [refreshingProductId, setRefreshingProductId] = useState<string | null>(null);

  // Channel Customization Form state
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

  // Plan & Quotas
  const currentPlan = currentUser.subscriptionPlan || 'free';
  const planInfo = PLAN_LIMITS[currentPlan];

  // Channel products
  const channelProducts = useMemo(() => {
    if (!currentChannel) return [];
    return products.filter(
      (p) =>
        p.channelId === currentChannel.id ||
        (p.channelUsername && p.channelUsername.toLowerCase() === currentChannel.username.toLowerCase())
    );
  }, [products, currentChannel?.id, currentChannel?.username]);

  // Channel videos
  const channelVideos = useMemo(() => {
    if (!currentChannel) return [];
    return videos.filter(
      (v) =>
        v.channelId === currentChannel.id ||
        (v.channelUsername && v.channelUsername.toLowerCase() === currentChannel.username.toLowerCase())
    );
  }, [videos, currentChannel?.id, currentChannel?.username]);

  // Studio Dashboard Metrics (Requirement #9)
  const metrics = useMemo(() => {
    const totalProducts = channelProducts.length;
    const publishedProducts = channelProducts.filter((p) => !p.status || p.status === 'published').length;
    const draftProducts = channelProducts.filter((p) => p.status === 'draft').length;
    const archivedProducts = channelProducts.filter((p) => p.status === 'archived').length;

    const totalVideos = channelVideos.length;
    const publishedVideos = channelVideos.filter((v) => v.visibility === 'public').length;

    const productViews = channelProducts.reduce((sum, p) => sum + (p.views || 0), 0);
    const videoViews = channelVideos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalViews = (currentChannel?.views || 0) + productViews + videoViews;

    const totalClicks = channelProducts.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const affiliateClicks = channelProducts
      .filter((p) => p.productType === 'Affiliate' || Boolean(p.affiliateUrl))
      .reduce((sum, p) => sum + (p.clicks || 0), 0);

    const followers = currentChannel?.followersCount || 0;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

    return {
      totalViews,
      productViews,
      videoViews,
      totalClicks,
      affiliateClicks,
      followers,
      publishedProducts,
      draftProducts,
      archivedProducts,
      totalProducts,
      totalVideos,
      publishedVideos,
      ctr,
    };
  }, [channelProducts, channelVideos, currentChannel]);

  // Filtered Products for Products list & Content tab
  const filteredProducts = useMemo(() => {
    return channelProducts.filter((p) => {
      if (statusFilter !== 'all' && (p.status || 'published') !== statusFilter) return false;
      if (storeFilter !== 'all') {
        const sg = getProductStoreGroup(p);
        if (sg !== storeFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inCat = p.category.toLowerCase().includes(q);
        const inBrand = p.brand?.toLowerCase().includes(q);
        const inMerch = p.merchant?.toLowerCase().includes(q);
        if (!inTitle && !inCat && !inBrand && !inMerch) return false;
      }
      return true;
    });
  }, [channelProducts, statusFilter, storeFilter, searchQuery]);

  // Filtered Videos for Videos list & Content tab
  const filteredVideos = useMemo(() => {
    return channelVideos.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [channelVideos, searchQuery]);

  // Refresh Product Data (Requirement #13)
  const handleRefreshProduct = async (product: MarketProduct) => {
    if (!product.productLink) {
      onShowToast('This product does not have a web URL to refresh from.');
      return;
    }
    setRefreshingProductId(product.id);
    onShowToast(`Refreshing data for "${product.title.slice(0, 20)}..."`);

    try {
      const res = await refreshProductData(product.productLink);
      if (res.success && res.data) {
        const fetched = res.data;
        const now = new Date().toISOString();
        
        // Update price and lastCheckedAt, preserving seller title unless outdated
        const updated: MarketProduct = {
          ...product,
          price: fetched.price || product.price,
          originalPrice: fetched.originalPrice || product.originalPrice,
          mrp: fetched.originalPrice || product.mrp,
          discount: fetched.originalPrice > fetched.price 
            ? Math.round(((fetched.originalPrice - fetched.price) / fetched.originalPrice) * 100)
            : product.discount,
          lastCheckedAt: now,
          updatedAt: now,
        };

        if (onUpdateProduct) {
          onUpdateProduct(updated);
        }
        onShowToast(`✨ Refreshed! Current price: ${updated.currency}${updated.price}. Checked just now.`);
      } else {
        onShowToast(res.error || 'Could not refresh product from source.');
      }
    } catch {
      onShowToast('Error refreshing product.');
    } finally {
      setRefreshingProductId(null);
    }
  };

  // Duplicate Product (Requirement #10)
  const handleDuplicate = (product: MarketProduct) => {
    if (onDuplicateProduct) {
      onDuplicateProduct(product);
    } else if (onUpdateProduct) {
      const clone: MarketProduct = {
        ...product,
        id: `prod_${Date.now()}_copy`,
        title: `${product.title} (Copy)`,
        createdAt: new Date().toISOString(),
        status: 'draft',
      };
      onUpdateProduct(clone);
      onShowToast(`Duplicated as draft: "${clone.title.slice(0, 24)}..."`);
    }
  };

  // Archive Product (Requirement #10)
  const handleArchive = (product: MarketProduct) => {
    if (onArchiveProduct) {
      onArchiveProduct(product.id);
    } else if (onUpdateProduct) {
      const nextStatus = product.status === 'archived' ? 'published' : 'archived';
      onUpdateProduct({ ...product, status: nextStatus });
      onShowToast(`Product marked as ${nextStatus}.`);
    }
  };

  // Save Channel Settings
  const handleSaveChannelSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChannel) return;
    setSavingSettings(true);

    try {
      const updates: Partial<Channel> = {
        name: editName.trim(),
        tagline: editTagline.trim(),
        description: editDescription.trim(),
        logo: editLogo.trim() || currentChannel.logo,
        banner: editBanner.trim() || undefined,
        category: editCategory,
        contactEmail: editContactEmail.trim(),
        websiteUrl: editWebsite.trim() || undefined,
        instagramUrl: editInstagram.trim() || undefined,
        youtubeUrl: editYoutube.trim() || undefined,
        twitterUrl: editTwitter.trim() || undefined,
      };

      await updateChannel(currentChannel.id, updates);
      onSelectChannel({ ...currentChannel, ...updates });
      onShowToast('Channel customization saved successfully!');
    } catch {
      onShowToast('Failed to save channel customization.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!hasChannels || !currentChannel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Store className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900">
            Welcome to Creator Studio
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You don't have an active creator channel yet. Set up your channel in seconds to start listing products, uploading videos, and earning affiliate rewards!
          </p>
        </div>
        <button
          onClick={onOpenCreateChannel}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-sm transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Your Creator Channel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 text-left">
      
      {/* Top Creator Studio Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              src={currentChannel.logo}
              alt={currentChannel.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                {currentChannel.name}
              </h1>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                @{currentChannel.username}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {planInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
              Creator Studio • {metrics.totalProducts} products listed • {metrics.totalVideos} videos
            </p>
          </div>
        </div>

        {/* Studio Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenChannelProfile(currentChannel)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="View channel as public visitor"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Channel</span>
          </button>

          {onOpenUploadVideo && (
            <button
              onClick={onOpenUploadVideo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-red-600" />
              <span>Upload Video</span>
            </button>
          )}

          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs (Requirement #9) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'content', label: 'Content', icon: FileText },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'videos', label: 'Videos', icon: Video },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'channel', label: 'Channel', icon: Store },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-2xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: DASHBOARD (Requirement #9) */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Views</span>
              <div className="font-display font-black text-xl text-slate-900 mt-1">{metrics.totalViews}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Product Views</span>
              <div className="font-display font-black text-xl text-indigo-600 mt-1">{metrics.productViews}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Video Views</span>
              <div className="font-display font-black text-xl text-red-600 mt-1">{metrics.videoViews}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Clicks</span>
              <div className="font-display font-black text-xl text-slate-900 mt-1">{metrics.totalClicks}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Affiliate Clicks</span>
              <div className="font-display font-black text-xl text-emerald-600 mt-1">{metrics.affiliateClicks}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Subscribers</span>
              <div className="font-display font-black text-xl text-slate-900 mt-1">{metrics.followers}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Published Products</span>
              <div className="font-display font-black text-xl text-slate-900 mt-1">{metrics.publishedProducts}</div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Published Videos</span>
              <div className="font-display font-black text-xl text-slate-900 mt-1">{metrics.publishedVideos}</div>
            </div>
          </div>

          {/* Quick Actions & Recent Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Recent Published Products */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Recent Channel Products</span>
                </h3>
                <button
                  onClick={() => setActiveSection('products')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View All Products ({metrics.totalProducts}) →
                </button>
              </div>

              {channelProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No products published yet. Click "Add Product" to import or create deals!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {channelProducts.slice(0, 5).map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-slate-900 truncate max-w-sm">{p.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-700">{p.currency}{p.price}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">{p.merchant || 'Store'}</span>
                            <span>•</span>
                            <span>{p.views || 0} views</span>
                            <span>•</span>
                            <span>{p.clicks || 0} clicks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRefreshProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="Refresh product data"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${refreshingProductId === p.id ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Channel Videos Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  <span>Channel Videos</span>
                </h3>
                {onOpenUploadVideo && (
                  <button
                    onClick={onOpenUploadVideo}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    + Upload
                  </button>
                )}
              </div>

              {channelVideos.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No videos uploaded yet. Upload YouTube/MP4 reviews and tag your affiliate deals!
                </div>
              ) : (
                <div className="space-y-3">
                  {channelVideos.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onSelectVideo && onSelectVideo(v)}
                      className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div className="w-16 aspect-video bg-black rounded-lg overflow-hidden shrink-0 relative">
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                        <Play className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-xs text-slate-900 truncate">{v.title}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {v.views || 0} views • {v.attachedProductIds?.length || 0} attached deals
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: CONTENT (Subtabs: Products / Videos / Drafts - Requirement #9) */}
      {activeSection === 'content' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setContentSubTab('products')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                contentSubTab === 'products' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Published Products ({metrics.publishedProducts})
            </button>

            <button
              onClick={() => setContentSubTab('videos')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                contentSubTab === 'videos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Videos ({metrics.totalVideos})
            </button>

            <button
              onClick={() => setContentSubTab('drafts')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                contentSubTab === 'drafts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Drafts ({metrics.draftProducts})
            </button>
          </div>

          {contentSubTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Published Products in Storefront</span>
                <button
                  onClick={onOpenAddProduct}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                {channelProducts.filter((p) => !p.status || p.status === 'published').length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No published products yet.</div>
                ) : (
                  channelProducts.filter((p) => !p.status || p.status === 'published').map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate max-w-md">{p.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span className="font-bold text-slate-800">{p.currency}{p.price}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold">{p.merchant || 'Store'}</span>
                            <span>•</span>
                            <span>{p.category}</span>
                            {p.lastCheckedAt && (
                              <span className="text-[10px] text-slate-400">
                                (Checked: {new Date(p.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRefreshProduct(p)}
                          className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg flex items-center gap-1 font-semibold"
                          title="Refresh product data from source"
                        >
                          <RefreshCw className={`w-3 h-3 ${refreshingProductId === p.id ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg font-semibold"
                          title="Duplicate listing"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {contentSubTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">All Channel Videos</span>
                {onOpenUploadVideo && (
                  <button
                    onClick={onOpenUploadVideo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                {channelVideos.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No videos uploaded yet.</div>
                ) : (
                  channelVideos.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-20 aspect-video bg-black rounded-xl overflow-hidden shrink-0 relative">
                          <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                          <Play className="w-4 h-4 text-white absolute inset-0 m-auto" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate max-w-md">{v.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span className="capitalize font-semibold text-indigo-600">🌐 {v.visibility}</span>
                            <span>•</span>
                            <span>{v.views || 0} views</span>
                            <span>•</span>
                            <span>{v.attachedProductIds?.length || 0} attached products</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onSelectVideo && (
                          <button
                            onClick={() => onSelectVideo(v)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg font-semibold"
                          >
                            Watch
                          </button>
                        )}
                        {onEditVideo && (
                          <button
                            onClick={() => onEditVideo(v)}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold"
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteVideo && (
                          <button
                            onClick={() => onDeleteVideo(v.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {contentSubTab === 'drafts' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Unpublished Drafts ({metrics.draftProducts})</span>
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                {channelProducts.filter((p) => p.status === 'draft').length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No saved drafts currently.</div>
                ) : (
                  channelProducts.filter((p) => p.status === 'draft').map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate max-w-md">{p.title}</h4>
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                            Draft • Un-published
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold"
                        >
                          Review & Publish
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PRODUCTS (Full Management - Requirement #10) */}
      {activeSection === 'products' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, brand..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white outline-none"
              >
                <option value="all">All Stores</option>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Meesho">Meesho</option>
                <option value="Myntra">Myntra</option>
                <option value="Ajio">Ajio</option>
              </select>

              <button
                onClick={onOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Products Table/List */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No products found matching filters.</div>
            ) : (
              filteredProducts.map((p) => {
                const isArchived = p.status === 'archived';
                const isDraft = p.status === 'draft';
                return (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 truncate max-w-md">{p.title}</h4>
                          {isDraft && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Draft</span>}
                          {isArchived && <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">Archived</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-bold text-slate-800">{p.currency}{p.price}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">{p.merchant || 'Store'}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                          {p.lastCheckedAt && (
                            <span className="text-[10px] text-slate-400">
                              (Last checked: {new Date(p.lastCheckedAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => handleRefreshProduct(p)}
                        className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg flex items-center gap-1 font-semibold"
                        title="Refresh product data from source"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingProductId === p.id ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(p)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg font-semibold"
                      >
                        Duplicate
                      </button>

                      <button
                        onClick={() => handleArchive(p)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg font-semibold"
                      >
                        {isArchived ? 'Unarchive' : 'Archive'}
                      </button>

                      <button
                        onClick={() => onOpenEditProduct(p)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: VIDEOS (YouTube Studio-style Video Management - Requirement #8) */}
      {activeSection === 'videos' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Manage Channel Videos</h3>
            {onOpenUploadVideo && (
              <button
                onClick={onOpenUploadVideo}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Video</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {channelVideos.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Video className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-800">No videos uploaded yet</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Upload review videos, shopping hauls, or product unboxings and attach deal links directly under them!
                </p>
              </div>
            ) : (
              channelVideos.map((v) => (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-24 aspect-video bg-black rounded-xl overflow-hidden shrink-0 relative">
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                      <Play className="w-4 h-4 text-white absolute inset-0 m-auto" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate max-w-md">{v.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{v.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="font-bold text-indigo-600 uppercase">🌐 {v.visibility}</span>
                        <span>•</span>
                        <span>{v.views || 0} views</span>
                        <span>•</span>
                        <span>{v.attachedProductIds?.length || 0} attached deals</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSelectVideo && (
                      <button
                        onClick={() => onSelectVideo(v)}
                        className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                      >
                        Watch
                      </button>
                    )}
                    {onEditVideo && (
                      <button
                        onClick={() => onEditVideo(v)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold"
                      >
                        Edit
                      </button>
                    )}
                    {onDeleteVideo && (
                      <button
                        onClick={() => onDeleteVideo(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: ANALYTICS (Requirement #9) */}
      {activeSection === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Channel Click-Through-Rate (CTR)</span>
              <div className="font-display font-black text-3xl text-indigo-600">{metrics.ctr}%</div>
              <p className="text-[11px] text-slate-400">Total clicks divided by total views</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Affiliate Traffic Generated</span>
              <div className="font-display font-black text-3xl text-emerald-600">{metrics.affiliateClicks}</div>
              <p className="text-[11px] text-slate-400">Outbound clicks sent to merchant links</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Video & Visual Engagement</span>
              <div className="font-display font-black text-3xl text-red-600">{metrics.videoViews}</div>
              <p className="text-[11px] text-slate-400">Total views recorded across uploaded videos</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: CHANNEL CUSTOMIZATION (Requirement #1 & #9) */}
      {activeSection === 'channel' && (
        <form onSubmit={handleSaveChannelSettings} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Customize Channel Branding & Info</h3>
              <p className="text-slate-500 text-[11px]">Edit profile avatar, banner, channel tagline, and links</p>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
            >
              {savingSettings ? 'Saving...' : 'Save Channel Changes'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Channel Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Tagline / Slogan</label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">About / Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Logo Image URL</label>
              <input
                type="url"
                value={editLogo}
                onChange={(e) => setEditLogo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Banner Image URL</label>
              <input
                type="url"
                value={editBanner}
                onChange={(e) => setEditBanner(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* SECTION 7: SETTINGS & SUBSCRIPTION PLAN (Requirement #11) */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 text-xs">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Creator Account & Subscription Plan</h3>
            <p className="text-slate-500 text-[11px]">Select your plan tier to test upload allowances and creator tools.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['free', 'pro', 'ultimate'] as SubscriptionPlan[]).map((pKey) => {
              const p = PLAN_LIMITS[pKey];
              const isCurrent = currentPlan === pKey;
              return (
                <div
                  key={pKey}
                  className={`p-5 rounded-3xl border transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                    {isCurrent && <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <ul className="mt-3 space-y-1.5 text-slate-600 text-[11px]">
                    <li>• Up to <strong>{p.maxProducts === 999999 ? 'Unlimited' : p.maxProducts}</strong> active listings</li>
                    <li>• Up to <strong>{p.maxVideos === 999999 ? 'Unlimited' : p.maxVideos}</strong> channel videos</li>
                    <li>• Bulk URL import: <strong>{p.bulkImport ? 'Enabled' : 'Disabled'}</strong></li>
                    <li>• Analytics: <strong>{p.analyticsLevel}</strong></li>
                  </ul>

                  {!isCurrent && onUpdateUserPlan && (
                    <button
                      type="button"
                      onClick={() => onUpdateUserPlan(pKey)}
                      className="w-full mt-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors text-xs"
                    >
                      Switch to {p.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {onDeleteChannel && currentChannel && (
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Danger Zone</h4>
                <p className="text-slate-500 text-[11px]">Permanently delete this channel and reset your account's channel quota.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete @${currentChannel.username}? This cannot be undone.`)) {
                    onDeleteChannel(currentChannel.id);
                  }
                }}
                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold border border-rose-200 transition-colors"
              >
                Delete Channel
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
