import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MarketProduct, UserAccount, CartItem, OrderRecord, AccountType, AppSettings, Channel, ReportRecord, ProductStatus } from './types';
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
import { normalizeProductLink, openExternalLink, attachAffiliateTag, getDomainFromUrl } from './utils/url';
import { sanitizeDisplayName } from './utils/privacy';
import { recordProductView, recordProductClick } from './services/channelService';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        targetUsername = pathname.replace('/channel/', '').split('/')[0]?.trim().toLowerCase();
      } else if (hash.startsWith('#/channel/')) {
        targetUsername = hash.replace('#/channel/', '').split('/')[0]?.trim().toLowerCase();
      } else if (search.includes('channel=')) {
        const params = new URLSearchParams(search);
        targetUsername = params.get('channel')?.trim().toLowerCase() || null;
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

  // Open Product Details (records view)
  const handleOpenProduct = (product: MarketProduct) => {
    setSelectedProduct(product);
    setActiveChannelProfile(null);
    recordProductView(product, currentUser?.id);
  };

  // Add to Cart
  const handleAddToCart = (product: MarketProduct) => {
    if (!requireAuthForAction('save', product.title, () => handleAddToCart(product))) {
      return;
    }

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

    showToast(`Saved "${product.title.slice(0, 24)}..." to cart.`);
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

  // Filtered by Search & Category
  const filteredProducts = useMemo(() => {
    return publicProducts.filter((p) => {
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchSeller = p.sellerName.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchChannel = (p.channelUsername || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSeller && !matchCat && !matchChannel) return false;
      }
      return true;
    });
  }, [publicProducts, selectedCategory, searchQuery]);

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
        onOpenSignIn={() => openSignIn('general')}
        onOpenSignUp={() => openSignUp('general')}
        onSignOut={handleSignOut}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        hasChannel={userChannels.length > 0}
        isAdmin={isAdmin}
      />

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
          onOpenCreateChannel={() => {
            if (!currentUser) {
              openSignIn('general', 'Create a channel', () => setIsChannelModalOpen(true));
            } else {
              setIsChannelModalOpen(true);
            }
          }}
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
            /* 2. PUBLIC CHANNEL PROFILE VIEW (/channel/:username) */
            <ChannelProfileView
              channel={activeChannelProfile}
              products={products}
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
              onOpenDashboard={() => {
                setDashboardChannel(activeChannelProfile);
                setActiveChannelProfile(null);
                setActiveTab('dashboard');
              }}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setIsUploadOpen(true);
              }}
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
            /* 4. SELLER DASHBOARD VIEW */
            currentUser ? (
              <ChannelDashboardView
                userChannels={userChannels}
                selectedChannel={dashboardChannel}
                onSelectChannel={setDashboardChannel}
                products={products}
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
                onOpenCreateChannel={() => setIsChannelModalOpen(true)}
                onOpenChannelProfile={handleOpenChannelProfile}
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
                        openSignIn('general', 'Create a channel', () => setIsChannelModalOpen(true));
                      } else if (userChannels.length === 0) {
                        setIsChannelModalOpen(true);
                      } else {
                        setEditingProduct(null);
                        setIsUploadOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{userChannels.length === 0 ? 'Create Channel' : 'Add Product'}</span>
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
                      {cat === 'all' ? 'All Products' : cat}
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
                      No Products Listed Yet
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Be the first seller to create a channel and publish products with verified links.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        openSignIn('general', 'Create your channel', () => setIsChannelModalOpen(true));
                      } else if (userChannels.length === 0) {
                        setIsChannelModalOpen(true);
                      } else {
                        setEditingProduct(null);
                        setIsUploadOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{userChannels.length === 0 ? 'Create Channel' : 'List First Product'}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {filteredProducts.map((p) => (
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

    </div>
  );
}
