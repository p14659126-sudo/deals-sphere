import React, { useState } from 'react';
import { UserAccount, MarketProduct, AppSettings, OrderRecord, CartItem, Channel } from '../types';
import { maskEmail, sanitizeDisplayName } from '../utils/privacy';
import { 
  Building2, 
  User, 
  ShieldCheck, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  LogOut, 
  Globe, 
  Tag, 
  LayoutGrid, 
  List, 
  Download, 
  RotateCcw, 
  Bell, 
  Check, 
  HelpCircle,
  ShoppingBag,
  Store,
  Layers,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Eye,
  Megaphone,
  Award
} from 'lucide-react';
import { attachAffiliateTag, normalizeProductLink } from '../utils/url';
import { auth } from '../firebase';

interface Props {
  currentUser: UserAccount | null;
  userChannels?: Channel[];
  onOpenCreateChannel?: () => void;
  onOpenDashboard?: () => void;
  onOpenChannelProfile?: (channel: Channel) => void;
  onUpdateAccountType: (newType: 'normal' | 'business', businessName?: string) => void;
  onOpenUpload: () => void;
  uploadedProducts: MarketProduct[];
  onDeleteProduct: (productId: string) => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
  onSignOut: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearCart: () => void;
  orders: OrderRecord[];
  cartItems: CartItem[];
  onTestRewardedAd?: () => void;
}

export const SettingsView: React.FC<Props> = ({
  currentUser,
  userChannels = [],
  onOpenCreateChannel,
  onOpenDashboard,
  onOpenChannelProfile,
  onUpdateAccountType,
  onOpenUpload,
  uploadedProducts,
  onDeleteProduct,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut,
  settings,
  onUpdateSettings,
  onClearCart,
  orders,
  cartItems,
  onTestRewardedAd,
}) => {
  const [businessNameInput, setBusinessNameInput] = useState(
    currentUser?.businessName || (currentUser ? `${currentUser.name}'s Store` : '')
  );
  const [businessBioInput, setBusinessBioInput] = useState(
    currentUser?.businessBio || 'Affiliate product curator and deal marketer'
  );
  const [affiliateTagInput, setAffiliateTagInput] = useState(settings.affiliateTag || '');
  const [tagSavedNotice, setTagSavedNotice] = useState(false);
  const [exportedNotice, setExportedNotice] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">
          Sign In or Sign Up to Manage Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Sign in or create a free account to customize your currency, tracking tags, layout preferences, and create your channel to sell products.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={onOpenSignIn}
            className="px-6 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-full shadow-2xs transition-all inline-flex items-center gap-2"
          >
            <span>Sign In</span>
          </button>
          <button
            onClick={onOpenSignUp || onOpenSignIn}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all inline-flex items-center gap-2"
          >
            <span>Sign Up</span>
          </button>
        </div>
      </div>
    );
  }

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccountType('business', businessNameInput.trim() || `${currentUser.name}'s Store`);
    setShowUpgradeSuccess(true);
    setTimeout(() => setShowUpgradeSuccess(false), 3000);
  };

  const handleDowngrade = () => {
    onUpdateAccountType('normal');
  };

  const handleSaveAffiliateTag = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ affiliateTag: affiliateTagInput.trim() });
    setTagSavedNotice(true);
    setTimeout(() => setTagSavedNotice(false), 2500);
  };

  const handleExportData = () => {
    const dataToExport = {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        accountType: currentUser.accountType,
        businessName: currentUser.businessName,
      },
      channels: userChannels,
      settings,
      savedCart: cartItems,
      confirmedOrders: orders,
      uploadedProducts: uploadedProducts.filter((p) => p.sellerId === currentUser.id),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dealsphere-backup-${currentUser.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 3000);
  };

  const myProducts = uploadedProducts.filter(
    (p) => p.sellerId === currentUser.id || (auth.currentUser && p.sellerId === auth.currentUser.uid)
  );

  // Currency options
  const currencies = [
    { symbol: '₹', code: 'INR', label: '₹ INR (Indian Rupee)' },
    { symbol: '$', code: 'USD', label: '$ USD (US Dollar)' },
    { symbol: '€', code: 'EUR', label: '€ EUR (Euro)' },
    { symbol: '£', code: 'GBP', label: '£ GBP (British Pound)' },
    { symbol: 'A$', code: 'AUD', label: 'A$ AUD (Australian Dollar)' },
    { symbol: 'C$', code: 'CAD', label: 'C$ CAD (Canadian Dollar)' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 text-left">
      
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Settings & Storefront
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your seller channels, currency, affiliate tracking parameters, and preferences
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 1. User Profile Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">{sanitizeDisplayName(currentUser.name)}</h2>
              {currentUser.accountType === 'business' ? (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Business Seller
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Member Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">{maskEmail(currentUser.email)}</p>
            {userChannels.length > 0 ? (
              <p className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>My Channel: @{userChannels[0].username} (1/1 Account Limit)</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>No Channel Created (0/1 Used)</span>
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          <span>Joined: {currentUser.joinedDate || '2026'}</span>
        </div>
      </div>

      {/* 2. CHANNELS & SELLER STOREFRONTS SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                My Channel & Storefront
              </h3>
              <p className="text-xs text-slate-500">
                Each account is limited to one official channel to maintain quality curation
              </p>
            </div>
          </div>

          {userChannels.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                1 of 1 Channel Used
              </span>
              {onOpenDashboard && (
                <button
                  onClick={onOpenDashboard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Channel Studio</span>
                </button>
              )}
            </div>
          ) : (
            onOpenCreateChannel && (
              <button
                onClick={onOpenCreateChannel}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Channel</span>
              </button>
            )
          )}
        </div>

        {userChannels.length === 0 ? (
          <div className="p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">
              You haven't created a channel yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Every seller must create a channel before publishing products. Your channel gives you a custom @handle, banner, and public storefront.
            </p>
            {onOpenCreateChannel && (
              <button
                onClick={onOpenCreateChannel}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Channel Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userChannels.map((c) => (
              <div
                key={c.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.logo && c.logo.trim() !== '' ? c.logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                    alt={c.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                    <span className="text-xs font-semibold text-indigo-600 block">@{c.username}</span>
                    <span className="text-[11px] text-slate-400 block">{c.category} · {c.followersCount || 0} followers</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  {onOpenChannelProfile && (
                    <button
                      onClick={() => onOpenChannelProfile(c)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Storefront</span>
                    </button>
                  )}

                  {onOpenDashboard && (
                    <button
                      onClick={onOpenDashboard}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Dashboard</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Functional Setting: Currency Preference */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Default Display Currency
            </h3>
            <p className="text-xs text-slate-500">
              Choose the currency symbol used when creating listings and browsing products
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              type="button"
              onClick={() => onUpdateSettings({ currency: curr.symbol })}
              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                settings.currency === curr.symbol
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{curr.label}</span>
              {settings.currency === curr.symbol && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Functional Setting: Custom Affiliate Tracking Tag */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-slate-900">
              Outbound Affiliate Tracking Parameter
            </h3>
            <p className="text-xs text-slate-500">
              Automatically append your affiliate ID or partner tag to destination store links
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAffiliateTag} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={affiliateTagInput}
              onChange={(e) => setAffiliateTagInput(e.target.value)}
              placeholder="e.g. tag=mydeal-21 or ref=dealsphere"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all whitespace-nowrap"
            >
              Save Parameter
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-xs text-slate-600 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.appendTrackingTag}
                onChange={(e) => onUpdateSettings({ appendTrackingTag: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Enable auto-appending to outbound store links</span>
            </label>

            {tagSavedNotice && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 5. Functional Setting: Marketplace Feed View Mode */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Marketplace Grid Layout
            </h3>
            <p className="text-xs text-slate-500">
              Customize how product listings are arranged in the main explore catalog
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onUpdateSettings({ viewMode: 'grid' })}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
              settings.viewMode === 'grid'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="font-bold">Showcase Grid</div>
              <div className="text-[11px] text-slate-500 font-normal">Spacious product cards</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ viewMode: 'list' })}
            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
              settings.viewMode === 'list'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <List className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="font-bold">Compact Deals List</div>
              <div className="text-[11px] text-slate-500 font-normal">Dense itemized view</div>
            </div>
          </button>
        </div>
      </div>

      {/* 6. Functional Setting: Purchase Verification Policy */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Purchase Verification Confirmation
              </h3>
              <p className="text-xs text-slate-500">
                Prompt "Did you complete this purchase?" when clicking buy, so unpurchased links are never added to your Orders tab
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={settings.verifyPurchasePrompt}
              onChange={(e) => onUpdateSettings({ verifyPurchasePrompt: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* 7. Google AdMob Ads & Monetization Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900">
                  Ad Monetization & Publisher Tags
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Publisher Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Publisher and verification code <code className="text-indigo-600 font-bold">ddcf7d341d3bffc2ba9a47de625c49cf697a5587</code> configured for banner and rewarded placements
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={settings.rewardedAdOnSave !== false}
              onChange={(e) => onUpdateSettings({ rewardedAdOnSave: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Banner Ad Unit Box */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Responsive Banner Ad</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Active Code
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Placements in Header, Home Feed & Product Details
            </p>
            <div className="text-[11px] font-mono bg-white p-1.5 rounded-lg border border-slate-200/90 text-indigo-950 font-bold truncate select-all">
              ddcf7d341d3bffc2ba9a47de625c49cf697a5587
            </div>
          </div>

          {/* Rewarded Ad Unit Box */}
          <div className="p-3.5 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Rewarded Ad Unit (Save Option)</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Active Code
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Triggered with verified reward credit when user saves deals
            </p>
            <div className="text-[11px] font-mono bg-white p-1.5 rounded-lg border border-indigo-200/90 text-indigo-950 font-bold truncate select-all">
              ddcf7d341d3bffc2ba9a47de625c49cf697a5587
            </div>
          </div>
        </div>

        {onTestRewardedAd && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onTestRewardedAd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-colors active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Ad Unit (ddcf7d341d3bffc2ba9a47de625c49cf697a5587)</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. Functional Setting: Data Management & Backup */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Data Management & Local Cache
            </h3>
            <p className="text-xs text-slate-500">
              Export your account data or clear local shopping carts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportData}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left text-xs transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Activity (.json)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Download channels, orders, and saved items
              </div>
            </div>
            {exportedNotice && (
              <span className="text-[11px] text-emerald-600 font-bold">Downloaded!</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClearCart}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50/50 text-left text-xs transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-900 group-hover:text-rose-700 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                <span>Clear Saved Cart Items</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Reset your active cart ({cartItems.length} items currently)
              </div>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};
