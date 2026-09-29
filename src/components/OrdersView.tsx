import React from 'react';
import { OrderRecord, UserAccount } from '../types';
import { Package, ExternalLink, ShieldCheck, ArrowRight, Clock, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { normalizeProductLink } from '../utils/url';

interface Props {
  currentUser: UserAccount | null;
  orders: OrderRecord[];
  onExploreProducts: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp?: () => void;
  onRemoveOrder?: (orderId: string) => void;
}

export const OrdersView: React.FC<Props> = ({ 
  currentUser, 
  orders, 
  onExploreProducts,
  onOpenSignIn,
  onOpenSignUp,
  onRemoveOrder
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm mx-auto flex items-center justify-center text-indigo-600">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">
          Sign In or Sign Up to View Your Orders
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Please sign in or create an account to track your confirmed purchases, view history, and access direct seller links.
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

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm mx-auto flex items-center justify-center text-slate-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-[#0F1111]">
          No Confirmed Orders Yet
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          When you click "Buy Now" on any product, we open the seller's link. If you confirm you completed the purchase, your order is recorded here.
        </p>
        <button
          onClick={onExploreProducts}
          className="px-6 py-2.5 text-xs font-bold text-slate-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full shadow transition-colors"
        >
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#0F1111]">
            Your Confirmed Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified purchases you confirmed after visiting seller store links
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
          {orders.length} {orders.length === 1 ? 'Purchase Recorded' : 'Purchases Recorded'}
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow"
          >
            <div className="flex items-center gap-4 min-w-0">
              {order.product.imageUrl && order.product.imageUrl.trim() !== '' ? (
                <img
                  src={order.product.imageUrl}
                  alt={order.product.title}
                  className="w-16 h-16 object-contain rounded bg-slate-50 border border-slate-200 p-1 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Confirmed Purchase</span>
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.clickedAt}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-[#0F1111] line-clamp-1">
                  {order.product.title}
                </h3>

                <div className="text-[11px] text-slate-500">
                  Sold by: <strong className="text-slate-800">{order.product.sellerName}</strong> · Price: <strong className="text-slate-900">{order.product.currency}{order.product.price.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
              <a
                href={normalizeProductLink(order.targetLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-bold text-slate-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Visit Store Again</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {onRemoveOrder && (
                <button
                  type="button"
                  onClick={() => onRemoveOrder(order.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                  title="Remove order record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
