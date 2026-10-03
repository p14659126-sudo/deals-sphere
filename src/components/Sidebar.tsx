import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  Settings, 
  LogOut, 
  LogIn, 
  Store, 
  PlusCircle, 
  Sparkles, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Tag, 
  Compass, 
  Filter, 
  Layers, 
  HelpCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import { UserAccount, AppSettings, Channel } from '../types';
import { TabType } from './BottomNav';
import { maskEmail, sanitizeDisplayName } from '../utils/privacy';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  activeTab: TabType;
  onNavigateTab: (tab: TabType) => void;
  cartCount: number;
  ordersCount: number;
  onOpenUpload: () => void;
  onOpenCreateChannel: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
  onSignOut: () => void;
  settings: AppSettings;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
  userChannels?: Channel[];
  onOpenMyChannel?: () => void;
  onOpenUploadVideo?: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  onNavigateTab,
  cartCount,
  ordersCount,
  onOpenUpload,
  onOpenUploadVideo,
  onOpenCreateChannel,
  onOpenMyChannel,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut,
  settings,
  selectedCategory,
  onSelectCategory,
  availableCategories,
  userChannels = [],
  isAdmin,
}) => {
  const handleNav = (tab: TabType) => {
    onNavigateTab(tab);
    onClose();
  };

  const hasChannel = userChannels.length > 0;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel: Sliding drawer on mobile, docked on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 shadow-xl lg:shadow-none flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:z-10`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-black text-base tracking-tight text-slate-900 flex items-center leading-none">
                Deal<span className="text-indigo-600">Sphere</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mt-0.5">
                Channel Marketplace
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
          
          {/* Main App Navigation */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1">
              Marketplace
            </span>

            <button
              onClick={() => handleNav('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'home'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Explore Products</span>
            </button>

            <button
              onClick={() => handleNav('discover')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'discover'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Discover Channels</span>
            </button>

            <button
              onClick={() => handleNav('cart')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'cart'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>Saved Items</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-slate-500" />
                <span>Outbound Orders</span>
              </div>
              {ordersCount > 0 && (
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {ordersCount}
                </span>
              )}
            </button>
          </div>

          {/* Seller / Channel Hub Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Seller & Channels
            </span>

            {currentUser && hasChannel ? (
              <>
                <button
                  onClick={() => {
                    if (onOpenMyChannel) {
                      onOpenMyChannel();
                    } else {
                      handleNav('channel-profile' as any);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-900 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0 text-left">
                      <span className="block font-black text-indigo-950 leading-tight">My Channel</span>
                      {userChannels[0] && (
                        <span className="block text-[10px] text-slate-500 font-mono font-normal truncate">
                          @{userChannels[0].username}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                <button
                  onClick={() => handleNav('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Creator Studio</span>
                </button>

                <button
                  onClick={() => {
                    onOpenUpload();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Add Product</span>
                </button>

                {onOpenUploadVideo && (
                  <button
                    onClick={() => {
                      onOpenUploadVideo();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <PlusCircle className="w-4 h-4 text-red-600" />
                    <span>Upload Video</span>
                  </button>
                )}
              </>
            ) : (
              <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-100/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>Start Selling</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Create a public channel to list products, share affiliate deals, and gain followers.
                </p>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenSignIn();
                    } else {
                      onOpenCreateChannel();
                    }
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Channel</span>
                </button>
              </div>
            )}
          </div>

          {/* Admin Access (if Admin) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 px-3 block">
                Administration
              </span>
              <button
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Moderation</span>
              </button>
            </div>
          )}

          {/* Product Categories Filter */}
          {availableCategories.length > 1 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1">
                Filter by Category
              </span>

              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    if (activeTab !== 'home') handleNav('home');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{cat === 'all' ? 'All Categories' : cat}</span>
                  {selectedCategory === cat && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Settings Link */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings & Profile</span>
            </button>
          </div>
        </div>

        {/* Footer User Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {sanitizeDisplayName(currentUser.name)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {maskEmail(currentUser.email)}
                  </div>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onOpenSignIn();
                  onClose();
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              >
                Sign In
              </button>
              {onOpenSignUp && (
                <button
                  onClick={() => {
                    onOpenSignUp();
                    onClose();
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                >
                  Create Free Account
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
