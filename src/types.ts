export type AccountType = 'normal' | 'business' | 'admin';
export type SubscriptionPlan = 'free' | 'pro' | 'ultimate';

export const PLAN_LIMITS = {
  free: {
    name: 'Free Starter',
    maxProducts: 10,
    maxVideos: 3,
    bulkImport: false,
    advancedAi: false,
    analyticsLevel: 'Basic',
  },
  pro: {
    name: 'Pro Creator',
    maxProducts: 500,
    maxVideos: 50,
    bulkImport: true,
    advancedAi: true,
    analyticsLevel: 'Advanced',
  },
  ultimate: {
    name: 'Ultimate Merchant',
    maxProducts: 999999,
    maxVideos: 999999,
    bulkImport: true,
    advancedAi: true,
    analyticsLevel: 'Full Enterprise',
  },
} as const;

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  subscriptionPlan?: SubscriptionPlan;
  avatar?: string;
  businessName?: string;
  businessBio?: string;
  joinedDate: string;
  isAdmin?: boolean;
}

export type ChannelType = 'Personal' | 'Creator' | 'Store' | 'Brand' | 'Affiliate/Deals' | 'Other';
export type ChannelStatus = 'active' | 'suspended';

export interface Channel {
  id: string;
  ownerId: string;
  name: string;
  username: string; // e.g. "dealhunterindia" (without @, displayed as @dealhunterindia)
  handle?: string; // alias
  description: string;
  bio?: string; // alias
  logo: string;
  avatarUrl?: string; // alias
  banner?: string;
  bannerUrl?: string; // alias
  tagline?: string;
  category: string;
  channelType: ChannelType;
  country: string;
  language: string;
  contactEmail: string;
  websiteUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
    website?: string;
  };
  businessName?: string;
  gstInfo?: string;
  sellerContact?: string;
  status: ChannelStatus;
  followersCount: number;
  followerCount?: number; // alias
  views: number;
  totalViews?: number; // alias
  totalClicks?: number; // alias
  verified?: boolean; // alias
  createdAt: string;
  updatedAt?: string;
}

export type CreatorChannel = Channel;

export type ProductType = 'Physical' | 'Digital' | 'Affiliate' | 'Deal/Offer' | 'Other';
export type ProductStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';

export interface MarketProduct {
  id: string;
  channelId?: string;
  channelUsername?: string;
  channelName?: string;
  channelLogo?: string;
  ownerId?: string;
  sellerId: string;
  sellerName: string;
  title: string;
  name?: string; // alias
  description: string;
  imageUrl: string;
  images?: string[];
  videoUrl?: string;
  productLink: string;
  productUrl?: string; // alias
  affiliateUrl?: string;
  affiliateNetwork?: string;
  commissionNote?: string; // private seller note
  price: number;
  originalPrice: number;
  mrp?: number;
  discount?: number;
  currency: string;
  category: string;
  merchant?: string; // e.g., Amazon, Flipkart, Meesho, Direct
  merchantGroup?: string; // e.g. Amazon, Flipkart, Meesho, Myntra
  storeGroup?: string; // alias for store grouping
  productType?: ProductType;
  status?: ProductStatus;
  brand?: string;
  sku?: string;
  tags?: string[];
  highlights?: string[];
  color?: string;
  size?: string;
  variants?: string[];
  shippingInfo?: string;
  deliveryInfo?: string;
  couponCode?: string;
  couponExpiry?: string;
  rating: number;
  reviewCount: number;
  views?: number;
  clicks?: number;
  viewsCount?: number;
  clicksCount?: number;
  videoTitle?: string;
  keywords?: string[];
  isImported?: boolean;
  lastCheckedAt?: string;
  inStock: boolean;
  freeDelivery: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type VideoVisibility = 'public' | 'unlisted' | 'private' | 'draft';

export interface ChannelVideo {
  id: string;
  channelId: string;
  channelUsername: string;
  channelName: string;
  channelLogo?: string;
  ownerId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  keywords: string[];
  attachedProductIds: string[];
  affiliateLink?: string;
  visibility: VideoVisibility;
  views: number;
  likes: number;
  duration?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: MarketProduct;
  quantity: number;
  addedAt: string;
}

export interface OrderRecord {
  id: string;
  product: MarketProduct;
  clickedAt: string;
  status: 'Confirmed Purchase' | 'Completed' | 'Redirected to Seller Link';
  targetLink: string;
}

export interface AppSettings {
  currency: string;
  affiliateTag: string;
  appendTrackingTag: boolean;
  viewMode: 'grid' | 'list';
  verifyPurchasePrompt: boolean;
  rewardedAdOnSave?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sellerId?: string;
  channelId: string;
  productId?: string;
  eventType: 'channel_view' | 'product_view' | 'product_click' | 'buy_click' | 'share' | 'follow';
  timestamp: string;
  isMember?: boolean;
}

export type ProductClickEvent = AnalyticsEvent;

export interface ChannelFollower {
  id: string; // `${userId}_${channelId}`
  userId: string;
  channelId: string;
  createdAt: string;
}

export type ReportReason = 'Spam' | 'Misleading information' | 'Copyright/IP concern' | 'Fraud / Scam' | 'Other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportRecord {
  id: string;
  reporterId?: string;
  reporterEmail?: string;
  targetType: 'product' | 'channel';
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
}
