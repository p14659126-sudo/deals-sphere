import React, { useState, useEffect } from 'react';
import { MarketProduct, UserAccount, Channel, ProductType, ProductStatus } from '../types';
import { normalizeProductLink } from '../utils/url';
import { sanitizeDisplayName } from '../utils/privacy';
import { auth } from '../firebase';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Link2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Eye,
  Store,
  Tag,
  Plus,
  Trash2,
  Video,
  Ticket,
  Truck,
  Percent,
  Layers,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  userChannels: Channel[];
  onAddProduct: (product: MarketProduct) => void;
  onUpdateProduct?: (product: MarketProduct) => void;
  editingProduct?: MarketProduct | null;
  onOpenCreateChannel: () => void;
  defaultCurrency?: string;
}

const CATEGORIES = [
  'Electronics & Gadgets',
  'Books & Comics',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Gaming & Collectibles',
  'Beauty & Personal Care',
  'Fitness & Sports',
  'Deals & Coupons',
  'Software & Digital Goods',
  'Automotive & Tools',
  'Other'
];

const MERCHANTS = [
  'Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Croma', 'Reliance Digital', 
  'Tata CLiQ', 'Nykaa', 'Direct Brand Store', 'Other'
];

export const UploadProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  userChannels,
  onAddProduct,
  onUpdateProduct,
  editingProduct,
  onOpenCreateChannel,
  defaultCurrency = '₹',
}) => {
  // If user has NO channels, show the required "Create your channel first" screen
  const hasChannel = userChannels && userChannels.length > 0;

  // Form states
  const [selectedChannelId, setSelectedChannelId] = useState(
    editingProduct?.channelId || (userChannels[0]?.id || '')
  );
  const [name, setName] = useState(editingProduct?.title || editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [productUrl, setProductUrl] = useState(editingProduct?.productLink || editingProduct?.productUrl || '');
  const [imageUrl, setImageUrl] = useState(editingProduct?.imageUrl || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(editingProduct?.images || []);
  const [videoUrl, setVideoUrl] = useState(editingProduct?.videoUrl || '');
  const [price, setPrice] = useState<string>(editingProduct ? String(editingProduct.price) : '');
  const [mrp, setMrp] = useState<string>(editingProduct ? String(editingProduct.originalPrice || editingProduct.mrp || editingProduct.price) : '');
  const [category, setCategory] = useState(editingProduct?.category || CATEGORIES[0]);
  const [merchant, setMerchant] = useState(editingProduct?.merchant || 'Amazon');
  const [currency, setCurrency] = useState(editingProduct?.currency || defaultCurrency);
  const [productType, setProductType] = useState<ProductType>(editingProduct?.productType || 'Affiliate');
  const [status, setStatus] = useState<ProductStatus>(editingProduct?.status || 'published');
  
  // Optional / Extra fields
  const [brand, setBrand] = useState(editingProduct?.brand || '');
  const [sku, setSku] = useState(editingProduct?.sku || '');
  const [tagsInput, setTagsInput] = useState((editingProduct?.tags || []).join(', '));
  const [highlights, setHighlights] = useState<string[]>(editingProduct?.highlights || ['']);
  const [shippingInfo, setShippingInfo] = useState(editingProduct?.shippingInfo || 'Free Standard Delivery');
  const [deliveryInfo, setDeliveryInfo] = useState(editingProduct?.deliveryInfo || 'Dispatched in 24-48 hours');
  const [couponCode, setCouponCode] = useState(editingProduct?.couponCode || '');
  const [couponExpiry, setCouponExpiry] = useState(editingProduct?.couponExpiry || '');
  const [color, setColor] = useState(editingProduct?.color || '');
  const [size, setSize] = useState(editingProduct?.size || '');

  // Affiliate specific fields
  const [affiliateUrl, setAffiliateUrl] = useState(editingProduct?.affiliateUrl || '');
  const [affiliateNetwork, setAffiliateNetwork] = useState(editingProduct?.affiliateNetwork || 'Amazon Associates');
  const [commissionNote, setCommissionNote] = useState(editingProduct?.commissionNote || '');

  const [error, setError] = useState<string | null>(null);

  // Auto calculate discount percentage
  const numPrice = parseFloat(price);
  const numMrp = parseFloat(mrp);
  const calculatedDiscount = (!isNaN(numPrice) && !isNaN(numMrp) && numMrp > numPrice && numMrp > 0)
    ? Math.round(((numMrp - numPrice) / numMrp) * 100)
    : 0;

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.title || editingProduct.name || '');
      setDescription(editingProduct.description || '');
      setProductUrl(editingProduct.productLink || editingProduct.productUrl || '');
      setImageUrl(editingProduct.imageUrl || '');
      setGalleryImages(editingProduct.images || []);
      setVideoUrl(editingProduct.videoUrl || '');
      setPrice(String(editingProduct.price));
      setMrp(String(editingProduct.originalPrice || editingProduct.mrp || editingProduct.price));
      setCategory(editingProduct.category || CATEGORIES[0]);
      setMerchant(editingProduct.merchant || 'Amazon');
      setProductType(editingProduct.productType || 'Affiliate');
      setStatus(editingProduct.status || 'published');
      setSelectedChannelId(editingProduct.channelId || userChannels[0]?.id || '');
      setBrand(editingProduct.brand || '');
      setTagsInput((editingProduct.tags || []).join(', '));
      setHighlights(editingProduct.highlights && editingProduct.highlights.length > 0 ? editingProduct.highlights : ['']);
      setShippingInfo(editingProduct.shippingInfo || 'Free Standard Delivery');
      setCouponCode(editingProduct.couponCode || '');
      setCouponExpiry(editingProduct.couponExpiry || '');
      setAffiliateUrl(editingProduct.affiliateUrl || '');
      setAffiliateNetwork(editingProduct.affiliateNetwork || 'Amazon Associates');
      setCommissionNote(editingProduct.commissionNote || '');
    }
  }, [editingProduct, userChannels]);

  if (!isOpen) return null;

  // Highlight bullet helper
  const handleAddHighlight = () => setHighlights([...highlights, '']);
  const handleUpdateHighlight = (index: number, val: string) => {
    const updated = [...highlights];
    updated[index] = val;
    setHighlights(updated);
  };
  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('Image file is too large. Please select an image under 4MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a product title');
      return;
    }
    if (!productUrl.trim()) {
      setError('Please enter the target product destination link');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid selling price greater than 0');
      return;
    }
    const finalMrp = (!isNaN(numMrp) && numMrp >= numPrice) ? numMrp : numPrice;
    const finalTargetLink = normalizeProductLink(productUrl);

    // Selected Channel
    const activeChannel = userChannels.find((c) => c.id === selectedChannelId) || userChannels[0];
    if (!activeChannel) {
      setError('Please select a channel to publish this product under.');
      return;
    }

    const cleanHighlights = highlights.filter((h) => h.trim().length > 0);
    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const now = new Date().toISOString();

    const productPayload: MarketProduct = {
      id: editingProduct?.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      channelId: activeChannel.id,
      channelUsername: activeChannel.username,
      channelName: activeChannel.name,
      channelLogo: activeChannel.logo,
      sellerId: auth.currentUser?.uid || currentUser.id,
      sellerName: activeChannel.name || currentUser.businessName || sanitizeDisplayName(currentUser.name, 'Verified Curator'),
      title: name.trim(),
      name: name.trim(),
      description: description.trim() || `${name} - Curated product offered on Deal Sphere.`,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      images: galleryImages.length > 0 ? galleryImages : [imageUrl.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'],
      videoUrl: videoUrl.trim() || undefined,
      productLink: finalTargetLink,
      productUrl: finalTargetLink,
      affiliateUrl: affiliateUrl.trim() || undefined,
      affiliateNetwork: affiliateNetwork || undefined,
      commissionNote: commissionNote.trim() || undefined,
      price: numPrice,
      originalPrice: finalMrp,
      mrp: finalMrp,
      discount: calculatedDiscount,
      currency,
      category,
      merchant,
      productType,
      status: status || 'published',
      brand: brand.trim() || undefined,
      sku: sku.trim() || undefined,
      tags: cleanTags,
      highlights: cleanHighlights,
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      shippingInfo: shippingInfo.trim() || undefined,
      deliveryInfo: deliveryInfo.trim() || undefined,
      couponCode: couponCode.trim() || undefined,
      couponExpiry: couponExpiry.trim() || undefined,
      rating: editingProduct?.rating || 4.8,
      reviewCount: editingProduct?.reviewCount || Math.floor(Math.random() * 40) + 12,
      views: editingProduct?.views || 0,
      clicks: editingProduct?.clicks || 0,
      inStock: true,
      freeDelivery: shippingInfo.toLowerCase().includes('free'),
      createdAt: editingProduct?.createdAt || now,
      updatedAt: now,
    };

    if (editingProduct && onUpdateProduct) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 text-left">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 max-h-[92vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* If user does NOT have a channel, show the required UX rule */}
        {!hasChannel ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm border border-indigo-100">
              <Store className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                Create your channel first
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your channel is your store on Deal Sphere. Create one to start adding products and sharing deals.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-full"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateChannel();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Channel</span>
              </button>
            </div>
          </div>
        ) : (
          /* User HAS at least one channel: Full Add / Edit Product Form */
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">
                    {editingProduct ? 'Edit Product Listing' : 'Add Product to Channel'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Publish physical products, deals, or affiliate links to your store
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Channel Selector / Indicator */}
              {userChannels.length === 1 ? (
                <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                        Publishing Under Channel
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {userChannels[0]?.name}{' '}
                        <span className="text-indigo-600 font-semibold">(@{userChannels[0]?.username})</span>
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-full shrink-0">
                    Active Storefront
                  </span>
                </div>
              ) : (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Publish Under Channel</span>
                  </label>
                  <select
                    value={selectedChannelId}
                    onChange={(e) => setSelectedChannelId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-indigo-200 text-indigo-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {userChannels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (@{c.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as ProductType)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Physical">Physical Product</option>
                    <option value="Affiliate">Affiliate Product</option>
                    <option value="Deal/Offer">Deal / Offer</option>
                    <option value="Digital">Digital Product</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="published">Published (Live immediately)</option>
                    <option value="pending">Pending Review</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  maxLength={160}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 24999"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price / MRP ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="e.g. 29990"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculated Discount
                  </label>
                  <div className="px-3.5 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl font-bold text-emerald-700 flex items-center justify-between">
                    <span>{calculatedDiscount}% OFF</span>
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Target Destination Link & Merchant */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Destination / Buy Link <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://amazon.in/dp/B09XS7JWHH"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merchant / Platform
                  </label>
                  <select
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {MERCHANTS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Images (Primary + Gallery) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Image <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl && imageUrl.trim() !== '' ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">or paste image link</span>
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony, Apple, Nike"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe why this product or deal is worth buying..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                  required
                />
              </div>

              {/* Highlights / Features (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Key Highlights / Feature Bullets (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {highlights.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                        placeholder={`Feature highlight ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                      {highlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon / Discount Code (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Coupon / Promo Code (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20 or FLAT500"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coupon Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Affiliate Details (if Affiliate Product) */}
              {productType === 'Affiliate' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Affiliate Partner Details</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      (Private tracking notes not shown to customers)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Affiliate Network / Source</span>
                      <input
                        type="text"
                        value={affiliateNetwork}
                        onChange={(e) => setAffiliateNetwork(e.target.value)}
                        placeholder="Amazon Associates, EarnKaro, Impact, etc."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Seller Commission Note (Private)</span>
                      <input
                        type="text"
                        value={commissionNote}
                        onChange={(e) => setCommissionNote(e.target.value)}
                        placeholder="e.g. 8% commission on electronics"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
