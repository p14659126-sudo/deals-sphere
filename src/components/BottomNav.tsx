import React from 'react';
import { Compass, ShoppingBag, Settings, PlusCircle, Store, Package, Layers, ShieldCheck } from 'lucide-react';
import { AccountType } from '../types';

export type TabType = 'home' | 'discover' | 'dashboard' | 'orders' | 'cart' | 'settings' | 'upload' | 'admin';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  cartCount: number;
  ordersCount: number;
  accountType: AccountType;
  hasChannel?: boolean;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  cartCount,
  ordersCount,
  accountType,
  hasChannel,
  isAdmin,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] py-1 px-2 lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* 1. Explore Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative ${
            activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Home"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Explore</span>
          {activeTab === 'home' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
          )}
        </button>

        {/* 2. Discover Channels */}
        <button
          onClick={() => onChangeTab('discover')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative ${
            activeTab === 'discover' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Discover Channels"
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Channels</span>
          {activeTab === 'discover' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
          )}
        </button>

        {/* 3. Seller Dashboard or Sell */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-indigo-700 hover:text-indigo-800'
          }`}
          aria-label="Seller Dashboard"
        >
          <Layers className="w-5 h-5 text-indigo-600" />
          <span className="text-[10px] mt-0.5 font-semibold">Seller</span>
          {activeTab === 'dashboard' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
          )}
        </button>

        {/* 4. Cart / Saved */}
        <button
          onClick={() => onChangeTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 relative transition-all ${
            activeTab === 'cart' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold rounded-full px-1 min-w-4 h-4 flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Saved</span>
          {activeTab === 'cart' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
          )}
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all relative ${
            activeTab === 'settings' ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
          {activeTab === 'settings' && (
            <span className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
