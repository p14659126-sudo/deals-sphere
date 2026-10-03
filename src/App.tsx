import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  MarketProduct, 
  UserAccount, 
  CartItem, 
  OrderRecord, 
  AccountType, 
  AppSettings, 
  Channel, 
  ReportRecord, 
  ProductStatus,
  ChannelVideo,
  SubscriptionPlan,
  PLAN_LIMITS
} from './types';
import { auth, db, signOutFirebase, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { BottomNav, TabType } from './components/BottomNav';
import { AmazonProductCard } from './components/AmazonProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { UploadProductModal } from './components/UploadProductModal';
import { SettingsView } from './components/SettingsView';
import { CartView } from './components/CartView';
import { OrdersView } from './components/OrdersView';
import { AuthModal } from './components/AuthModal';
import { RedirectingModal } from './components/RedirectingModal';
import { ChannelCreationModal } from './components/ChannelCreationModal';
import { ChannelProfileView } from './components/ChannelProfileView';
import { ChannelDashboardView } from './components/ChannelDashboardView';
import { ChannelDiscoveryView } from './components/ChannelDiscoveryView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ReportModal } from './components/ReportModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { UploadVideoModal } from './components/UploadVideoModal';
import { EditChannelModal } from './components/EditChannelModal';
import { AdBanner, ACTIVE_AD_CODE } from './components/AdBanner';
import { RewardedAdModal, REWARDED_TEST_AD_UNIT_ID } from './components/RewardedAdModal';
import { normalizeProductLink, openExternalLink, attachAffiliateTag, getDomainFromUrl } from './utils/url';
import { sanitizeDisplayName } from './utils/privacy';
import { recordProductView, recordProductClick, createChannel, getChannelsByOwner } from './services/channelService';
import { getProductStoreGroup, getStoreGroupConfig, StoreGroup, STORE_GROUPS } from './utils/merchant';
import { 
  Sparkles, 
  ShoppingBag, 
  ShieldCheck, 
  ExternalLink,
  Search, 
  Filter, 
  LogIn, 
  Store, 
  ArrowUpRight, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Plus,
  Compass,
  Layers,
  Flame
} from 'lucide-react';

const ADMIN_EMAIL = 'p14659126@gmail.com';

const DEFAULT_SETTINGS: AppSettings = {
  currency: '₹',
  affiliateTag: '',
  appendTrackingTag: true,
  viewMode: 'grid',
  verifyPurchasePrompt: true,
  rewardedAdOnSave: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Firebase Auth Current User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('affiliate_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) {
          parsed.name = sanitizeDisplayName(parsed.name);
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const userStored = currentUser ? localStorage.getItem(`user_settings_${currentUser.id}`) : null;
      if (userStored) return { ...DEFAULT_SETTINGS, ...JSON.parse(userStored) };
      const globalStored = localStorage.getItem('app_settings');
      return globalStored ? { ...DEFAULT_SETTINGS, ...JSON.parse(globalStored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Channels State
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const stored = localStorage.getItem('ds_channels_cache');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Active channel selected for viewing profile
  const [activeChannelProfile, setActiveChannelProfile] = useState<Channel | null>(null);

  // Active channel selected for seller dashboard management
  const [dashboardChannel, setDashboardChannel] = useState<Channel | null>(null);

  // Products State
  const [products, setProducts] = useState<MarketProduct[]>(() => {
    try {
      const stored = localStorage.getItem('affiliate_products');
      if (stored) {
        const list: MarketProduct[] = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          // Purge auto-generated mock products
          const userUploadedOnly = list.filter((item) => {
            const isAuto =
              item.id.startsWith('prod-watchmen') ||
              item.id.startsWith('prod-spiderman') ||
              item.id.startsWith('prod-wacom') ||
              item.id.startsWith('prod-sony') ||
              item.id.startsWith('prod-batman') ||
              item.id.startsWith('prod-saga') ||
              (item.sellerId && item.sellerId.startsWith('curator-'));
            return !isAuto;
          });
          return userUploadedOnly;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Reports state (for admin moderation)
  const [reports, setReports] = useState<ReportRecord[]>(() => {
    try {
      const stored = localStorage.getItem('ds_reports_cache');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Current User Ref for synchronous access in pending action callbacks
  const currentUserRef = useRef<UserAccount | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser.accountType === 'admin' ||
      currentUser.isAdmin === true
    );
  }, [currentUser]);

  // User's own channels (strictly 1 channel per account policy)
  const userChannels = useMemo(() => {
    if (!currentUser) return [];
    const owned = channels.filter((c) => c.ownerId === currentUser.id);
    return owned.slice(0, 1);
  }, [channels, currentUser]);

  // Set default dashboard channel when user channels change
  useEffect(() => {
    if (userChannels.length > 0 && !dashboardChannel) {
      setDashboardChannel(userChannels[0]);
    }
  }, [userChannels, dashboardChannel]);

  // Account-scoped Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (!currentUser) return [];
    try {
      const stored = localStorage.getItem(`user_cart_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Account-scoped Orders State
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    if (!currentUser) return [];
    try {
      const stored = localStorage.getItem(`user_orders_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Active Selected Product for PDP View
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStoreGroup, setSelectedStoreGroup] = useState<string>('all');
  const [viewByStoreGroup, setViewByStoreGroup] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Videos State (YouTube-style channel videos)
  const [videos, setVideos] = useState<ChannelVideo[]>(() => {
    try {
      const stored = localStorage.getItem('ds_videos_cache');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Selected video for YouTube-style Video Player Modal
  const [selectedVideo, setSelectedVideo] = useState<ChannelVideo | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

  // Video Upload & Edit Modal
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ChannelVideo | null>(null);

  // Channel Customization Modal
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);

  // Modals State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketProduct | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [redirectingProduct, setRedirectingProduct] = useState<MarketProduct | null>(null);

  const [reportModalConfig, setReportModalConfig] = useState<{
    isOpen: boolean;
    targetType: 'product' | 'channel';
    targetId: string;
    targetTitle: string;
  }>({
    isOpen: false,
    targetType: 'product',
    targetId: '',
    targetTitle: '',
  });

  // Google AdMob Rewarded Ad State (for Save Option)
  const [rewardedAdProduct, setRewardedAdProduct] = useState<MarketProduct | null>(null);
  const [isRewardedAdOpen, setIsRewardedAdOpen] = useState(false);

  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    actionReason: 'save' | 'order' | 'general';
    initialMode: 'signin' | 'signup';
    productTitle?: string;
    pendingAction?: () => void;
  }>({
    isOpen: false,
    actionReason: 'general',
    initialMode: 'signin',
  });

  const openSignIn = useCallback((actionReason: 'save' | 'order' | 'general' = 'general', productTitle?: string, pendingAction?: () => void) => {
    setAuthModalConfig({
      isOpen: true,
      actionReason,
      initialMode: 'signin',
      productTitle,
      pendingAction,
    });
  }, []);

  const openSignUp = useCallback((actionReason: 'save' | 'order' | 'general' = 'general', productTitle?: string, pendingAction?: () => void) => {
    setAuthModalConfig({
      isOpen: true,
      actionReason,
      initialMode: 'signup',
      productTitle,
      pendingAction,
    });
  }, []);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  /**
   * Handle URL Routes like /channel/:username or #/channel/:username
   */
  const handleUrlRouting = useCallback((channelList: Channel[]) => {
    try {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      let targetUsername: string | null = null;

      if (pathname.startsWith('/channel/')) {
        targetUsername = pathname.replace('/channel/', '').split('/')[0]?.trim().toLowerCase().replace(/^@/, '');
      } else if (hash.startsWith('#/channel/')) {
        targetUsername = hash.replace('#/channel/', '').split('/')[0]?.trim().toLowerCase().replace(/^@/, '');
      } else if (search.includes('channel=')) {
        const params = new URLSearchParams(search);
        targetUsername = params.get('channel')?.trim().toLowerCase().replace(/^@/, '') || null;
      }

      if (targetUsername) {
        const found = channelList.find((c) => c.username.toLowerCase() === targetUsername);
        if (found) {
          setActiveChannelProfile(found);
          setSelectedProduct(null);
        }
      }
    } catch {}
  }, []);

  // 1. Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setAuthLoading(false);
      if (fbUser) {
        const savedRoleKey = `user_role_${fbUser.uid}`;
        const savedBizKey = `user_biz_${fbUser.uid}`;
        const savedRole = (localStorage.getItem(savedRoleKey) as AccountType) || 'normal';
        const savedBiz = localStorage.getItem(savedBizKey) || '';

        const isUserAdmin = fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        const userAccount: UserAccount = {
          id: fbUser.uid,
          name: sanitizeDisplayName(fbUser.displayName),
          email: fbUser.email || '',
          avatar: fbUser.photoURL || undefined,
          accountType: isUserAdmin ? 'admin' : savedRole,
          businessName: savedBiz,
          businessBio: 'Affiliate product curator and deal marketer',
          joinedDate: 'Sep 2026',
          isAdmin: isUserAdmin,
        };

        setCurrentUser(userAccount);
        currentUserRef.current = userAccount;
        localStorage.setItem('affiliate_current_user', JSON.stringify(userAccount));

        // Restore private account data
        await restoreUserData(fbUser.uid);

        if (authModalConfig.pendingAction) {
          const actionToRun = authModalConfig.pendingAction;
          setAuthModalConfig((prev) => ({ ...prev, isOpen: false, pendingAction: undefined }));
          actionToRun();
        }
      }
    });

    return () => unsubscribe();
  }, [authModalConfig.pendingAction]);

  /**
   * Restores data scoped to a specific user account:
   * orders, cart items, settings
   */
  const restoreUserData = useCallback(async (userId: string) => {
    try {
      const userCartKey = `user_cart_${userId}`;
      const savedCart = localStorage.getItem(userCartKey);
      if (savedCart) setCartItems(JSON.parse(savedCart));

      const userOrdersKey = `user_orders_${userId}`;
      const savedOrders = localStorage.getItem(userOrdersKey);
      let loadedOrders: OrderRecord[] = savedOrders ? JSON.parse(savedOrders) : [];

      try {
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const remoteOrders: OrderRecord[] = [];
          querySnapshot.forEach((docSnap) => {
            remoteOrders.push(docSnap.data() as OrderRecord);
          });
          const orderMap = new Map<string, OrderRecord>();
          remoteOrders.forEach((o) => orderMap.set(o.id, o));
          loadedOrders.forEach((o) => orderMap.set(o.id, o));
          loadedOrders = Array.from(orderMap.values());
        }
      } catch (err) {}

      setOrders(loadedOrders);
      localStorage.setItem(userOrdersKey, JSON.stringify(loadedOrders));

      const userSettingsKey = `user_settings_${userId}`;
      const savedSettings = localStorage.getItem(userSettingsKey);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (e) {
      console.warn('Error restoring user account data:', e);
    }
  }, []);

  /**
   * Direct login callback (e.g. Google / anonymous / instant login)
   */
  const handleDirectLogin = useCallback(async (userAccount: UserAccount) => {
    const safeAccount: UserAccount = {
      ...userAccount,
      name: sanitizeDisplayName(userAccount.name),
    };
    setCurrentUser(safeAccount);
    currentUserRef.current = safeAccount;
    localStorage.setItem('affiliate_current_user', JSON.stringify(safeAccount));
    await restoreUserData(safeAccount.id);
    showToast('Signed in securely. Account data restored!');
    if (authModalConfig.pendingAction) {
      const actionToRun = authModalConfig.pendingAction;
      setAuthModalConfig((prev) => ({ ...prev, isOpen: false, pendingAction: undefined }));
      actionToRun();
    }
  }, [authModalConfig.pendingAction, restoreUserData]);

  // Sync Channels from Firestore in Real-Time
  useEffect(() => {
    try {
      const channelsRef = collection(db, 'channels');
      const unsubscribe = onSnapshot(
        channelsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Channel[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Channel;
              if (data && data.id) list.push(data);
            });
            setChannels(list);
            try {
              localStorage.setItem('ds_channels_cache', JSON.stringify(list));
            } catch {}
            handleUrlRouting(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'channels');
        }
      );
      return () => unsubscribe();
    } catch (err) {}
  }, [handleUrlRouting]);

  // Sync Products from Firestore in Real-Time
  useEffect(() => {
    try {
      const productsRef = collection(db, 'products');
      const unsubscribe = onSnapshot(
        productsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreList: MarketProduct[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MarketProduct;
              if (data && data.id) {
                // Purge auto-generated mock products
                const isAuto =
                  data.id.startsWith('prod-watchmen') ||
                  data.id.startsWith('prod-spiderman') ||
                  data.id.startsWith('prod-wacom') ||
                  data.id.startsWith('prod-sony') ||
                  data.id.startsWith('prod-batman') ||
                  data.id.startsWith('prod-saga') ||
                  (data.sellerId && data.sellerId.startsWith('curator-'));
                if (!isAuto) {
                  firestoreList.push(data);
                }
              }
            });
            setProducts(firestoreList);
            try {
              localStorage.setItem('affiliate_products', JSON.stringify(firestoreList));
            } catch {}
          } else {
            setProducts([]);
            try {
              localStorage.setItem('affiliate_products', JSON.stringify([]));
            } catch {}
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'products');
        }
      );
      return () => unsubscribe();
    } catch (err) {}
  }, []);

  // Sync Reports from Firestore (for Admin)
  useEffect(() => {
    if (isAdmin) {
      try {
        const reportsRef = collection(db, 'reports');
        const unsubscribe = onSnapshot(
          reportsRef,
          (snapshot) => {
            const list: ReportRecord[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as ReportRecord;
              if (data && data.id) list.push(data);
            });
            setReports(list);
            try {
              localStorage.setItem('ds_reports_cache', JSON.stringify(list));
            } catch {}
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'reports');
          }
        );
        return () => unsubscribe();
      } catch (err) {}
    }
  }, [isAdmin]);

  // Handle browser popstate
  useEffect(() => {
    const onPop = () => {
      handleUrlRouting(channels);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [channels, handleUrlRouting]);

  // Sync Videos from Firestore in Real-Time
  useEffect(() => {
    try {
      const videosRef = collection(db, 'videos');
      const unsubscribe = onSnapshot(
        videosRef,
        (snapshot) => {
          const list: ChannelVideo[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as ChannelVideo;
            if (data && data.id) list.push(data);
          });
          setVideos(list);
          try {
            localStorage.setItem('ds_videos_cache', JSON.stringify(list));
          } catch {}
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'videos');
        }
      );
      return () => unsubscribe();
    } catch (err) {}
  }, []);

  // Auto-associate personal channel for logged-in users (Requirement #1: "Every logged-in user should have a personal channel automatically associated with their account.")
  const autoChannelInProgressRef = useRef(false);
  const autoChannelAttemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser || authLoading) return;

    const userOwned = channels.filter((c) => c.ownerId === currentUser.id);
    if (userOwned.length > 0) {
      if (!dashboardChannel) {
        setDashboardChannel(userOwned[0]);
      }
      return;
    }

    // Guard against repeated calls for the same user
    if (autoChannelInProgressRef.current || autoChannelAttemptedForUserRef.current === currentUser.id) {
      return;
    }

    autoChannelInProgressRef.current = true;
    autoChannelAttemptedForUserRef.current = currentUser.id;

    // Check if channel already exists in backend/storage
    getChannelsByOwner(currentUser.id)
      .then((existingList) => {
        if (existingList.length > 0) {
          const existing = existingList[0];
          setChannels((prev) => {
            if (prev.some((c) => c.id === existing.id)) return prev;
            return [existing, ...prev];
          });
          setDashboardChannel(existing);
          autoChannelInProgressRef.current = false;
          return;
        }

        // None exists yet, create one
        const cleanName = currentUser.name || 'Creator';
        const baseUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'creator';
        let uniqueUsername = baseUsername;
        let counter = 1;
        while (channels.some((c) => c.username.toLowerCase() === uniqueUsername.toLowerCase())) {
          uniqueUsername = `${baseUsername}${counter++}`;
        }

        createChannel({
          ownerId: currentUser.id,
          name: `${cleanName}'s Store`,
          username: uniqueUsername,
          description: `Welcome to @${uniqueUsername} on Deal Sphere! Discover hand-picked product deals, verified tech reviews, and direct merchant discounts.`,
          tagline: 'Curated Deals & Verified Finds',
          logo: currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
          banner: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80',
          category: 'General Deals & Tech',
          channelType: 'Creator',
          country: 'India',
          language: 'English',
          contactEmail: currentUser.email,
          status: 'active',
        })
          .then((newCh) => {
            setChannels((prev) => {
              if (prev.some((c) => c.id === newCh.id)) return prev;
              return [newCh, ...prev];
            });
            setDashboardChannel(newCh);
          })
          .catch(() => {})
          .finally(() => {
            autoChannelInProgressRef.current = false;
          });
      })
      .catch(() => {
        autoChannelInProgressRef.current = false;
      });
  }, [currentUser, authLoading, channels.length]);

  // Open User's Own Channel (Requirement #1: "The first channel option in the account menu should be: My Channel")
  const handleOpenMyChannel = () => {
    if (!currentUser) {
      openSignIn('general', 'Open My Channel', () => handleOpenMyChannel());
      return;
    }
    const myChannel = userChannels[0];
    if (myChannel) {
      handleOpenChannelProfile(myChannel);
    } else {
      handleOpenCreateChannel();
    }
  };

  // Switch Plan Tier (Requirement #11)
  const handleUpdateUserPlan = (plan: SubscriptionPlan) => {
    if (!currentUser) return;
    const updated: UserAccount = {
      ...currentUser,
      subscriptionPlan: plan,
    };
    setCurrentUser(updated);
    currentUserRef.current = updated;
    localStorage.setItem('affiliate_current_user', JSON.stringify(updated));
    showToast(`Switched account plan to ${PLAN_LIMITS[plan].name}!`);
  };

  // Duplicate Product (Requirement #10)
  const handleDuplicateProduct = (product: MarketProduct) => {
    const clone: MarketProduct = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${product.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      views: 0,
      clicks: 0,
    };
    handleAddProduct(clone);
  };

  // Archive Product (Requirement #10)
  const handleArchiveProduct = async (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStatus = target.status === 'archived' ? 'published' : 'archived';
    await handleUpdateProduct({ ...target, status: newStatus });
  };

  // Save user-scoped cart
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`user_cart_${currentUser.id}`, JSON.stringify(cartItems));
      } catch {}
    }
  }, [cartItems, currentUser]);

  // Save user-scoped orders
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`user_orders_${currentUser.id}`, JSON.stringify(orders));
      } catch {}
    }
  }, [orders, currentUser]);

  // User Sign Out
  const handleSignOut = async () => {
    try {
      await signOutFirebase();
    } catch (e) {}

    localStorage.removeItem('affiliate_current_user');
    setCurrentUser(null);
    currentUserRef.current = null;
    setCartItems([]);
    setOrders([]);
    setActiveTab('home');
    setSelectedProduct(null);
    setActiveChannelProfile(null);

    showToast('Signed out. Account data secured and cleared from view.');
  };

  // Require Auth Helper
  const requireAuthForAction = useCallback((
    actionReason: 'save' | 'order',
    productTitle: string,
    action: () => void
  ) => {
    const isAuthed = Boolean(currentUserRef.current || auth.currentUser);
    if (!isAuthed) {
      setAuthModalConfig({
        isOpen: true,
        actionReason,
        initialMode: 'signin',
        productTitle,
        pendingAction: action,
      });
      return false;
    }
    return true;
  }, []);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (currentUser) {
        localStorage.setItem(`user_settings_${currentUser.id}`, JSON.stringify(updated));
      }
      localStorage.setItem('app_settings', JSON.stringify(updated));
      return updated;
    });
    showToast('Settings updated.');
  };

  // Clear Cart
  const handleClearCart = () => {
    setCartItems([]);
    if (currentUser) {
      localStorage.removeItem(`user_cart_${currentUser.id}`);
    }
    showToast('Saved cart cleared.');
  };

  // Add Product to Channel
  const handleAddProduct = async (newProduct: MarketProduct) => {
    const activeSellerId = auth.currentUser?.uid || currentUserRef.current?.id || newProduct.sellerId;
    const productToSave: MarketProduct = {
      ...newProduct,
      sellerId: activeSellerId,
      ownerId: activeSellerId,
    };

    setProducts((prev) => [productToSave, ...prev.filter((p) => p.id !== productToSave.id)]);
    showToast(`Product "${productToSave.title.slice(0, 24)}..." published successfully!`);

    try {
      await setDoc(doc(db, 'products', productToSave.id), productToSave);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `products/${productToSave.id}`);
    }
  };

  // Update Product
  const handleUpdateProduct = async (updatedProduct: MarketProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    showToast(`Product "${updatedProduct.title.slice(0, 24)}..." updated.`);

    try {
      await setDoc(doc(db, 'products', updatedProduct.id), updatedProduct, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${updatedProduct.id}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Product removed.');

    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {}
  };

  // Admin Product Status Moderation (approve, reject, hide)
  const handleAdminUpdateProductStatus = async (productId: string, newStatus: ProductStatus, reason?: string) => {
    const updates: Partial<MarketProduct> = {
      status: newStatus,
      rejectionReason: reason || undefined,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));

    try {
      await updateDoc(doc(db, 'products', productId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  // Channel Created Callback
  const handleChannelCreated = (newChannel: Channel) => {
    setChannels((prev) => [newChannel, ...prev.filter((c) => c.id !== newChannel.id)]);
    setDashboardChannel(newChannel);
    showToast(`Channel "${newChannel.name}" launched successfully!`);
  };

  // Open Create Channel with single channel per account check
  const handleOpenCreateChannel = useCallback(() => {
    if (!currentUser) {
      openSignIn('general', 'Create your channel', () => handleOpenCreateChannel());
      return;
    }
    if (userChannels.length > 0) {
      showToast(`You already own channel @${userChannels[0].username}. Only 1 channel per account is allowed.`);
      setDashboardChannel(userChannels[0]);
      setActiveTab('dashboard');
      return;
    }
    setIsChannelModalOpen(true);
  }, [currentUser, userChannels, openSignIn]);

  // Delete Channel (owner deletes their channel, resetting their 1-channel quota)
  const handleDeleteChannel = async (channelId: string) => {
    try {
      await deleteDoc(doc(db, 'channels', channelId));
    } catch (err) {}

    setChannels((prev) => prev.filter((c) => c.id !== channelId));
    if (dashboardChannel?.id === channelId) {
      setDashboardChannel(null);
    }
    setActiveTab('home');
    showToast('Channel deleted. Your account channel quota has been reset.');
  };

  // Open Public Channel Profile
  const handleOpenChannelProfile = (channel: Channel | string) => {
    let target: Channel | undefined;
    if (typeof channel === 'string') {
      target = channels.find((c) => c.username.toLowerCase() === channel.toLowerCase() || c.id === channel);
    } else {
      target = channel;
    }

    if (target) {
      setActiveChannelProfile(target);
      setSelectedProduct(null);
      try {
        window.history.pushState(null, '', `/channel/${target.username}`);
      } catch {}
    } else {
      showToast('Channel not found.');
    }
  };

  // Open Video in YouTube-style Video Player
  const handleSelectVideo = (video: ChannelVideo) => {
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  // Delete Video
  const handleVideoDeleted = async (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    showToast('Video removed from channel.');
    try {
      await deleteDoc(doc(db, 'videos', videoId));
    } catch (err) {}
  };

  // Open Product Details (records view)
  const handleOpenProduct = (product: MarketProduct) => {
    setSelectedProduct(product);
    setActiveChannelProfile(null);
    recordProductView(product, currentUser?.id);
  };

  // Purely execute adding product to cart
  const executeAddToCart = (product: MarketProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        {
          product,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    showToast(`✨ Reward granted! Saved "${product.title.slice(0, 24)}..." to cart.`);
  };

  // Add to Cart / Save Option - triggers Google AdMob Rewarded Ad (ca-app-pub-3940256099942544/5224354917)
  const handleAddToCart = (product: MarketProduct) => {
    if (!requireAuthForAction('save', product.title, () => handleAddToCart(product))) {
      return;
    }

    if (settings.rewardedAdOnSave !== false) {
      setRewardedAdProduct(product);
      setIsRewardedAdOpen(true);
    } else {
      executeAddToCart(product);
    }
  };

  // Update Cart Quantity
  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove from Cart
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart.');
  };

  // Buy Now - appends tracking tag, logs analytics click, opens link
  const handleBuyNow = (product: MarketProduct) => {
    if (!requireAuthForAction('order', product.title, () => handleBuyNow(product))) {
      return;
    }

    let targetUrl = normalizeProductLink(product.productLink);
    if (settings.appendTrackingTag && settings.affiliateTag) {
      targetUrl = attachAffiliateTag(targetUrl, settings.affiliateTag);
    }

    // Record outbound click in analytics
    recordProductClick(product, currentUser?.id, true);

    openExternalLink(targetUrl);

    if (settings.verifyPurchasePrompt) {
      setRedirectingProduct(product);
    } else {
      handleConfirmPurchase(product);
    }
  };

  // Confirm Purchase
  const handleConfirmPurchase = async (product: MarketProduct) => {
    let targetUrl = normalizeProductLink(product.productLink);
    if (settings.appendTrackingTag && settings.affiliateTag) {
      targetUrl = attachAffiliateTag(targetUrl, settings.affiliateTag);
    }

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      product,
      clickedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Confirmed Purchase',
      targetLink: targetUrl,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setRedirectingProduct(null);
    showToast(`Order confirmed! Added "${product.title.slice(0, 24)}..." to Orders.`);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), {
          ...newOrder,
          userId: currentUser.id,
        });
      } catch (err) {}
    }
  };

  // Remove Order
  const handleRemoveOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('Order removed from list.');
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (err) {}
    }
  };

  // Filtered Public Products (shows published only)
  const publicProducts = useMemo(() => {
    return products.filter((p) => !p.status || p.status === 'published');
  }, [products]);

  // Store Group Breakdown
  const storeGroupsBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    publicProducts.forEach((p) => {
      const g = getProductStoreGroup(p);
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [publicProducts]);

  // Filtered by Search, Category & Store Group
  const filteredProducts = useMemo(() => {
    return publicProducts.filter((p) => {
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedStoreGroup !== 'all') {
        const group = getProductStoreGroup(p);
        if (group !== selectedStoreGroup) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchSeller = p.sellerName.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchMerchant = (p.merchant || '').toLowerCase().includes(q);
        const matchChannel = (p.channelUsername || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchType = (p.productType || '').toLowerCase().includes(q);
        const matchKeywords = (p.keywords || []).some((kw) => kw.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSeller && !matchCat && !matchMerchant && !matchChannel && !matchBrand && !matchType && !matchKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [publicProducts, selectedCategory, selectedStoreGroup, searchQuery]);

  // Products clustered into store groups (for divided view mode)
  const productsByStoreGroup = useMemo(() => {
    const groups: Record<string, MarketProduct[]> = {};
    filteredProducts.forEach((p) => {
      const g = getProductStoreGroup(p);
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    publicProducts.forEach((p) => cats.add(p.category));
    return ['all', ...Array.from(cats)];
  }, [publicProducts]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Boutique Header */}
      <HeaderNav
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          setSelectedProduct(null);
          setActiveChannelProfile(null);
          setActiveTab(tab);
          try {
            window.history.pushState(null, '', '/');
          } catch {}
        }}
        onOpenUpload={() => {
          if (!currentUser) {
            openSignIn('general', 'Create your channel to start listing products', () => {
              setIsUploadOpen(true);
            });
          } else {
            setEditingProduct(null);
            setIsUploadOpen(true);
          }
        }}
        onOpenCreateChannel={() => {
          if (!currentUser) {
            openSignIn('general', 'Create a channel', () => setIsChannelModalOpen(true));
          } else {
            setIsChannelModalOpen(true);
          }
        }}
        onOpenUploadVideo={() => {
          if (!currentUser) {
            openSignIn('general', 'Sign in to upload videos', () => setIsUploadVideoOpen(true));
          } else {
            setEditingVideo(null);
            setIsUploadVideoOpen(true);
          }
        }}
        onOpenMyChannel={handleOpenMyChannel}
        userChannel={userChannels[0] || null}
        onOpenSignIn={() => openSignIn('general')}
        onOpenSignUp={() => openSignUp('general')}
        onSignOut={handleSignOut}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        hasChannel={userChannels.length > 0}
        isAdmin={isAdmin}
      />

      {/* Active Ad Banner with verification publisher code */}
      <AdBanner placement="header" adUnitId={ACTIVE_AD_CODE} />

      {/* Main Body */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
          activeTab={activeTab}
          onNavigateTab={(tab) => {
            setSelectedProduct(null);
            setActiveChannelProfile(null);
            setActiveTab(tab);
            try {
              window.history.pushState(null, '', '/');
            } catch {}
          }}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          ordersCount={orders.length}
          onOpenUpload={() => {
            if (!currentUser) {
              openSignIn('general', 'Create your channel', () => setIsUploadOpen(true));
            } else {
              setEditingProduct(null);
              setIsUploadOpen(true);
            }
          }}
          onOpenUploadVideo={() => {
            if (!currentUser) {
              openSignIn('general', 'Sign in to upload videos', () => setIsUploadVideoOpen(true));
            } else {
              setEditingVideo(null);
              setIsUploadVideoOpen(true);
            }
          }}
          onOpenCreateChannel={() => {
            if (!currentUser) {
              openSignIn('general', 'Create a channel', () => setIsChannelModalOpen(true));
            } else {
              setIsChannelModalOpen(true);
            }
          }}
          onOpenMyChannel={handleOpenMyChannel}
          onOpenSignIn={() => openSignIn('general')}
          onOpenSignUp={() => openSignUp('general')}
          onSignOut={handleSignOut}
          settings={settings}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          availableCategories={availableCategories}
          userChannels={userChannels}
          isAdmin={isAdmin}
        />

        {/* Main View Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8">
          {/* 1. PRODUCT DETAIL VIEW (PDP) */}
          {selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              channel={channels.find((c) => c.id === selectedProduct.channelId || c.username === selectedProduct.channelUsername)}
              onBack={() => setSelectedProduct(null)}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onOpenChannelProfile={(username) => handleOpenChannelProfile(username)}
              onOpenReport={(type, id, title) => {
                setReportModalConfig({
                  isOpen: true,
                  targetType: type,
                  targetId: id,
                  targetTitle: title,
                });
              }}
            />
          ) : activeChannelProfile ? (
            /* 2. PUBLIC CHANNEL PROFILE VIEW (/channel/:username or /channel/@handle) */
            <ChannelProfileView
              channel={activeChannelProfile}
              products={products}
              videos={videos}
              currentUser={currentUser}
              onBack={() => {
                setActiveChannelProfile(null);
                try {
                  window.history.pushState(null, '', '/');
                } catch {}
              }}
              onSelectProduct={handleOpenProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onSelectVideo={handleSelectVideo}
              onOpenUploadVideo={() => {
                setEditingVideo(null);
                setIsUploadVideoOpen(true);
              }}
              onOpenDashboard={() => {
                setDashboardChannel(activeChannelProfile);
                setActiveChannelProfile(null);
                setActiveTab('dashboard');
              }}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setIsUploadOpen(true);
              }}
              onOpenEditChannel={() => setIsEditChannelOpen(true)}
              onOpenReport={(type, id, title) => {
                setReportModalConfig({
                  isOpen: true,
                  targetType: type,
                  targetId: id,
                  targetTitle: title,
                });
              }}
              onRequireAuth={requireAuthForAction}
              onShowToast={showToast}
            />
          ) : activeTab === 'discover' ? (
            /* 3. DISCOVER CHANNELS MARKETPLACE */
            <ChannelDiscoveryView
              channels={channels}
              products={publicProducts}
              currentUser={currentUser}
              onOpenChannelProfile={handleOpenChannelProfile}
              onSelectProduct={handleOpenProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onOpenCreateChannel={() => {
                if (!currentUser) {
                  openSignIn('general', 'Create your channel', () => setIsChannelModalOpen(true));
                } else {
                  setIsChannelModalOpen(true);
                }
              }}
              onRequireAuth={requireAuthForAction}
              onShowToast={showToast}
            />
          ) : activeTab === 'dashboard' ? (
            /* 4. CREATOR STUDIO DASHBOARD VIEW */
            currentUser ? (
              <ChannelDashboardView
                userChannels={userChannels}
                selectedChannel={dashboardChannel}
                onSelectChannel={setDashboardChannel}
                products={products}
                videos={videos}
                currentUser={currentUser}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsUploadOpen(true);
                }}
                onOpenEditProduct={(prod) => {
                  setEditingProduct(prod);
                  setIsUploadOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onDuplicateProduct={handleDuplicateProduct}
                onArchiveProduct={handleArchiveProduct}
                onOpenUploadVideo={() => {
                  setEditingVideo(null);
                  setIsUploadVideoOpen(true);
                }}
                onEditVideo={(vid) => {
                  setEditingVideo(vid);
                  setIsUploadVideoOpen(true);
                }}
                onDeleteVideo={handleVideoDeleted}
                onSelectVideo={handleSelectVideo}
                onOpenCreateChannel={() => setIsChannelModalOpen(true)}
                onOpenChannelProfile={handleOpenChannelProfile}
                onSelectProduct={handleOpenProduct}
                onUpdateProduct={handleUpdateProduct}
                onUpdateUserPlan={handleUpdateUserPlan}
                onDeleteChannel={handleDeleteChannel}
                onShowToast={showToast}
              />
            ) : (
              <div className="max-w-xl mx-auto py-12 text-center bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Store className="w-7 h-7" />
                </div>
                <h2 className="font-display font-bold text-xl text-slate-900">
                  Sign In to Open Seller Dashboard
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Manage your store channels, upload products, track click-through rates, and customize your shop profile.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => openSignIn('general')}
                    className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openSignUp('general')}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )
          ) : activeTab === 'admin' && isAdmin && currentUser ? (
            /* 5. ADMIN DASHBOARD */
            <AdminDashboardView
              currentUser={currentUser}
              channels={channels}
              products={products}
              reports={reports}
              onUpdateProductStatus={handleAdminUpdateProductStatus}
              onDeleteProduct={handleDeleteProduct}
              onRefreshChannels={() => {}}
              onRefreshReports={() => {}}
              onOpenChannelProfile={handleOpenChannelProfile}
              onShowToast={showToast}
            />
          ) : activeTab === 'settings' ? (
            /* 6. SETTINGS VIEW */
            <SettingsView
              currentUser={currentUser}
              userChannels={userChannels}
              onOpenCreateChannel={() => setIsChannelModalOpen(true)}
              onOpenDashboard={() => {
                if (userChannels.length > 0) {
                  setDashboardChannel(userChannels[0]);
                  setActiveTab('dashboard');
                } else {
                  handleOpenCreateChannel();
                }
              }}
              onOpenChannelProfile={handleOpenChannelProfile}
              onUpdateAccountType={(newType, bizName) => {
                if (!currentUser) return;
                const updated: UserAccount = {
                  ...currentUser,
                  accountType: newType,
                  businessName: bizName || currentUser.businessName,
                };
                setCurrentUser(updated);
                currentUserRef.current = updated;
                localStorage.setItem('affiliate_current_user', JSON.stringify(updated));
                showToast(`Account updated to ${newType}.`);
              }}
              onOpenUpload={() => {
                setEditingProduct(null);
                setIsUploadOpen(true);
              }}
              uploadedProducts={products}
              onDeleteProduct={handleDeleteProduct}
              onOpenSignIn={() => openSignIn('general')}
              onOpenSignUp={() => openSignUp('general')}
              onSignOut={handleSignOut}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onClearCart={handleClearCart}
              orders={orders}
              cartItems={cartItems}
              onTestRewardedAd={() => {
                const sample = products[0] || {
                  id: 'test-deal-sample',
                  sellerId: 'demo',
                  sellerName: 'Deal Sphere Demo Store',
                  title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
                  price: 24990,
                  originalPrice: 34990,
                  currency: settings.currency || '₹',
                  productLink: 'https://amazon.in',
                  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
                  category: 'Electronics',
                  rating: 4.8,
                  reviewCount: 320,
                  inStock: true,
                  freeDelivery: true,
                  createdAt: new Date().toISOString(),
                };
                setRewardedAdProduct(sample);
                setIsRewardedAdOpen(true);
              }}
            />
          ) : activeTab === 'cart' ? (
            /* 7. CART VIEW */
            <CartView
              currentUser={currentUser}
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              onProceedToBuy={handleBuyNow}
              onExploreProducts={() => setActiveTab('home')}
              onOpenSignIn={() => openSignIn('save')}
              onOpenSignUp={() => openSignUp('save')}
            />
          ) : activeTab === 'orders' ? (
            /* 8. ORDERS VIEW */
            <OrdersView
              currentUser={currentUser}
              orders={orders}
              onExploreProducts={() => setActiveTab('home')}
              onOpenSignIn={() => openSignIn('order')}
              onOpenSignUp={() => openSignUp('order')}
              onRemoveOrder={handleRemoveOrder}
            />
          ) : (
            /* 9. HOME TAB: EXPLORE PRODUCTS CATALOG */
            <div className="space-y-6">
              
              {/* Top Overview Bar */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Affiliate Marketplace</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified Channels
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{publicProducts.length} {publicProducts.length === 1 ? 'deal listed' : 'deals listed'}</span>
                    <span>·</span>
                    <span>{channels.length} active {channels.length === 1 ? 'channel' : 'channels'}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Destination Links
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-colors shadow-2xs"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Browse Channels</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        openSignIn('general', 'Add a product to your channel', () => {
                          setEditingProduct(null);
                          setIsUploadOpen(true);
                        });
                      } else {
                        setEditingProduct(null);
                        setIsUploadOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Guest / Visitor Access Notice Banner */}
              {!currentUser && (
                <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-purple-50/50 border border-indigo-100 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs text-left">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Open Channel Marketplace</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          Free Public Browsing
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Anyone can discover products and channels. <strong>Create a channel</strong> to start your own storefront, follow creators, or save items to your personal cart.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => openSignIn('general')}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all shadow-2xs"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => openSignUp('general')}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-xs shadow-indigo-100"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}

              {/* STORE / PLATFORM GROUPS FILTER & DIVISION BAR */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-indigo-600" />
                      <span>Divide by Store / Platform:</span>
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      (Filtered by product links: Amazon, Flipkart, Meesho, etc.)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewByStoreGroup(!viewByStoreGroup)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                        viewByStoreGroup
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{viewByStoreGroup ? 'Divided by Stores ON' : 'Divide into Store Groups'}</span>
                    </button>
                  </div>
                </div>

                {/* Store Platform Group Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedStoreGroup('all')}
                    className={`px-3 py-1 text-xs rounded-full border transition-all whitespace-nowrap font-medium flex items-center gap-1 ${
                      selectedStoreGroup === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Stores</span>
                    <span className="text-[10px] opacity-75 font-tabular">({publicProducts.length})</span>
                  </button>

                  {(['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Ajio', 'Other'] as StoreGroup[]).map((groupName) => {
                    const cfg = getStoreGroupConfig(groupName);
                    const count = storeGroupsBreakdown[groupName] || 0;
                    const isSelected = selectedStoreGroup === groupName;
                    return (
                      <button
                        key={groupName}
                        onClick={() => setSelectedStoreGroup(isSelected ? 'all' : groupName)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all whitespace-nowrap font-medium flex items-center gap-1.5 ${
                          isSelected
                            ? `${cfg.badgeClass} ring-2 ring-indigo-200 font-bold shadow-xs`
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.badgeLabel}</span>
                        <span className="text-[10px] font-tabular opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories Filter Pills */}
              {availableCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" />
                    Categories:
                  </span>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Products Feed */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 sm:p-14 text-center max-w-xl mx-auto space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 shadow-xs">
                    <ShoppingBag className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="font-display font-bold text-xl text-slate-900">
                      No Products Found
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {selectedStoreGroup !== 'all' 
                        ? `No products currently listed from ${selectedStoreGroup}. Add a link to list one!`
                        : 'Be the first seller to create a channel and publish products with verified links.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {selectedStoreGroup !== 'all' && (
                      <button
                        onClick={() => setSelectedStoreGroup('all')}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        Clear Store Filter
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          openSignIn('general', 'Add a product to your channel', () => {
                            setEditingProduct(null);
                            setIsUploadOpen(true);
                          });
                        } else {
                          setEditingProduct(null);
                          setIsUploadOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>
              ) : viewByStoreGroup ? (
                /* DIVIDED BY STORE GROUPS VIEW */
                <div className="space-y-10">
                  {Object.entries(productsByStoreGroup).map(([groupName, groupItems]) => {
                    const cfg = getStoreGroupConfig(groupName as StoreGroup);
                    return (
                      <div key={groupName} className="space-y-4">
                        {/* Store Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{cfg.icon}</span>
                            <div>
                              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                                <span>Deals {cfg.badgeLabel}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
                                  {groupItems.length} {groupItems.length === 1 ? 'deal' : 'deals'}
                                </span>
                              </h2>
                              <p className="text-[11px] text-slate-500">
                                Curated products directly sourced from {cfg.displayName} links
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedStoreGroup(groupName);
                              setViewByStoreGroup(false);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Focus this store &rarr;
                          </button>
                        </div>

                        {/* Store Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                          {groupItems.map((p) => (
                            <AmazonProductCard
                              key={p.id}
                              product={p}
                              viewMode={settings.viewMode}
                              onSelectProduct={handleOpenProduct}
                              onAddToCart={handleAddToCart}
                              onBuyNow={handleBuyNow}
                              onOpenChannel={handleOpenChannelProfile}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* UNIFIED FEED VIEW */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filteredProducts.slice(0, 4).map((p) => (
                      <AmazonProductCard
                        key={p.id}
                        product={p}
                        viewMode={settings.viewMode}
                        onSelectProduct={handleOpenProduct}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onOpenChannel={handleOpenChannelProfile}
                      />
                    ))}
                  </div>

                  {/* Mid-feed AdMob Banner Test Ad */}
                  <AdBanner placement="feed" />

                  {filteredProducts.length > 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                      {filteredProducts.slice(4).map((p) => (
                        <AmazonProductCard
                          key={p.id}
                          product={p}
                          viewMode={settings.viewMode}
                          onSelectProduct={handleOpenProduct}
                          onAddToCart={handleAddToCart}
                          onBuyNow={handleBuyNow}
                          onOpenChannel={handleOpenChannelProfile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setSelectedProduct(null);
          setActiveChannelProfile(null);
          setActiveTab(tab);
        }}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        ordersCount={orders.length}
        accountType={currentUser?.accountType || 'normal'}
        hasChannel={userChannels.length > 0}
        isAdmin={isAdmin}
      />

      {/* MODALS */}

      {/* 1. Channel Creation Modal */}
      {currentUser && (
        <ChannelCreationModal
          isOpen={isChannelModalOpen}
          onClose={() => setIsChannelModalOpen(false)}
          currentUser={currentUser}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {/* 2. Upload / Edit Product Modal */}
      {currentUser && (
        <UploadProductModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setEditingProduct(null);
          }}
          currentUser={currentUser}
          userChannels={userChannels}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          editingProduct={editingProduct}
          totalUserProductsCount={products.filter((p) => p.sellerId === currentUser.id || p.ownerId === currentUser.id).length}
          onOpenCreateChannel={() => {
            setIsUploadOpen(false);
            setIsChannelModalOpen(true);
          }}
          defaultCurrency={settings.currency}
        />
      )}

      {/* 3. Auth Modal */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false, pendingAction: undefined }))}
        actionReason={authModalConfig.actionReason}
        productTitle={authModalConfig.productTitle}
        initialMode={authModalConfig.initialMode}
        onSuccess={() => showToast('Signed in successfully!')}
        onDirectLogin={handleDirectLogin}
      />

      {/* 4. Outbound Redirecting Confirmation Modal */}
      <RedirectingModal
        isOpen={Boolean(redirectingProduct)}
        onClose={() => setRedirectingProduct(null)}
        product={redirectingProduct}
        onConfirmPurchase={(p) => {
          handleConfirmPurchase(p);
        }}
      />

      {/* 5. User Report Modal */}
      <ReportModal
        isOpen={reportModalConfig.isOpen}
        onClose={() => setReportModalConfig((prev) => ({ ...prev, isOpen: false }))}
        targetType={reportModalConfig.targetType}
        targetId={reportModalConfig.targetId}
        targetTitle={reportModalConfig.targetTitle}
        reporterId={currentUser?.id}
        reporterEmail={currentUser?.email}
      />

      {/* 6. Google AdMob Rewarded Test Ad Modal (ca-app-pub-3940256099942544/5224354917) */}
      <RewardedAdModal
        isOpen={isRewardedAdOpen}
        product={rewardedAdProduct}
        onClose={() => {
          setIsRewardedAdOpen(false);
          setRewardedAdProduct(null);
        }}
        onRewardGranted={(product) => {
          executeAddToCart(product);
        }}
        adUnitId={REWARDED_TEST_AD_UNIT_ID}
      />

      {/* 7. YouTube-style Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isVideoPlayerOpen}
        onClose={() => {
          setIsVideoPlayerOpen(false);
          setSelectedVideo(null);
        }}
        products={products}
        channel={channels.find((c) => c.id === selectedVideo?.channelId || c.username === selectedVideo?.channelUsername)}
        currentUser={currentUser}
        onSelectProduct={handleOpenProduct}
        onBuyNow={handleBuyNow}
        onOpenChannel={handleOpenChannelProfile}
        onShowToast={showToast}
      />

      {/* 8. YouTube-style Video Upload & Edit Modal */}
      {currentUser && (
        <UploadVideoModal
          isOpen={isUploadVideoOpen}
          onClose={() => {
            setIsUploadVideoOpen(false);
            setEditingVideo(null);
          }}
          currentUser={currentUser}
          currentChannel={userChannels[0] || null}
          products={products.filter((p) => p.channelId === userChannels[0]?.id || p.sellerId === currentUser.id)}
          editingVideo={editingVideo}
          totalUserVideosCount={videos.filter((v) => v.ownerId === currentUser.id).length}
          onVideoSaved={(saved) => {
            setVideos((prev) => [saved, ...prev.filter((v) => v.id !== saved.id)]);
          }}
          onVideoDeleted={(delId) => {
            setVideos((prev) => prev.filter((v) => v.id !== delId));
          }}
          onShowToast={showToast}
        />
      )}

      {/* 9. Channel Customization / Edit Channel Modal */}
      {currentUser && userChannels[0] && (
        <EditChannelModal
          isOpen={isEditChannelOpen}
          onClose={() => setIsEditChannelOpen(false)}
          channel={userChannels[0]}
          currentUser={currentUser}
          onChannelUpdated={(updatedCh) => {
            setChannels((prev) => prev.map((c) => (c.id === updatedCh.id ? updatedCh : c)));
            if (activeChannelProfile?.id === updatedCh.id) {
              setActiveChannelProfile(updatedCh);
            }
            if (dashboardChannel?.id === updatedCh.id) {
              setDashboardChannel(updatedCh);
            }
          }}
          onShowToast={showToast}
        />
      )}

    </div>
  );
}
