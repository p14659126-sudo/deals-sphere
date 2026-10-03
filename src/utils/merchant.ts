import { MarketProduct } from '../types';

export type StoreGroup = 
  | 'Amazon'
  | 'Flipkart'
  | 'Meesho'
  | 'Myntra'
  | 'Ajio'
  | 'Nykaa'
  | 'Tata CLiQ'
  | 'Croma'
  | 'Reliance Digital'
  | 'eBay'
  | 'Walmart'
  | 'AliExpress'
  | 'Nike'
  | 'Apple'
  | 'Other';

export interface StoreGroupConfig {
  name: StoreGroup;
  displayName: string;
  badgeLabel: string;
  badgeClass: string;
  pillClass: string;
  accentColor: string;
  icon: string; // emoji or identifier
}

export const STORE_GROUPS: Record<StoreGroup, StoreGroupConfig> = {
  Amazon: {
    name: 'Amazon',
    displayName: 'Amazon',
    badgeLabel: 'from: Amazon',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300/80',
    pillClass: 'hover:border-amber-400 data-[active=true]:bg-amber-500 data-[active=true]:text-white',
    accentColor: '#f59e0b',
    icon: '📦',
  },
  Flipkart: {
    name: 'Flipkart',
    displayName: 'Flipkart',
    badgeLabel: 'from: Flipkart',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300/80',
    pillClass: 'hover:border-blue-400 data-[active=true]:bg-blue-600 data-[active=true]:text-white',
    accentColor: '#2563eb',
    icon: '🛒',
  },
  Meesho: {
    name: 'Meesho',
    displayName: 'Meesho',
    badgeLabel: 'from: Meesho',
    badgeClass: 'bg-pink-50 text-pink-900 border-pink-300/80',
    pillClass: 'hover:border-pink-400 data-[active=true]:bg-pink-600 data-[active=true]:text-white',
    accentColor: '#db2777',
    icon: '🛍️',
  },
  Myntra: {
    name: 'Myntra',
    displayName: 'Myntra',
    badgeLabel: 'from: Myntra',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-300/80',
    pillClass: 'hover:border-rose-400 data-[active=true]:bg-rose-600 data-[active=true]:text-white',
    accentColor: '#e11d48',
    icon: '👗',
  },
  Ajio: {
    name: 'Ajio',
    displayName: 'Ajio',
    badgeLabel: 'from: Ajio',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-300/80',
    pillClass: 'hover:border-indigo-400 data-[active=true]:bg-indigo-600 data-[active=true]:text-white',
    accentColor: '#4f46e5',
    icon: '✨',
  },
  Nykaa: {
    name: 'Nykaa',
    displayName: 'Nykaa',
    badgeLabel: 'from: Nykaa',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300/80',
    pillClass: 'hover:border-fuchsia-400 data-[active=true]:bg-fuchsia-600 data-[active=true]:text-white',
    accentColor: '#c026d3',
    icon: '💄',
  },
  'Tata CLiQ': {
    name: 'Tata CLiQ',
    displayName: 'Tata CLiQ',
    badgeLabel: 'from: Tata CLiQ',
    badgeClass: 'bg-red-50 text-red-900 border-red-300/80',
    pillClass: 'hover:border-red-400 data-[active=true]:bg-red-600 data-[active=true]:text-white',
    accentColor: '#dc2626',
    icon: '🏷️',
  },
  Croma: {
    name: 'Croma',
    displayName: 'Croma',
    badgeLabel: 'from: Croma',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-300/80',
    pillClass: 'hover:border-teal-400 data-[active=true]:bg-teal-600 data-[active=true]:text-white',
    accentColor: '#0d9488',
    icon: '⚡',
  },
  'Reliance Digital': {
    name: 'Reliance Digital',
    displayName: 'Reliance Digital',
    badgeLabel: 'from: Reliance Digital',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-300/80',
    pillClass: 'hover:border-sky-400 data-[active=true]:bg-sky-600 data-[active=true]:text-white',
    accentColor: '#0284c7',
    icon: '📱',
  },
  eBay: {
    name: 'eBay',
    displayName: 'eBay',
    badgeLabel: 'from: eBay',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300/80',
    pillClass: 'hover:border-emerald-400 data-[active=true]:bg-emerald-600 data-[active=true]:text-white',
    accentColor: '#059669',
    icon: '🌐',
  },
  Walmart: {
    name: 'Walmart',
    displayName: 'Walmart',
    badgeLabel: 'from: Walmart',
    badgeClass: 'bg-cyan-50 text-cyan-900 border-cyan-300/80',
    pillClass: 'hover:border-cyan-400 data-[active=true]:bg-cyan-600 data-[active=true]:text-white',
    accentColor: '#0891b2',
    icon: '🏬',
  },
  AliExpress: {
    name: 'AliExpress',
    displayName: 'AliExpress',
    badgeLabel: 'from: AliExpress',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-300/80',
    pillClass: 'hover:border-orange-400 data-[active=true]:bg-orange-600 data-[active=true]:text-white',
    accentColor: '#ea580c',
    icon: '✈️',
  },
  Nike: {
    name: 'Nike',
    displayName: 'Nike',
    badgeLabel: 'from: Nike',
    badgeClass: 'bg-slate-900 text-white border-slate-700',
    pillClass: 'hover:border-slate-800 data-[active=true]:bg-slate-900 data-[active=true]:text-white',
    accentColor: '#0f172a',
    icon: '👟',
  },
  Apple: {
    name: 'Apple',
    displayName: 'Apple',
    badgeLabel: 'from: Apple',
    badgeClass: 'bg-slate-100 text-slate-900 border-slate-300',
    pillClass: 'hover:border-slate-400 data-[active=true]:bg-slate-800 data-[active=true]:text-white',
    accentColor: '#334155',
    icon: '🍎',
  },
  Other: {
    name: 'Other',
    displayName: 'Other Stores',
    badgeLabel: 'from: Verified Store',
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
    pillClass: 'hover:border-slate-300 data-[active=true]:bg-slate-800 data-[active=true]:text-white',
    accentColor: '#64748b',
    icon: '🏪',
  },
};

/**
 * Classifies any product into its normalized store/merchant group
 * based on merchant name or target link domain.
 */
export function identifyStoreGroup(merchantOrUrl?: string): StoreGroup {
  if (!merchantOrUrl) return 'Other';
  const raw = merchantOrUrl.toLowerCase().trim();
  let hostname = '';
  try {
    const u = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
    hostname = u.hostname.replace(/^www\./, '');
  } catch {
    hostname = raw;
  }

  // Exact checks
  if (raw === 'amazon' || hostname.includes('amazon.') || hostname.startsWith('amzn.') || hostname === 'a.co' || raw.includes('amzn.to') || raw.includes('a.co/')) return 'Amazon';
  if (raw === 'flipkart' || hostname.includes('flipkart.') || hostname.includes('fkrt.') || hostname.includes('shopsy.')) return 'Flipkart';
  if (raw === 'meesho' || hostname.includes('meesho.') || hostname.includes('meesho.onelink')) return 'Meesho';
  if (raw === 'myntra' || hostname.includes('myntra.') || hostname.includes('myntr.')) return 'Myntra';
  if (raw === 'ajio' || hostname.includes('ajio.')) return 'Ajio';
  if (raw === 'nykaa' || hostname.includes('nykaa.')) return 'Nykaa';
  if (raw === 'tata cliq' || raw === 'tatacliq' || hostname.includes('tatacliq.')) return 'Tata CLiQ';
  if (raw === 'croma' || hostname.includes('croma.')) return 'Croma';
  if (raw === 'reliance digital' || hostname.includes('reliancedigital.')) return 'Reliance Digital';
  if (raw === 'ebay' || hostname.includes('ebay.')) return 'eBay';
  if (raw === 'walmart' || hostname.includes('walmart.')) return 'Walmart';
  if (raw === 'aliexpress' || hostname.includes('aliexpress.')) return 'AliExpress';
  if (raw === 'nike' || hostname.includes('nike.')) return 'Nike';
  if (raw === 'apple' || hostname.includes('apple.')) return 'Apple';

  return 'Other';
}

export function getProductStoreGroup(product: MarketProduct): StoreGroup {
  if (product.merchant) {
    const fromMerchant = identifyStoreGroup(product.merchant);
    if (fromMerchant !== 'Other') return fromMerchant;
  }
  return identifyStoreGroup(product.productLink || product.productUrl);
}

export function getStoreGroupConfig(group: StoreGroup): StoreGroupConfig {
  return STORE_GROUPS[group] || STORE_GROUPS.Other;
}
