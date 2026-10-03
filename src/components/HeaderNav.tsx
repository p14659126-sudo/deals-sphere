import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  Video,
  ChevronDown,
  Settings,
  AtSign,
  Crown
} from 'lucide-react';
import { UserAccount, Channel, PLAN_LIMITS } from '../types';
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
  onOpenUploadVideo?: () => void;
  onOpenCreateChannel: () => void;
  onOpenMyChannel?: () => void;
  userChannel?: Channel | null;
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
  onOpenUploadVideo,
  onOpenCreateChannel,
  onOpenMyChannel,
  userChannel,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut,
  onToggleSidebar,
  hasChannel,
  isAdmin,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planKey = currentUser?.subscriptionPlan || 'free';
  const planInfo = PLAN_LIMITS[planKey];

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
              <span>Creator Studio</span>
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
              placeholder="Search products, keywords, channels, deals..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder-slate-400 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
        </div>

        {/* Right Header Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <>
              {/* Add Product Button */}
              <button
                onClick={onOpenUpload}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shadow-xs"
                title="Add new product"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>

              {/* Cart / Saved button */}
              <button
                onClick={() => onNavigateTab('cart')}
                className="relative p-2 text-slate-600 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Saved Items"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Account Dropdown (Requirement #1: "The first channel option in the account menu should be: My Channel") */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-all select-none"
                  title="Account Menu"
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
                  <span className="hidden md:block font-semibold text-slate-800 text-xs truncate max-w-[100px]">
                    {sanitizeDisplayName(currentUser.name).split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Account Menu Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-200 py-2 z-50 text-left animate-in fade-in duration-150">
                    
                    {/* User profile card */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-indigo-600" />
                          <span>{planInfo.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* CHANNEL SECTION — Requirement #1: "The first channel option in the account menu should be: My Channel" */}
                    <div className="py-1 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onOpenMyChannel) {
                            onOpenMyChannel();
                          } else {
                            onNavigateTab('channel-profile' as any);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-black">My Channel</span>
                          {userChannel ? (
                            <span className="block text-[10px] text-slate-500 font-mono font-normal truncate">
                              @{userChannel.username}
                            </span>
                          ) : (
                            <span className="block text-[10px] text-indigo-600 font-normal">
                              View storefront
                            </span>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateTab('dashboard');
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                      >
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Creator Studio</span>
                      </button>
                    </div>

                    {/* Quick creation options */}
                    <div className="py-1 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenUpload();
                        }}
                        className="w-full px-4 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-400" />
                        <span>Add Product</span>
                      </button>

                      {onOpenUploadVideo && (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenUploadVideo();
                          }}
                          className="w-full px-4 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                        >
                          <Video className="w-4 h-4 text-red-500" />
                          <span>Upload Video</span>
                        </button>
                      )}
                    </div>

                    {/* Settings & Sign Out */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigateTab('settings');
                        }}
                        className="w-full px-4 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full px-4 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
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
