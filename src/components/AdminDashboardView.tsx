import React, { useState, useMemo } from 'react';
import { Channel, MarketProduct, ReportRecord, UserAccount, ProductStatus } from '../types';
import { 
  ShieldCheck, 
  Store, 
  Package, 
  Flag, 
  BarChart3, 
  Search, 
  Check, 
  X, 
  Ban, 
  RotateCcw, 
  Trash2, 
  Eye, 
  AlertTriangle,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { updateChannel, updateReportStatus } from '../services/channelService';

interface Props {
  currentUser: UserAccount;
  channels: Channel[];
  products: MarketProduct[];
  reports: ReportRecord[];
  onUpdateProductStatus: (productId: string, status: ProductStatus, reason?: string) => void;
  onDeleteProduct: (productId: string) => void;
  onRefreshChannels: () => void;
  onRefreshReports: () => void;
  onOpenChannelProfile: (channel: Channel) => void;
  onShowToast: (msg: string) => void;
}

export const AdminDashboardView: React.FC<Props> = ({
  currentUser,
  channels,
  products,
  reports,
  onUpdateProductStatus,
  onDeleteProduct,
  onRefreshChannels,
  onRefreshReports,
  onOpenChannelProfile,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'channels' | 'reports'>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | ProductStatus>('all');
  const [channelSearch, setChannelSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Platform Metrics
  const stats = useMemo(() => {
    const totalChannels = channels.length;
    const activeChannels = channels.filter((c) => c.status !== 'suspended').length;
    const suspendedChannels = channels.filter((c) => c.status === 'suspended').length;

    const totalProducts = products.length;
    const pendingProducts = products.filter((p) => p.status === 'pending').length;
    const publishedProducts = products.filter((p) => !p.status || p.status === 'published').length;
    const rejectedProducts = products.filter((p) => p.status === 'rejected').length;

    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0) + channels.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalClicks = products.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const pendingReports = reports.filter((r) => r.status === 'pending').length;

    return {
      totalChannels,
      activeChannels,
      suspendedChannels,
      totalProducts,
      pendingProducts,
      publishedProducts,
      rejectedProducts,
      totalViews,
      totalClicks,
      pendingReports,
    };
  }, [channels, products, reports]);

  // Channel suspension toggle
  const handleToggleSuspendChannel = async (channel: Channel) => {
    const newStatus = channel.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateChannel(channel.id, { status: newStatus });
      onRefreshChannels();
      onShowToast(
        newStatus === 'suspended'
          ? `Channel @${channel.username} has been suspended.`
          : `Channel @${channel.username} restored to active status.`
      );
    } catch {
      onShowToast('Failed to update channel status.');
    }
  };

  // Report status update
  const handleReportAction = async (reportId: string, status: ReportRecord['status']) => {
    try {
      await updateReportStatus(reportId, status);
      onRefreshReports();
      onShowToast(`Report marked as ${status}.`);
    } catch {
      onShowToast('Failed to update report status.');
    }
  };

  // Filtered products for admin
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productStatusFilter !== 'all') {
        const s = p.status || 'published';
        if (s !== productStatusFilter) return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inSeller = p.sellerName.toLowerCase().includes(q);
        const inChannel = (p.channelUsername || '').toLowerCase().includes(q);
        if (!inTitle && !inSeller && !inChannel) return false;
      }
      return true;
    });
  }, [products, productStatusFilter, productSearch]);

  // Filtered channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (!channelSearch.trim()) return true;
      const q = channelSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q)
      );
    });
  }, [channels, channelSearch]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (reportFilter === 'all') return true;
      return r.status === reportFilter;
    });
  }, [reports, reportFilter]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-left">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl text-white">
                Platform Admin Panel
              </h1>
              <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Moderation controls for channels, product approvals, and user reports.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700">
          Admin: <strong className="text-white">{currentUser.email}</strong>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Platform Overview
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Product Moderation</span>
          {stats.pendingProducts > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {stats.pendingProducts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'channels'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Channels Management ({channels.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>User Reports</span>
          {stats.pendingReports > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {stats.pendingReports}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Total Channels</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalChannels}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {stats.activeChannels} active · {stats.suspendedChannels} suspended
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Total Products</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalProducts}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.publishedProducts} live · {stats.pendingProducts} pending
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Platform Engagement</span>
              <div className="text-2xl font-black text-slate-900">{stats.totalViews}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.totalClicks} outbound clicks
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Pending Actions</span>
              <div className="text-2xl font-black text-amber-600">
                {stats.pendingProducts + stats.pendingReports}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.pendingProducts} reviews · {stats.pendingReports} reports
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by title, seller, or channel..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white outline-none"
                />
              </div>

              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review Only</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No products match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3 pl-2">Product</th>
                    <th className="pb-3">Channel / Seller</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const status = p.status || 'published';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-2 max-w-xs">
                          <div className="flex items-center gap-2.5">
                            {p.imageUrl && p.imageUrl.trim() !== '' ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 shrink-0 p-0.5"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">{p.title}</span>
                              <span className="text-[11px] text-slate-400 block truncate">{p.category}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">@{p.channelUsername || 'direct'}</div>
                          <span className="text-[11px] text-slate-400">{p.sellerName}</span>
                        </td>

                        <td className="py-3 whitespace-nowrap font-bold text-slate-900 font-tabular">
                          {p.currency}{p.price.toLocaleString()}
                        </td>

                        <td className="py-3 whitespace-nowrap">
                          {status === 'published' && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Published
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Pending Review
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Rejected
                            </span>
                          )}
                          {status === 'draft' && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          )}
                        </td>

                        <td className="py-3 pr-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {status !== 'published' && (
                              <button
                                onClick={() => {
                                  onUpdateProductStatus(p.id, 'published');
                                  onShowToast(`Product "${p.title.slice(0, 20)}..." Approved & Published!`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                                title="Approve & Publish"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {status !== 'rejected' && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (optional):') || 'Violates community guidelines';
                                  onUpdateProductStatus(p.id, 'rejected', reason);
                                  onShowToast('Product rejected.');
                                }}
                                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                                title="Reject Product"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm(`Permanently remove violating product "${p.title}"?`)) {
                                  onDeleteProduct(p.id);
                                  onShowToast('Violating product removed.');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Delete Violating Product"
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

      {/* TAB 3: CHANNELS MANAGEMENT */}
      {activeTab === 'channels' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3 pl-2">Channel</th>
                  <th className="pb-3">Category / Type</th>
                  <th className="pb-3">Followers</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChannels.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={c.logo && c.logo.trim() !== '' ? c.logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`;
                          }}
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block truncate">{c.name}</span>
                          <span className="text-[11px] text-indigo-600 block">@{c.username}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span className="text-slate-800">{c.category}</span>
                      <span className="text-[11px] text-slate-400 block">{c.channelType}</span>
                    </td>

                    <td className="py-3 whitespace-nowrap font-tabular font-semibold text-slate-700">
                      {c.followersCount || 0}
                    </td>

                    <td className="py-3 whitespace-nowrap font-tabular font-semibold text-slate-700">
                      {c.views || 0}
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      {c.status === 'suspended' ? (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Suspended
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 pr-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenChannelProfile(c)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="Open Channel Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleSuspendChannel(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                            c.status === 'suspended'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          }`}
                        >
                          {c.status === 'suspended' ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USER REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Flagged Content & Reports</h3>
            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full outline-none"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending Only</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No reports found.</p>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        {r.targetType}: {r.reason}
                      </span>
                      <strong className="text-slate-900">{r.targetTitle}</strong>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                    "{r.details}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Status: <strong className="text-slate-700">{r.status}</strong>
                    </span>

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleReportAction(r.id, 'resolved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleReportAction(r.id, 'dismissed')}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
