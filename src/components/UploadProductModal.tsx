import React, { useState, useEffect } from 'react';
import { MarketProduct, UserAccount, Channel, ProductType, ProductStatus, PLAN_LIMITS } from '../types';
import { normalizeProductLink } from '../utils/url';
import { autoFetchProductFromUrl, ScrapedProductData, generateAiKeywords } from '../services/productScraperService';
import { identifyStoreGroup, getStoreGroupConfig, StoreGroup } from '../utils/merchant';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Link2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Store, 
  Plus, 
  Trash2, 
  Video, 
  Ticket, 
  Percent, 
  Loader2,
  CheckCircle2,
  ImagePlus,
  Play,
  RotateCcw,
  Zap,
  ListPlus,
  Tag,
  FileText,
  ShieldCheck,
  Eye,
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
  totalUserProductsCount?: number;
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
  'Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Ajio', 'Croma', 'Reliance Digital', 
  'Tata CLiQ', 'Nykaa', 'Direct Brand Store', 'Other'
];

const PRODUCT_TYPES: { id: ProductType; label: string; desc: string }[] = [
  { id: 'Affiliate', label: 'Affiliate Product', desc: 'Earn commissions when buyers click your affiliate destination URL' },
  { id: 'Physical', label: 'My Product', desc: 'Direct product you manufacture, stock, or sell yourself' },
  { id: 'Deal/Offer', label: 'Deal / Offer', desc: 'Time-limited discounted deal or coupon recommendation' },
  { id: 'Digital', label: 'Digital Product', desc: 'Downloadable media, software, guides, or digital goods' },
  { id: 'Other', label: 'Other', desc: 'Curated selection or specialty listing' },
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
  totalUserProductsCount = 0,
}) => {
  const hasChannel = userChannels && userChannels.length > 0;
  const currentPlan = currentUser.subscriptionPlan || 'free';
  const limits = PLAN_LIMITS[currentPlan];
  const isProductLimitReached = !editingProduct && totalUserProductsCount >= limits.maxProducts;

  // Active Tab: single import vs bulk import (Pro/Ultimate)
  const [activeMode, setActiveMode] = useState<'single' | 'bulk'>('single');

  // Single URL Import & Review Step: 'input' | 'review'
  const [step, setStep] = useState<'input' | 'review'>(editingProduct ? 'review' : 'input');

  // URL input for Method A
  const [inputUrl, setInputUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Bulk Import state
  const [bulkUrlsText, setBulkUrlsText] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number } | null>(null);

  // Form / Review state
  const [channelId, setChannelId] = useState(editingProduct?.channelId || userChannels[0]?.id || '');
  const [title, setTitle] = useState(editingProduct?.title || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [productUrl, setProductUrl] = useState(editingProduct?.productLink || '');
  const [affiliateUrl, setAffiliateUrl] = useState(editingProduct?.affiliateUrl || '');
  const [price, setPrice] = useState<string>(editingProduct ? String(editingProduct.price) : '');
  const [mrp, setMrp] = useState<string>(editingProduct ? String(editingProduct.originalPrice || editingProduct.mrp || editingProduct.price) : '');
  const [currency, setCurrency] = useState(editingProduct?.currency || defaultCurrency);
  const [category, setCategory] = useState(editingProduct?.category || CATEGORIES[0]);
  const [merchant, setMerchant] = useState(editingProduct?.merchant || 'Amazon');
  const [brand, setBrand] = useState(editingProduct?.brand || '');
  const [productType, setProductType] = useState<ProductType>(editingProduct?.productType || 'Affiliate');
  const [imageUrl, setImageUrl] = useState(editingProduct?.imageUrl || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(editingProduct?.images || []);
  const [newImageInput, setNewImageInput] = useState('');
  const [videoUrl, setVideoUrl] = useState(editingProduct?.videoUrl || '');
  const [keywords, setKeywords] = useState<string[]>(editingProduct?.keywords || []);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>(editingProduct?.highlights || ['']);
  const [variants, setVariants] = useState<string[]>(editingProduct?.variants || []);
  const [newVariantInput, setNewVariantInput] = useState('');
  const [couponCode, setCouponCode] = useState(editingProduct?.couponCode || '');
  const [status, setStatus] = useState<ProductStatus>(editingProduct?.status || 'published');
  const [inStock, setInStock] = useState(editingProduct?.inStock ?? true);
  const [freeDelivery, setFreeDelivery] = useState(editingProduct?.freeDelivery ?? true);

  // Discount calculation
  const numPrice = parseFloat(price);
  const numMrp = parseFloat(mrp);
  const discountPercent = (!isNaN(numPrice) && !isNaN(numMrp) && numMrp > numPrice && numMrp > 0)
    ? Math.round(((numMrp - numPrice) / numMrp) * 100)
    : 0;

  // Initialize or reset when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setStep('review');
      setChannelId(editingProduct.channelId || userChannels[0]?.id || '');
      setTitle(editingProduct.title);
      setDescription(editingProduct.description);
      setProductUrl(editingProduct.productLink);
      setAffiliateUrl(editingProduct.affiliateUrl || '');
      setPrice(String(editingProduct.price));
      setMrp(String(editingProduct.originalPrice || editingProduct.mrp || editingProduct.price));
      setCurrency(editingProduct.currency || defaultCurrency);
      setCategory(editingProduct.category || CATEGORIES[0]);
      setMerchant(editingProduct.merchant || 'Amazon');
      setBrand(editingProduct.brand || '');
      setProductType(editingProduct.productType || 'Affiliate');
      setImageUrl(editingProduct.imageUrl);
      setGalleryImages(editingProduct.images || (editingProduct.imageUrl ? [editingProduct.imageUrl] : []));
      setVideoUrl(editingProduct.videoUrl || '');
      setKeywords(editingProduct.keywords || (editingProduct.tags || []));
      setHighlights(editingProduct.highlights && editingProduct.highlights.length > 0 ? editingProduct.highlights : ['']);
      setVariants(editingProduct.variants || []);
      setCouponCode(editingProduct.couponCode || '');
      setStatus(editingProduct.status || 'published');
      setInStock(editingProduct.inStock ?? true);
      setFreeDelivery(editingProduct.freeDelivery ?? true);
    } else {
      setStep('input');
      setInputUrl('');
      setTitle('');
      setDescription('');
      setProductUrl('');
      setAffiliateUrl('');
      setPrice('');
      setMrp('');
      setBrand('');
      setProductType('Affiliate');
      setImageUrl('');
      setGalleryImages([]);
      setVideoUrl('');
      setKeywords([]);
      setHighlights(['']);
      setVariants([]);
      setCouponCode('');
      setStatus('published');
    }
    setImportError(null);
  }, [editingProduct, isOpen, userChannels, defaultCurrency]);

  if (!isOpen) return null;

  // Method A: Run AI Auto-Import from URL
  const handleImportProduct = async (urlToFetch: string) => {
    const cleanUrl = (urlToFetch || inputUrl).trim();
    if (!cleanUrl) {
      setImportError('Please enter a product URL to import.');
      return;
    }

    setIsImporting(true);
    setImportStatus('Accessing product link and analyzing metadata...');
    setImportError(null);

    try {
      const res = await autoFetchProductFromUrl(cleanUrl);
      if (!res.success || !res.product) {
        setImportError(res.error || "We couldn't automatically retrieve this product. Please enter the product information manually.");
        setIsImporting(false);
        return;
      }

      const p: ScrapedProductData = res.product;
      setImportStatus('Generating polished listing and AI search keywords...');

      // Populate review form with strictly extracted data
      setTitle(p.title);
      setDescription(p.description);
      setProductUrl(p.productLink || cleanUrl);
      if (!affiliateUrl) {
        setAffiliateUrl(p.productLink || cleanUrl);
      }
      setPrice(String(p.price));
      setMrp(String(p.originalPrice || p.mrp || p.price));
      setCurrency(p.currency || defaultCurrency);
      setMerchant(p.merchant || 'Amazon');
      setCategory(p.category || CATEGORIES[0]);
      setBrand(p.brand || '');
      setImageUrl(p.imageUrl);
      setGalleryImages(p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []));
      setVideoUrl(p.videoUrl || '');
      setHighlights(p.highlights && p.highlights.length > 0 ? p.highlights : ['']);

      // Auto-generate 5 to 15 relevant AI search keywords
      const aiKws = generateAiKeywords(p.title, p.brand, p.category, p.merchant);
      setKeywords(aiKws);

      // Move directly to the Review Product screen!
      setStep('review');
    } catch (err: any) {
      setImportError("We couldn't automatically retrieve this product. Please enter the product information manually.");
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  };

  // Skip URL extraction and open empty review screen for manual creation
  const handleManualEntry = () => {
    setStep('review');
    setTitle('');
    setDescription('');
    setProductUrl(inputUrl || '');
    setAffiliateUrl(inputUrl || '');
    setPrice('');
    setMrp('');
    setImageUrl('');
    setGalleryImages([]);
    setKeywords([]);
  };

  // Add / remove keyword tags
  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  // Save product as Draft or Published
  const handleFinalSubmit = (finalStatus: ProductStatus) => {
    if (!hasChannel) {
      setImportError('Please create a channel first.');
      return;
    }
    if (!title.trim()) {
      setImportError('Product title is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setImportError('Please enter a valid price.');
      return;
    }

    const selectedChannel = userChannels.find((c) => c.id === channelId) || userChannels[0];
    const finalMrp = parseFloat(mrp) || parsedPrice;
    const finalDiscount = finalMrp > parsedPrice ? Math.round(((finalMrp - parsedPrice) / finalMrp) * 100) : 0;
    const now = new Date().toISOString();

    const productPayload: MarketProduct = {
      id: editingProduct ? editingProduct.id : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channelId: selectedChannel.id,
      channelUsername: selectedChannel.username,
      channelName: selectedChannel.name,
      channelLogo: selectedChannel.logo,
      sellerId: currentUser.id,
      sellerName: selectedChannel.name || currentUser.name,
      ownerId: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || galleryImages[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      images: galleryImages.length > 0 ? galleryImages : (imageUrl ? [imageUrl] : []),
      videoUrl: videoUrl.trim() || undefined,
      productLink: productUrl.trim() || 'https://dealsphere.store',
      affiliateUrl: affiliateUrl.trim() || undefined,
      price: parsedPrice,
      originalPrice: finalMrp,
      mrp: finalMrp,
      discount: finalDiscount,
      currency: currency || defaultCurrency,
      category,
      merchant,
      brand: brand.trim() || undefined,
      productType,
      status: finalStatus,
      keywords: keywords.length > 0 ? keywords : undefined,
      tags: keywords,
      highlights: highlights.filter((h) => h.trim().length > 0),
      variants: variants.length > 0 ? variants : undefined,
      couponCode: couponCode.trim() || undefined,
      inStock,
      freeDelivery,
      rating: editingProduct?.rating || 4.8,
      reviewCount: editingProduct?.reviewCount || 1,
      views: editingProduct?.views || 0,
      clicks: editingProduct?.clicks || 0,
      isImported: true,
      lastCheckedAt: now,
      createdAt: editingProduct ? editingProduct.createdAt : now,
      updatedAt: now,
    };

    if (editingProduct && onUpdateProduct) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }
    onClose();
  };

  // Bulk Import Processing (Pro & Ultimate)
  const handleBulkImport = async () => {
    const rawLines = bulkUrlsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      setImportError('Please enter at least one product URL.');
      return;
    }

    if (!limits.bulkImport) {
      setImportError('Bulk Product Import is available on Pro and Ultimate plans. Please upgrade to import multiple products at once.');
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgress({ current: 0, total: rawLines.length });
    setImportError(null);

    let successCount = 0;
    let failedCount = 0;

    const selectedChannel = userChannels.find((c) => c.id === channelId) || userChannels[0];

    for (let i = 0; i < rawLines.length; i++) {
      const url = rawLines[i];
      setBulkProgress({ current: i + 1, total: rawLines.length });

      try {
        const res = await autoFetchProductFromUrl(url);
        if (res.success && res.product) {
          const p = res.product;
          const numP = p.price || 999;
          const numM = p.originalPrice || p.mrp || numP;
          const disc = numM > numP ? Math.round(((numM - numP) / numM) * 100) : 0;
          const aiKws = generateAiKeywords(p.title, p.brand, p.category, p.merchant);

          const draftProduct: MarketProduct = {
            id: `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            channelId: selectedChannel.id,
            channelUsername: selectedChannel.username,
            channelName: selectedChannel.name,
            channelLogo: selectedChannel.logo,
            sellerId: currentUser.id,
            sellerName: selectedChannel.name || currentUser.name,
            ownerId: currentUser.id,
            title: p.title,
            description: p.description,
            imageUrl: p.imageUrl,
            images: p.images || [p.imageUrl],
            productLink: p.productLink || url,
            affiliateUrl: p.productLink || url,
            price: numP,
            originalPrice: numM,
            mrp: numM,
            discount: disc,
            currency: p.currency || defaultCurrency,
            category: p.category || CATEGORIES[0],
            merchant: p.merchant || 'Amazon',
            brand: p.brand || undefined,
            productType: 'Affiliate',
            status: 'draft', // IMPORTANT: Rule #12 - Do not automatically publish all imported products; create drafts!
            keywords: aiKws,
            tags: aiKws,
            highlights: p.highlights || [],
            inStock: true,
            freeDelivery: true,
            rating: 4.8,
            reviewCount: 1,
            views: 0,
            clicks: 0,
            isImported: true,
            lastCheckedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };

          onAddProduct(draftProduct);
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    setIsBulkProcessing(false);
    setBulkResults({ success: successCount, failed: failedCount });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 text-left">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Product' : step === 'review' ? 'Review Product Before Publishing' : 'Add Product'}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Channel: <strong className="text-slate-800">@{userChannels[0]?.username || 'None'}</strong></span>
                <span>•</span>
                <span className="font-semibold text-indigo-600">{limits.name} ({totalUserProductsCount}/{limits.maxProducts} listings)</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* No Channel Blocker */}
        {!hasChannel ? (
          <div className="p-8 text-center space-y-4 max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Store className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-slate-900">Create your channel first</h4>
            <p className="text-xs text-slate-500">
              Every seller needs a channel before adding products and deals to Deal Sphere.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenCreateChannel();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create My Channel</span>
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
            
            {/* Limit Warning */}
            {isProductLimitReached && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px]">
                  <strong>Listing quota reached:</strong> The {limits.name} allows up to {limits.maxProducts} active listings. Upgrade to Pro or Ultimate in Settings for unlimited uploads!
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* STEP 1: INPUT SCREEN (METHOD A vs BULK) */}
            {step === 'input' ? (
              <div className="space-y-6">
                
                {/* Tabs: Single vs Bulk */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveMode('single')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      activeMode === 'single'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Method A — Import From Product URL
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMode('bulk')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      activeMode === 'bulk'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Bulk URL Import</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
                      PRO
                    </span>
                  </button>
                </div>

                {activeMode === 'single' ? (
                  /* SINGLE URL IMPORT */
                  <div className="space-y-5">
                    <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>Paste Product Web Link</span>
                        </label>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Amazon, Flipkart, Meesho, Myntra, Ajio, Brand Stores
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://www.amazon.in/dp/... or https://www.flipkart.com/... or https://www.meesho.com/..."
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none text-xs text-slate-900"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportProduct(inputUrl)}
                          disabled={isImporting || !inputUrl.trim()}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all disabled:opacity-50 shrink-0"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Import Product</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick 1-Click Samples for Easy Testing */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 pt-1">
                        <span className="font-semibold text-slate-600">Quick Test:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://www.meesho.com/women-printed-rayon-straight-kurta-set/p/3b123';
                            setInputUrl(u);
                            handleImportProduct(u);
                          }}
                          className="px-2 py-0.5 rounded-full bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 font-medium"
                        >
                          🛍️ Meesho
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4';
                            setInputUrl(u);
                            handleImportProduct(u);
                          }}
                          className="px-2 py-0.5 rounded-full bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-medium"
                        >
                          🛒 Flipkart
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH';
                            setInputUrl(u);
                            handleImportProduct(u);
                          }}
                          className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 font-medium"
                        >
                          📦 Amazon
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const u = 'https://www.myntra.com/tshirts/roadster/roadster-men-pure-cotton-tshirt/1234567/buy';
                            setInputUrl(u);
                            handleImportProduct(u);
                          }}
                          className="px-2 py-0.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-medium"
                        >
                          👗 Myntra
                        </button>
                      </div>

                      {isImporting && (
                        <div className="flex items-center gap-2 py-2 px-3 bg-white/90 rounded-xl border border-indigo-200 text-indigo-900 animate-pulse text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>{importStatus || 'Analyzing product info...'}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <span className="relative bg-white px-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                        Or enter details manually
                      </span>
                    </div>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleManualEntry}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold rounded-2xl transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Method B — Enter Product Information Manually</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* BULK URL IMPORT (Rule #12) */
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1 text-slate-700">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Bulk Product Import Engine</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Enter multiple product links below (one per line). AI will analyze each product and create <strong>un-published drafts</strong> for you to review before publishing.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Product URLs (one per line):</label>
                      <textarea
                        value={bulkUrlsText}
                        onChange={(e) => setBulkUrlsText(e.target.value)}
                        rows={6}
                        placeholder={`https://www.amazon.in/dp/B0CX23V2ZH\nhttps://www.flipkart.com/apple-iphone-15/p/itm6ac6485515ae4\nhttps://www.meesho.com/women-printed-rayon-kurta/p/3b123`}
                        className="w-full p-3 font-mono text-xs border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none"
                      />
                    </div>

                    {isBulkProcessing && bulkProgress && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Processing URL {bulkProgress.current} of {bulkProgress.total}...</span>
                          <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {bulkResults && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                        🎉 Successfully imported <strong>{bulkResults.success}</strong> product drafts into your channel! {bulkResults.failed > 0 && `(${bulkResults.failed} links failed or blocked)`}. You can review and publish them in your Creator Studio.
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleBulkImport}
                        disabled={isBulkProcessing || !bulkUrlsText.trim()}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
                      >
                        {isBulkProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListPlus className="w-4 h-4" />}
                        <span>Process & Create Drafts</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* STEP 2: REVIEW PRODUCT SCREEN (MANDATORY BEFORE PUBLISHING) */
              <div className="space-y-6">
                
                {/* Review Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Review Product Information</h4>
                      <p className="text-[11px] text-emerald-800">
                        Check and edit the extracted details, keywords, and prices before saving draft or publishing.
                      </p>
                    </div>
                  </div>
                  {!editingProduct && (
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="text-[11px] text-indigo-700 hover:underline font-semibold shrink-0"
                    >
                      ← Re-enter URL
                    </button>
                  )}
                </div>

                {/* Product Type (Affiliate / My Product / Deal / Digital) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Product Type & Monetization</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRODUCT_TYPES.map((pt) => {
                      const isSelected = productType === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setProductType(pt.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 ring-1 ring-indigo-500 text-indigo-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs">{pt.label}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{pt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Clear, descriptive product title"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs font-semibold text-slate-900"
                    maxLength={160}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Features, specifications, and details found on the product page..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs leading-relaxed"
                  />
                </div>

                {/* Price, MRP, Discount, Currency */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Current Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="999"
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">List Price / MRP</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        value={mrp}
                        onChange={(e) => setMrp(e.target.value)}
                        placeholder="1999"
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Discount</label>
                    <div className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl font-extrabold text-emerald-600 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      <span>{discountPercent > 0 ? `${discountPercent}% OFF` : 'No Discount'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-semibold text-slate-800"
                    >
                      <option value="₹">₹ (INR)</option>
                      <option value="$">$ (USD)</option>
                      <option value="€">€ (EUR)</option>
                      <option value="£">£ (GBP)</option>
                    </select>
                  </div>
                </div>

                {/* URLs: Product Destination URL and Affiliate URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Public Product URL</span>
                      <span className="text-[10px] text-slate-400">Canonical link</span>
                    </label>
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Affiliate Destination URL</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Tracked link</span>
                    </label>
                    <input
                      type="url"
                      value={affiliateUrl}
                      onChange={(e) => setAffiliateUrl(e.target.value)}
                      placeholder="https://amzn.to/... or with your affiliate tag"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs bg-emerald-50/20"
                    />
                  </div>
                </div>

                {/* AI SEARCH KEYWORDS (5-15 Relevant Keywords, Editable) */}
                <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span>AI Search Keywords ({keywords.length}/15)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const regenerated = generateAiKeywords(title, brand, category, merchant);
                        setKeywords(regenerated);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Regenerate Keywords</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Keywords help buyers discover this product through search intent, brand, and category. Click × to remove or add your own.
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-full shadow-2xs"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      placeholder="Add custom keyword..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Category, Merchant, Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Merchant / Store</label>
                    <select
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                    >
                      {MERCHANTS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Sony, Apple, Nike"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Primary Image & Gallery */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Product Images & Gallery ({galleryImages.length})</span>
                    <span className="text-[10px] text-slate-400">First image is primary thumbnail</span>
                  </label>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {galleryImages.map((img, i) => (
                      <div
                        key={i}
                        className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 bg-white group ${
                          imageUrl === img ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                        }`}
                      >
                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = galleryImages.filter((_, idx) => idx !== i);
                            setGalleryImages(filtered);
                            if (imageUrl === img && filtered.length > 0) {
                              setImageUrl(filtered[0]);
                            }
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {imageUrl === img && (
                          <div className="absolute bottom-0 inset-x-0 bg-indigo-600 text-[9px] text-white font-bold text-center py-0.5">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newImageInput}
                      onChange={(e) => setNewImageInput(e.target.value)}
                      placeholder="Add image URL to gallery..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageInput.trim()) {
                          setGalleryImages([...galleryImages, newImageInput.trim()]);
                          if (!imageUrl) setImageUrl(newImageInput.trim());
                          setNewImageInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                    >
                      Add Photo
                    </button>
                  </div>
                </div>

                {/* Attached Video URL (Optional) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Attached Video / Demonstration URL (Optional)</span>
                    <span className="text-[10px] text-slate-400">YouTube or MP4</span>
                  </label>
                  <div className="relative">
                    <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Footer Actions: Save Draft / Publish / Cancel */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {step === 'review' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFinalSubmit('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300/80 rounded-xl transition-colors"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleFinalSubmit('published')}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingProduct ? 'Save & Update' : 'Publish Product'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
