import React, { useState } from 'react';
import { Channel, ChannelType, UserAccount } from '../types';
import { 
  X, 
  Store, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Upload, 
  Globe, 
  Share2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck,
  Tag,
  AtSign,
  Mail,
  Camera,
  Layers
} from 'lucide-react';
import { validateUsername, isUsernameTaken, createChannel, generateChannelId, getChannelsByOwner } from '../services/channelService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onChannelCreated: (channel: Channel) => void;
  existingChannel?: Channel | null;
  onNavigateToDashboard?: () => void;
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

const CHANNEL_TYPES: { type: ChannelType; label: string; desc: string }[] = [
  { type: 'Creator', label: 'Creator', desc: 'Curate your favorite finds & recommendations' },
  { type: 'Affiliate/Deals', label: 'Affiliate / Deals', desc: 'Share top deals, discounts & coupon codes' },
  { type: 'Store', label: 'Store', desc: 'Direct merchant or boutique shopfront' },
  { type: 'Brand', label: 'Brand', desc: 'Official brand storefront' },
  { type: 'Personal', label: 'Personal', desc: 'Personal collection & curated wishlist' },
  { type: 'Other', label: 'Other', desc: 'Custom or multipurpose channel' },
];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
  'Germany', 'France', 'Singapore', 'United Arab Emirates', 'Global / Worldwide'
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Other'
];

export const ChannelCreationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onChannelCreated,
  existingChannel,
  onNavigateToDashboard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Required Information
  const [name, setName] = useState(currentUser.businessName || `${currentUser.name}'s Deals`);
  const [username, setUsername] = useState(() => {
    const raw = (currentUser.businessName || currentUser.name || 'channel')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return raw.slice(0, 16) || 'curator';
  });
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [description, setDescription] = useState(
    'Welcome to my Deal Sphere channel! Follow for curated deals, reviews, and high-value product recommendations.'
  );
  const [logo, setLogo] = useState(
    currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=4f46e5,6366f1`
  );
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [channelType, setChannelType] = useState<ChannelType>('Creator');
  const [country, setCountry] = useState('India');
  const [language, setLanguage] = useState('English');
  const [contactEmail, setContactEmail] = useState(currentUser.email || '');

  // Step 2: Optional Information
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80');
  const [tagline, setTagline] = useState('Best deals, verified links & smart product picks.');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [businessName, setBusinessName] = useState(currentUser.businessName || '');
  const [gstInfo, setGstInfo] = useState('');
  const [sellerContact, setSellerContact] = useState('');

  // Step 3: Created Channel
  const [createdChannel, setCreatedChannel] = useState<Channel | null>(null);

  if (!isOpen) return null;

  // Account limit check: Only 1 channel per account is allowed
  if (existingChannel) {
    const existingLogoSrc = (existingChannel.logo && existingChannel.logo.trim() !== '')
      ? existingChannel.logo
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(existingChannel.name)}`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 text-left">
        <div 
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Channel Limit Reached
                </h2>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  1 Channel Per Account
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
            <img
              src={existingLogoSrc}
              alt={existingChannel.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(existingChannel.name)}`;
              }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 truncate">{existingChannel.name}</h3>
              <p className="text-xs text-indigo-600 font-semibold">@{existingChannel.username}</p>
              <p className="text-[11px] text-slate-500">{existingChannel.category} · {existingChannel.followersCount || 0} followers</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Each Deal Sphere account is limited to <strong>one channel</strong> to maintain quality marketplace curation. Your account already owns <strong>@{existingChannel.username}</strong>.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              Close
            </button>
            {onNavigateToDashboard && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDashboard();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs shadow-indigo-100 transition-all"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Logo image must be under 3MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('Banner image must be under 4MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate Username Change
  const handleUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(clean);
    const check = validateUsername(clean);
    if (!check.isValid) {
      setUsernameStatus('invalid');
      setUsernameMsg(check.error || 'Invalid username');
      return;
    }

    const taken = await isUsernameTaken(clean);
    if (taken) {
      setUsernameStatus('invalid');
      setUsernameMsg('This username is already taken. Please choose another.');
    } else {
      setUsernameStatus('valid');
      setUsernameMsg(`@${clean} is available!`);
    }
  };

  // Proceed from Step 1 to Step 2
  const handleGoToStep2 = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please provide a channel name.');
      return;
    }
    const check = validateUsername(username);
    if (!check.isValid) {
      setError(check.error || 'Invalid username.');
      return;
    }
    const taken = await isUsernameTaken(username);
    if (taken) {
      setError('This username is already taken. Please choose another.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a channel description.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setError('Please enter a valid contact email.');
      return;
    }

    setStep(2);
  };

  // Submit and Create Channel
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const owned = await getChannelsByOwner(currentUser.id);
      if (owned.length > 0) {
        setError(`Only one channel per account is permitted. You already own @${owned[0].username}.`);
        setSubmitting(false);
        return;
      }
    } catch {
      // Proceed to createChannel which also enforces the policy
    }

    try {
      const channelId = generateChannelId();
      const newChannel = await createChannel({
        id: channelId,
        ownerId: currentUser.id,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        description: description.trim(),
        logo: logo.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        banner: banner.trim(),
        tagline: tagline.trim(),
        category,
        channelType,
        country,
        language,
        contactEmail: contactEmail.trim().toLowerCase(),
        websiteUrl: websiteUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        twitterUrl: twitterUrl.trim(),
        businessName: businessName.trim(),
        gstInfo: gstInfo.trim(),
        sellerContact: sellerContact.trim(),
        status: 'active',
      });

      setCreatedChannel(newChannel);
      onChannelCreated(newChannel);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Failed to create channel. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 text-left">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7 max-h-[92vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-slate-900">
                  {step === 3 ? 'Channel Created Successfully!' : 'Create Your Channel'}
                </h2>
                {step < 3 && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    1 Channel Limit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Step 1 of 2: Required Channel Information (one storefront per account)'}
                {step === 2 && 'Step 2 of 2: Branding & Social Links (Optional)'}
                {step === 3 && 'Your public storefront is live on Deal Sphere!'}
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

        {/* Step Progress Indicator (for steps 1 & 2) */}
        {step < 3 && (
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Required Information */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Channel Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deal Hunter India, Tech Curator Pro"
                maxLength={60}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                required
              />
            </div>

            {/* Username / Handle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unique Handle / Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-400 font-semibold select-none">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="dealhunterindia"
                  maxLength={30}
                  className="w-full pl-8 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-slate-400">
                  Public URL: <strong className="text-slate-600">/channel/{username || 'yourhandle'}</strong>
                </span>
                {usernameMsg && (
                  <span className={usernameStatus === 'valid' ? 'text-emerald-600 font-medium' : 'text-rose-600'}>
                    {usernameMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Logo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Profile Picture / Logo <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={logo && logo.trim() !== '' ? logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Channel')}`}
                  alt="Channel Logo Preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-50"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=Channel`;
                  }}
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">or enter image URL</span>
                  </div>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="What deals, products, or reviews will you share on this channel?"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                required
              />
              <div className="text-right text-[10px] text-slate-400">
                {description.length}/1000
              </div>
            </div>

            {/* Category & Channel Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Category <span className="text-rose-500">*</span>
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
                  Channel Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as ChannelType)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {CHANNEL_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>{t.label} ({t.desc.slice(0, 30)}...)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country & Language & Contact Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Language <span className="text-rose-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@store.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoToStep2}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Optional Information */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Channel Tagline (Optional)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Best deals & verified bargains daily"
                maxLength={120}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            {/* Banner Cover Image */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banner / Cover Image (Optional)
              </label>
              <div className="space-y-2">
                <div className="h-24 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <img
                    src={banner && banner.trim() !== '' ? banner : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80'}
                    alt="Channel Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop&q=80';
                    }}
                  />
                  <label className="absolute bottom-2 right-2 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-xs hover:bg-white text-slate-700 rounded-lg text-[11px] font-semibold shadow-xs">
                    <Camera className="w-3 h-3" />
                    <span>Change Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="Or paste banner image URL"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Social & Online Links (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Website URL</span>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://mysite.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Instagram URL</span>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/mychannel"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">YouTube URL</span>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@mychannel"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">X / Twitter URL</span>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/mychannel"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Business / Seller Info */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Business & Support Information (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Registered Business Name</span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Retail Pvt Ltd"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">GST / Business ID</span>
                  <input
                    type="text"
                    value={gstInfo}
                    onChange={(e) => setGstInfo(e.target.value)}
                    placeholder="GSTIN or Tax ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Seller Support Phone / WhatsApp</span>
                  <input
                    type="text"
                    value={sellerContact}
                    onChange={(e) => setSellerContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full shadow-sm shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <span>Creating Channel...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch My Channel</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Channel Created Success Screen */}
        {step === 3 && createdChannel && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-in zoom-in duration-200">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-extrabold text-2xl text-slate-900">
                {createdChannel.name} is Live!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your channel has been created and is ready to host your products, affiliate deals, and followers.
              </p>
            </div>

            {/* Channel Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={createdChannel.logo && createdChannel.logo.trim() !== '' ? createdChannel.logo : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(createdChannel.name)}`}
                  alt={createdChannel.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(createdChannel.name)}`;
                  }}
                />
                <div>
                  <div className="font-bold text-sm text-slate-900">{createdChannel.name}</div>
                  <div className="text-xs text-indigo-600 font-semibold">@{createdChannel.username}</div>
                  <div className="text-[11px] text-slate-400">ID: {createdChannel.id}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>Public Link:</span>
                <strong className="text-slate-900 font-mono text-[11px]">
                  /channel/{createdChannel.username}
                </strong>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm shadow-indigo-100 transition-all"
              >
                Go to Channel Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
