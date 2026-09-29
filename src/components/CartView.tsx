import React from 'react';
import { CartItem, MarketProduct, UserAccount } from '../types';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowUpRight, 
  ShieldCheck, 
  Plus, 
  Minus,
  Check,
  Store,
  ArrowRight
} from 'lucide-react';
import { getDomainFromUrl } from '../utils/url';

interface Props {
  currentUser: UserAccount | null;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToBuy: (product: MarketProduct) => void;
  onExploreProducts: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
}

export const CartView: React.FC<Props> = ({
  currentUser,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToBuy,
  onExploreProducts,
  onOpenSignIn,
  onOpenSignUp,
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">
          Sign In or Sign Up to View Saved Items
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Sign in or create a free account to save items to your personal cart and access direct seller deals.
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

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const currency = cartItems[0]?.product.currency || '₹';

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900">
          Your Saved Cart is Empty
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Discover products and curated deals uploaded by marketplace sellers, then save them or buy directly.
        </p>
        <button
          onClick={onExploreProducts}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-colors"
        >
          Explore Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-baseline justify-between pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Saved Items ({totalItems})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Products saved for direct purchase from seller store links
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {cartItems.map((item) => {
            const domain = getDomainFromUrl(item.product.productLink);
            return (
              <div key={item.product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  {item.product.imageUrl && item.product.imageUrl.trim() !== '' ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-20 h-20 object-contain rounded-xl bg-slate-50 border border-slate-200 p-1.5 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>{domain}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                      {item.product.title}
                    </h3>
                    
                    <div className="text-[11px] text-slate-500">
                      Curated by: <span className="font-semibold text-slate-800">{item.product.sellerName}</span>
                    </div>

                    {/* Stepper & Remove */}
                    <div className="flex items-center gap-3 pt-1.5">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-l transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900 font-tabular">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-r transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right price and buy button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-3 border-t sm:border-0 border-slate-100 pt-2 sm:pt-0">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-tabular block">
                      {item.product.currency}{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-slate-400 block font-tabular">
                        ({item.product.currency}{item.product.price.toLocaleString()} each)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onProceedToBuy(item.product)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-100 flex items-center gap-1.5 transition-colors whitespace-nowrap active:scale-[0.98]"
                  >
                    <span>Buy on Store</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtotal Checkout Summary Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-slate-500 font-medium">Subtotal ({totalItems} items):</span>
              <span className="font-black text-2xl text-slate-900 font-tabular tracking-tight">
                {currency}{subtotal.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Clicking "Buy on Store" redirects directly to the seller's uploaded destination checkout link.
            </p>
          </div>

          <button
            onClick={() => onProceedToBuy(cartItems[0].product)}
            className="w-full py-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Buy on {getDomainFromUrl(cartItems[0].product.productLink)}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct Safe Redirection to Official Seller Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
