import React, { useState } from 'react';
import { CreatorChannel, UserAccount } from '../types';
import { 
  X, 
  Tv, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Video, 
  Instagram, 
  Youtube, 
  Globe, 
  ShieldCheck,
  Palette
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onCreateChannel: (channel: CreatorChannel) => void;
  initialChannel?: CreatorChannel | null;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', // Modern abstract dark indigo
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80', // Vibrant colorful gradient
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80', // Cyberpunk tech
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80', // Minimal matrix tech
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80', // Fashion & boutique
];

export const CreateChannelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onCreateChannel,
  initialChannel,
}) => {
  const isEditing = Boolean(initialChannel);

  const [name, setName] = useState(initialChannel?.name || currentUser.businessName || `${currentUser.name}'s Deals`);
  const [handle, setHandle] = useState(
    initialChannel?.handle || 
    `@${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator'}`
  );
  const [category, setCategory] = useState(initialChannel?.category || 'Electronics & Tech');
  const [bio, setBio] = useState(
    initialChannel?.bio || 
    'Curating handpicked deals, unboxings, and verified product recommendations.'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialChannel?.avatarUrl || 
    currentUser.avatar || 
    PRESET_AVATARS[0]
  );
  const [bannerUrl, setBannerUrl] = useState(
    initialChannel?.bannerUrl || 
    PRESET_BANNERS[0]
  );
  const [youtubeLink, setYoutubeLink] = useState(initialChannel?.socialLinks?.youtube || '');
  const [instagramLink, setInstagramLink] = useState(initialChannel?.socialLinks?.instagram || '');
  const [websiteLink, setWebsiteLink] = useState(initialChannel?.socialLinks?.website || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('Avatar file is too large (max 3MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('Banner file is too large (max 4MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a channel name.');
      return;
    }
    const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    if (cleanHandle.length < 3) {
      setError('Please enter a valid channel handle (e.g. @techdeals).');
      return;
    }

    const channel: CreatorChannel = {
      id: initialChannel?.id || `chan-${currentUser.id}`,
      ownerId: currentUser.id,
      name: name.trim(),
      username: cleanHandle,
      handle: cleanHandle,
      description: bio.trim(),
      bio: bio.trim(),
      logo: avatarUrl.trim() || PRESET_AVATARS[0],
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0],
      banner: bannerUrl.trim() || PRESET_BANNERS[0],
      bannerUrl: bannerUrl.trim() || PRESET_BANNERS[0],
      category,
      channelType: 'Creator',
      country: 'India',
      language: 'English',
      contactEmail: currentUser.email || '',
      status: 'active',
      followersCount: initialChannel?.followersCount || initialChannel?.followerCount || 0,
      followerCount: initialChannel?.followerCount || 0,
      views: initialChannel?.views || initialChannel?.totalViews || 0,
      totalClicks: initialChannel?.totalClicks || 0,
      totalViews: initialChannel?.totalViews || 0,
      verified: true,
      createdAt: initialChannel?.createdAt || new Date().toISOString(),
      socialLinks: {
        youtube: youtubeLink.trim() || undefined,
        instagram: instagramLink.trim() || undefined,
        website: websiteLink.trim() || undefined,
      },
    };

    onCreateChannel(channel);
    onClose();
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
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                {isEditing ? 'Customize Your Channel' : 'Create Your Seller Channel'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing 
                  ? 'Update your YouTube-style channel banner, logo, and links' 
                  : 'You must have a channel before listing & selling affiliate products'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Channel Preview Card (YouTube Style) */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
            <span>LIVE CHANNEL HEADER PREVIEW</span>
            <span className="text-[10px] text-indigo-600 font-bold">YouTube Style</span>
          </div>
          
          {/* Banner Preview */}
          <div className="relative h-24 sm:h-28 w-full bg-slate-900 overflow-hidden">
            <img 
              src={bannerUrl} 
              alt="Banner Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {/* Profile Header Preview */}
          <div className="p-4 pt-0 relative flex items-end gap-3.5 -mt-6">
            <img 
              src={avatarUrl} 
              alt="Channel Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white shadow-md object-cover bg-white shrink-0"
            />
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                  {name || 'Channel Name'}
                </span>
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">
                  ✓
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {handle || '@channel'} · 0 followers · 0 products
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Geeky Gadgets & Deals"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Handle *
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. @geekygadgets"
                required
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Category & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
              >
                <option value="Electronics & Tech">Electronics & Tech</option>
                <option value="Comics & Graphic Novels">Comics & Graphic Novels</option>
                <option value="Gaming & Consoles">Gaming & Consoles</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Home & Lifestyle">Home & Lifestyle</option>
                <option value="Audio & Headphones">Audio & Headphones</option>
                <option value="Fitness & Outdoors">Fitness & Outdoors</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Bio / Description
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Tell followers what deals, unboxings, and reviews you share..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Channel Logo / Avatar Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Channel Logo / Avatar
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    avatarUrl === url ? 'border-indigo-600 scale-105 shadow-sm' : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Or paste custom logo URL..."
                className="flex-1 min-w-[140px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* Channel Banner Cover Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Channel Banner Cover (YouTube Style)
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>Upload Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {PRESET_BANNERS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setBannerUrl(url)}
                  className={`h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    bannerUrl === url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:opacity-90'
                  }`}
                >
                  <img src={url} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Social Links (Optional) */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Creator Social Links (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
                <input
                  type="text"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="YouTube Channel URL"
                  className="bg-transparent w-full outline-none text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                <input
                  type="text"
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  placeholder="Instagram @handle or URL"
                  className="bg-transparent w-full outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isEditing ? 'Save Channel Changes' : 'Create Channel & Start Selling'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
