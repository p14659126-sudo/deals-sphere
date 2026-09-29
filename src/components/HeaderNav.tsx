import React from 'react';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Plus, 
  Sparkles, 
  LogIn, 
  LogOut, 
  ArrowUpRight, 
  Menu, 
  Store, 
  Compass, 
  ShieldCheck,
  Layers
} from 'lucide-react';
import { UserAccount, Channel } from '../types';
import { TabType } from './BottomNav';
import { sanitizeDisplayName } from '../utils/privacy';

interface Props {
  currentUser: UserAccount | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  activeTab: TabType;
  onNavigateTab: (tab: TabType) => void;
  onOpenUpload: () => void;
  onOpenCreateChannel: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  hasChannel?: boolean;
  isAdmin?: boolean;
}

export const HeaderNav: React.FC<Props> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  cartCount,
  activeTab,
  onNavigateTab,
  onOpenUpload,
  onOpenCreateChannel,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut,
  onToggleSidebar,
  hasChannel,
  isAdmin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-6">
        
        {/* Left Section: Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle navigation sidebar"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 flex items-center leading-none">
                Deal<span className="text-indigo-600">Sphere</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden sm:block">
                Channel Marketplace
              </span>
            </div>
          </div>

          {/* Quick Nav Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-3 border-l border-slate-200 pl-3">
            <button
              onClick={() => onNavigateTab('home')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Explore
            </button>

            <button
              onClick={() => onNavigateTab('discover')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                activeTab === 'discover'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-indigo-500" />
              <span>Channels</span>
            </button>

            <button
              onClick={() => onNavigateTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Seller Hub</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigateTab('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </div>

        {/* Minimalist Search Bar */}
        <div className="flex-1 max-w-md lg:max-w-lg relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, channels, deals..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder-slate-400 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right Header Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <>
              {/* Prominent "Create Channel" button if user doesn't have one, or "List Product" */}
              {!hasChannel ? (
                <button
                  onClick={onOpenCreateChannel}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-xs shadow-indigo-100 active:scale-[0.98]"
                  title="Create your storefront channel"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Create Channel</span>
                </button>
              ) : (
                <button
                  onClick={onOpenUpload}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shadow-xs shadow-indigo-100"
                  title="Add new product"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              )}

              {/* Cart / Saved button */}
              <button
                onClick={() => onNavigateTab('cart')}
                className="relative p-2 text-slate-600 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Saved Items"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute 1 top-0.5 right-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Profile Avatar Pill */}
              <button
                onClick={() => onNavigateTab('settings')}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-colors"
                title="Account Settings"
              >
                {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden md:block text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-800 block truncate max-w-[100px]">
                    {sanitizeDisplayName(currentUser.name).split(' ')[0]}
                  </span>
                </div>
              </button>

              {/* Sign Out */}
              <button
                onClick={onSignOut}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Logged Out Actions */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenSignIn}
                className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors"
                title="Sign in"
              >
                Sign In
              </button>
              <button
                onClick={onOpenSignUp || onOpenSignIn}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
