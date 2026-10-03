import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { 
  Channel, 
  MarketProduct, 
  AnalyticsEvent, 
  ChannelFollower, 
  ReportRecord, 
  ReportReason,
  ProductStatus,
  ChannelStatus 
} from '../types';

const CHANNELS_KEY = 'ds_channels_cache';
const PRODUCTS_KEY = 'affiliate_products';
const FOLLOWERS_KEY = 'ds_followers_cache';
const ANALYTICS_KEY = 'ds_analytics_cache';
const REPORTS_KEY = 'ds_reports_cache';

// Helper to get local cache
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error setting localStorage for ${key}:`, e);
  }
}

// Generate unique clean channel ID like channel_8F92KX
export function generateChannelId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `channel_${rand}`;
}

// Username validator
export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'dealsphere', 'official', 'api', 
  'support', 'help', 'system', 'auth', 'settings', 'cart', 'orders', 
  'channel', 'channels', 'products', 'deals', 'terms', 'privacy'
];

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const clean = username.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, error: 'Username is required.' };
  }
  if (clean.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters.' };
  }
  if (clean.length > 30) {
    return { isValid: false, error: 'Username must be at most 30 characters.' };
  }
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    return { isValid: false, error: 'Username can only contain lowercase letters, numbers, underscores (_), and hyphens (-).' };
  }
  if (RESERVED_USERNAMES.includes(clean)) {
    return { isValid: false, error: 'This username is reserved and cannot be used.' };
  }
  return { isValid: true };
}

// Check if username is already taken
export async function isUsernameTaken(username: string, excludeChannelId?: string): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  
  // First check local cache
  const localChannels = getLocal<Channel[]>(CHANNELS_KEY, []);
  const localMatch = localChannels.find(
    (c) => c.username.toLowerCase() === clean && c.id !== excludeChannelId
  );
  if (localMatch) return true;

  // Then check Firestore
  try {
    const q = query(collection(db, 'channels'), where('username', '==', clean));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      let isTaken = false;
      snapshot.forEach((d) => {
        if (d.id !== excludeChannelId) isTaken = true;
      });
      return isTaken;
    }
  } catch (err) {
    // If offline, rely on local cache
  }
  return false;
}

// Check if user already owns a channel
export async function getChannelsByOwner(ownerId: string): Promise<Channel[]> {
  const cleanId = (ownerId || '').trim();
  if (!cleanId) return [];

  // Check local cache first
  const localChannels = getLocal<Channel[]>(CHANNELS_KEY, []);
  const localOwned = localChannels.filter((c) => c.ownerId === cleanId);

  try {
    const q = query(collection(db, 'channels'), where('ownerId', '==', cleanId));
    const snapshot = await getDocs(q);
    const firestoreChannels: Channel[] = [];
    snapshot.forEach((d) => {
      firestoreChannels.push(d.data() as Channel);
    });

    const channelMap = new Map<string, Channel>();
    firestoreChannels.forEach((c) => channelMap.set(c.id, c));
    localOwned.forEach((c) => channelMap.set(c.id, c));
    return Array.from(channelMap.values());
  } catch (err) {
    return localOwned;
  }
}

export async function hasChannelForUser(userId: string): Promise<boolean> {
  const userChannels = await getChannelsByOwner(userId);
  return userChannels.length > 0;
}

// Create Channel (Enforces strict policy: only one channel per account)
export async function createChannel(channelData: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'followersCount'> & { id?: string }): Promise<Channel> {
  const ownerId = (channelData.ownerId || '').trim();
  if (!ownerId) {
    throw new Error('Channel owner ID is required.');
  }

  // Enforce one channel per account policy: if already exists, return the existing channel
  const existingOwnedChannels = await getChannelsByOwner(ownerId);
  if (existingOwnedChannels.length > 0) {
    const existing = existingOwnedChannels[0];
    const local = getLocal<Channel[]>(CHANNELS_KEY, []);
    setLocal(CHANNELS_KEY, [existing, ...local.filter((c) => c.id !== existing.id)]);
    return existing;
  }

  const channelId = channelData.id || generateChannelId();
  const now = new Date().toISOString();
  
  const newChannel: Channel = {
    ...channelData,
    id: channelId,
    username: channelData.username.toLowerCase().trim(),
    views: 0,
    followersCount: 0,
    status: channelData.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  // Cache locally
  const local = getLocal<Channel[]>(CHANNELS_KEY, []);
  setLocal(CHANNELS_KEY, [newChannel, ...local.filter((c) => c.id !== channelId)]);

  // Save to Firestore
  try {
    await setDoc(doc(db, 'channels', channelId), newChannel);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `channels/${channelId}`);
  }

  return newChannel;
}

// Update Channel
export async function updateChannel(channelId: string, updates: Partial<Channel>): Promise<void> {
  const now = new Date().toISOString();
  const merged = { ...updates, updatedAt: now };

  // Update local cache
  const local = getLocal<Channel[]>(CHANNELS_KEY, []);
  const updatedList = local.map((c) => (c.id === channelId ? { ...c, ...merged } : c));
  setLocal(CHANNELS_KEY, updatedList);

  // Update in Firestore
  try {
    await updateDoc(doc(db, 'channels', channelId), merged);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `channels/${channelId}`);
  }
}

// Delete Channel
export async function deleteChannel(channelId: string): Promise<void> {
  // Update local cache
  const local = getLocal<Channel[]>(CHANNELS_KEY, []);
  setLocal(CHANNELS_KEY, local.filter((c) => c.id !== channelId));

  // Delete in Firestore
  try {
    await deleteDoc(doc(db, 'channels', channelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `channels/${channelId}`);
  }
}

// Record Channel View
export async function recordChannelView(channelId: string, userId?: string): Promise<void> {
  // Local cache update
  const local = getLocal<Channel[]>(CHANNELS_KEY, []);
  setLocal(
    CHANNELS_KEY,
    local.map((c) => (c.id === channelId ? { ...c, views: (c.views || 0) + 1 } : c))
  );

  // Fire analytics event
  await logAnalyticsEvent({
    channelId,
    userId,
    eventType: 'channel_view',
  });

  // Increment in Firestore
  try {
    await updateDoc(doc(db, 'channels', channelId), {
      views: increment(1),
    });
  } catch (err) {
    //
  }
}

// Follow / Unfollow System
export async function followChannel(userId: string, channelId: string): Promise<void> {
  const followId = `${userId}_${channelId}`;
  const now = new Date().toISOString();
  const followRecord: ChannelFollower = {
    id: followId,
    userId,
    channelId,
    createdAt: now,
  };

  // Update local followers
  const followers = getLocal<ChannelFollower[]>(FOLLOWERS_KEY, []);
  if (!followers.some((f) => f.id === followId)) {
    setLocal(FOLLOWERS_KEY, [...followers, followRecord]);
    
    // Update local channel count
    const channels = getLocal<Channel[]>(CHANNELS_KEY, []);
    setLocal(
      CHANNELS_KEY,
      channels.map((c) => (c.id === channelId ? { ...c, followersCount: (c.followersCount || 0) + 1 } : c))
    );
  }

  // Firestore update
  try {
    await setDoc(doc(db, 'followers', followId), followRecord);
    await updateDoc(doc(db, 'channels', channelId), {
      followersCount: increment(1),
    });
  } catch (err) {}

  await logAnalyticsEvent({
    channelId,
    userId,
    eventType: 'follow',
  });
}

export async function unfollowChannel(userId: string, channelId: string): Promise<void> {
  const followId = `${userId}_${channelId}`;

  // Update local followers
  const followers = getLocal<ChannelFollower[]>(FOLLOWERS_KEY, []);
  setLocal(FOLLOWERS_KEY, followers.filter((f) => f.id !== followId));

  // Update local channel count
  const channels = getLocal<Channel[]>(CHANNELS_KEY, []);
  setLocal(
    CHANNELS_KEY,
    channels.map((c) => (c.id === channelId ? { ...c, followersCount: Math.max(0, (c.followersCount || 1) - 1) } : c))
  );

  // Firestore update
  try {
    await deleteDoc(doc(db, 'followers', followId));
    await updateDoc(doc(db, 'channels', channelId), {
      followersCount: increment(-1),
    });
  } catch (err) {}
}

export async function isFollowing(userId: string, channelId: string): Promise<boolean> {
  const followId = `${userId}_${channelId}`;
  const followers = getLocal<ChannelFollower[]>(FOLLOWERS_KEY, []);
  return followers.some((f) => f.id === followId);
}

// Product view & click tracking
export async function recordProductView(product: MarketProduct, userId?: string): Promise<void> {
  const products = getLocal<MarketProduct[]>(PRODUCTS_KEY, []);
  setLocal(
    PRODUCTS_KEY,
    products.map((p) => (p.id === product.id ? { ...p, views: (p.views || 0) + 1 } : p))
  );

  if (product.channelId) {
    await logAnalyticsEvent({
      channelId: product.channelId,
      productId: product.id,
      userId,
      eventType: 'product_view',
    });
  }

  try {
    await updateDoc(doc(db, 'products', product.id), {
      views: increment(1),
    });
  } catch (err) {}
}

export async function recordProductClick(product: MarketProduct, userId?: string, isBuyClick: boolean = false): Promise<void> {
  const products = getLocal<MarketProduct[]>(PRODUCTS_KEY, []);
  setLocal(
    PRODUCTS_KEY,
    products.map((p) => (p.id === product.id ? { ...p, clicks: (p.clicks || 0) + 1 } : p))
  );

  if (product.channelId) {
    await logAnalyticsEvent({
      channelId: product.channelId,
      productId: product.id,
      userId,
      eventType: isBuyClick ? 'buy_click' : 'product_click',
    });
  }

  try {
    await updateDoc(doc(db, 'products', product.id), {
      clicks: increment(1),
    });
  } catch (err) {}
}

// Analytics Event Logger
export async function logAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
  const eventId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const fullEvent: AnalyticsEvent = {
    ...event,
    id: eventId,
    timestamp: now,
  };

  const events = getLocal<AnalyticsEvent[]>(ANALYTICS_KEY, []);
  setLocal(ANALYTICS_KEY, [fullEvent, ...events.slice(0, 1000)]); // keep last 1000 locally

  try {
    await setDoc(doc(db, 'analytics', eventId), fullEvent);
  } catch (err) {}
}

// Submit a Violation Report
export async function submitReport(report: Omit<ReportRecord, 'id' | 'status' | 'createdAt'>): Promise<ReportRecord> {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const fullReport: ReportRecord = {
    ...report,
    id: reportId,
    status: 'pending',
    createdAt: now,
  };

  const reports = getLocal<ReportRecord[]>(REPORTS_KEY, []);
  setLocal(REPORTS_KEY, [fullReport, ...reports]);

  try {
    await setDoc(doc(db, 'reports', reportId), fullReport);
  } catch (err) {}

  return fullReport;
}

export async function updateReportStatus(reportId: string, status: ReportRecord['status']): Promise<void> {
  const reports = getLocal<ReportRecord[]>(REPORTS_KEY, []);
  setLocal(REPORTS_KEY, reports.map((r) => (r.id === reportId ? { ...r, status } : r)));

  try {
    await updateDoc(doc(db, 'reports', reportId), { status });
  } catch (err) {}
}
