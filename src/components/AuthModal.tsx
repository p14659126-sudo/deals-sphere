import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowUpRight, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink as LinkIcon, 
  RotateCcw,
  Sparkles,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  User,
  Store,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signInInstant,
  firebaseConfig, 
  createGoogleUserAccount 
} from '../firebase';
import { UserAccount, AccountType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  actionReason?: 'save' | 'order' | 'general';
  initialMode?: 'signin' | 'signup';
  productTitle?: string;
  onSuccess?: () => void;
  onDirectLogin?: (user: UserAccount) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  actionReason = 'general',
  initialMode = 'signin',
  productTitle,
  onSuccess,
  onDirectLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    message: string;
    type: 'unauthorized-domain' | 'popup-blocked' | 'popup-closed' | 'auth-provider' | 'general';
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form Fields - Sign In
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Form Fields - Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<AccountType>('normal');
  const [signUpStoreName, setSignUpStoreName] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Instant Sign-In fallback
  const [instantEmail, setInstantEmail] = useState('');

  // Reset or initialize state when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorDetails(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopyHost = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const parseAuthErrorMessage = (err: any): { message: string; type: any; code: string } => {
    const code = err?.code || '';
    const rawMsg = err?.message || 'Authentication failed.';

    if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
      return {
        code,
        message: `This domain (${currentHost}) is not authorized yet in Firebase Console.`,
        type: 'unauthorized-domain',
      };
    }
    if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
      return {
        code,
        message: 'The Google sign-in popup was blocked by browser iframe settings.',
        type: 'popup-blocked',
      };
    }
    if (code === 'auth/popup-closed-by-user') {
      return {
        code,
        message: 'The sign-in popup window was closed before completion.',
        type: 'popup-closed',
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        code,
        message: 'This sign-in provider is not enabled in Firebase Console. Enable Email/Password or Google provider in Auth settings.',
        type: 'auth-provider',
      };
    }
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return {
        code,
        message: 'Invalid email or password. Please verify your credentials or create a new account.',
        type: 'general',
      };
    }
    if (code === 'auth/email-already-in-use') {
      return {
        code,
        message: 'An account with this email already exists. Try signing in instead.',
        type: 'general',
      };
    }
    if (code === 'auth/weak-password') {
      return {
        code,
        message: 'Password should be at least 6 characters long.',
        type: 'general',
      };
    }
    if (code === 'auth/invalid-email') {
      return {
        code,
        message: 'Please enter a valid email address format.',
        type: 'general',
      };
    }
    return {
      code: code || 'auth/error',
      message: rawMsg.replace('Firebase: ', ''),
      type: 'general',
    };
  };

  // Google Sign In / Sign Up handler
  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorDetails(null);

    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorDetails(parseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign In handler
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setErrorDetails({
        message: 'Please enter both your email and password.',
        type: 'general',
      });
      return;
    }

    setLoading(true);
    setErrorDetails(null);

    try {
      await signInWithEmail(signInEmail, signInPassword);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const parsed = parseAuthErrorMessage(err);
      setErrorDetails(parsed);
      // If email/password provider is not yet enabled in Firebase Console, also offer instant sign in
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign Up handler
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword) {
      setErrorDetails({
        message: 'Please fill in all required fields.',
        type: 'general',
      });
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorDetails({
        message: 'Password must be at least 6 characters.',
        type: 'general',
      });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorDetails({
        message: 'Passwords do not match. Please re-enter them carefully.',
        type: 'general',
      });
      return;
    }

    setLoading(true);
    setErrorDetails(null);

    try {
      await signUpWithEmail(
        signUpEmail,
        signUpPassword,
        signUpName || undefined,
        signUpRole,
        signUpRole === 'business' ? signUpStoreName : undefined
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const parsed = parseAuthErrorMessage(err);
      setErrorDetails(parsed);
    } finally {
      setLoading(false);
    }
  };

  // Instant fallback sign-in handler
  const handleInstantSignIn = async (emailToUse: string) => {
    const trimmed = emailToUse.trim().toLowerCase();
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isValidFormat) {
      setErrorDetails({
        message: 'Please provide a valid email format (e.g. name@domain.com).',
        type: 'general',
      });
      return;
    }

    setLoading(true);
    setErrorDetails(null);

    try {
      const defaultRole = activeTab === 'signup' ? signUpRole : 'normal';
      const store = signUpRole === 'business' ? signUpStoreName : undefined;
      const user = await signInInstant(trimmed, signUpName || undefined, defaultRole, store);

      if (onDirectLogin) {
        onDirectLogin(user);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorDetails(parseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 text-left overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4 my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Icon */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 shadow-sm">
            {actionReason === 'save' ? (
              <ShoppingBag className="w-6 h-6" />
            ) : actionReason === 'order' ? (
              <ArrowUpRight className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <h3 className="font-display font-bold text-xl text-slate-900">
            {activeTab === 'signin' ? 'Sign In to DealSphere' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {actionReason === 'save'
              ? `Sign in to save ${productTitle ? `"${productTitle.slice(0, 24)}..."` : 'products'} to your cart and sync across devices.`
              : actionReason === 'order'
              ? 'Sign in to access direct store links, track orders, and compare prices.'
              : activeTab === 'signin'
              ? 'Access your saved items, curated deals, and account orders.'
              : 'Join DealSphere as a shopper or affiliate product curator.'}
          </p>
        </div>

        {/* Seamless Tab Navigation Switcher: [Sign In] | [Sign Up] */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorDetails(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorDetails(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Diagnostic Box */}
        {errorDetails && (
          <div className="space-y-3">
            {errorDetails.type === 'unauthorized-domain' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-amber-900 block">
                      Firebase Domain Authorization Required
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Google OAuth requires this preview domain to be registered in your Firebase Console.
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Domain to Authorize:
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 select-all overflow-hidden">
                    <span className="truncate">{currentHost}</span>
                    <button
                      type="button"
                      onClick={handleCopyHost}
                      className="flex items-center gap-1 text-[11px] font-sans font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Firebase Auth Settings</span>
                    <LinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : errorDetails.type === 'auth-provider' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-left text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block">Firebase Provider Setup</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {errorDetails.message} In the Firebase Console, go to Authentication &gt; Sign-in method &gt; Enable Email/Password or Google.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1"
                  >
                    <span>Firebase Auth Console</span>
                    <LinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorDetails.message}</span>
              </div>
            )}
          </div>
        )}

        {/* 1. Quick One-Click Google Auth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl shadow-xs font-semibold text-xs text-slate-800 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50 hover:border-slate-400"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.58H1.26A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>
            {loading 
              ? 'Connecting with Google...' 
              : activeTab === 'signin' 
              ? 'Continue with Google' 
              : 'Sign up with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2.5 text-slate-400 font-semibold tracking-wider">
              Or with email & password
            </span>
          </div>
        </div>

        {/* 2. Tab Content: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl outline-none transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl outline-none transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-100 transition-all active:scale-[0.99] disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorDetails(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Sign Up
                </button>
              </span>
            </div>
          </form>
        )}

        {/* 3. Tab Content: SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Full Name or Curator Alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl outline-none transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl outline-none transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Account Purpose
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignUpRole('normal')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    signUpRole === 'normal'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Shopper</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Save deals & track orders
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSignUpRole('business')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    signUpRole === 'business'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Curator / Seller</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    List affiliate products
                  </p>
                </button>
              </div>
            </div>

            {/* Optional Store Name if business */}
            {signUpRole === 'business' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Curator / Store Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Apex Deals & Comics"
                    value={signUpStoreName}
                    onChange={(e) => setSignUpStoreName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 chars"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl outline-none"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-indigo-100 transition-all active:scale-[0.99] disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorDetails(null);
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Sign In
                </button>
              </span>
            </div>
          </form>
        )}

        {/* 4. Instant Email Sign-In Quick-Login (Private & Session Resilient) */}
        <details className="group border border-slate-200/80 rounded-2xl p-2.5 bg-slate-50/70 text-left">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-600 flex items-center justify-between list-none">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instant Email Sign-In (No password needed)</span>
            </span>
            <span className="text-[10px] text-indigo-600 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="pt-2 space-y-2">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Instantly connect with your email to access your account's saved items, past orders, and settings without entering a password.
            </p>
            <div className="flex gap-1.5">
              <input
                type="email"
                placeholder="Enter your account email"
                value={instantEmail}
                onChange={(e) => setInstantEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => handleInstantSignIn(instantEmail)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shrink-0 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </details>

        {/* Account Data Persistence Notice */}
        <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-slate-500">
            When you sign out, your private cart and orders are hidden. Signing back in with the same account restores all your data.
          </p>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Firebase Security</span>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
