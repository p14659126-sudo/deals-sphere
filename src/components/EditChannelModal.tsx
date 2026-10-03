import React, { useState, useEffect } from 'react';
import { Channel, UserAccount } from '../types';
import { 
  X, 
  Store, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Globe, 
  Instagram, 
  Youtube, 
  Twitter, 
  Mail, 
  Phone,
  FileText,
  Save,
  AtSign
} from 'lucide-react';
import { updateChannel, validateUsername, isUsernameTaken } from '../services/channelService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  currentUser: UserAccount;
  onChannelUpdated: (updatedChannel: Channel) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORIES = [
  'General Deals & Tech',
  'Electronics & Gadgets',
  'Comics & Collectibles',
  'Fashion & Lifestyle',
  'Home & Smart Living',
  'Beauty & Wellness',
  'Fitness & Outdoor',
  'Books & Graphic Novels',
  'Gaming & Esports',
  'Curated Finds'
];

export const EditChannelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  channel,
  currentUser,
  onChannelUpdated,
  onShowToast,
}) => {
  const [name, setName] = useState(channel.name);
  const [username, setUsername] = useState(channel.username);
  const [tagline, setTagline] = useState(channel.tagline || '');
  const [description, setDescription] = useState(channel.description);
  const [logo, setLogo] = useState(channel.logo);
  const [banner, setBanner] = useState(channel.banner || '');
  const [category, setCategory] = useState(channel.category || CATEGORIES[0]);
  const [contactEmail, setContactEmail] = useState(channel.contactEmail || currentUser.email);
  const [websiteUrl, setWebsiteUrl] = useState(channel.websiteUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(channel.instagramUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(channel.youtubeUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(channel.twitterUrl || '');
  const [businessName, setBusinessName] = useState(channel.businessName || '');
  const [sellerContact, setSellerContact] = useState(channel.sellerContact || '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setUsername(channel.username);
      setTagline(channel.tagline || '');
      setDescription(channel.description);
      setLogo(channel.logo);
      setBanner(channel.banner || '');
      setCategory(channel.category);
      setContactEmail(channel.contactEmail || currentUser.email);
      setWebsiteUrl(channel.websiteUrl || '');
      setInstagramUrl(channel.instagramUrl || '');
      setYoutubeUrl(channel.youtubeUrl || '');
      setTwitterUrl(channel.twitterUrl || '');
      setBusinessName(channel.businessName || '');
      setSellerContact(channel.sellerContact || '');
    }
    setError(null);
  }, [channel, isOpen, currentUser.email]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (!cleanName) {
      setError('Channel name is required.');
      return;
    }

    const valResult = validateUsername(cleanUsername);
    if (!valResult.isValid) {
      setError(valResult.error || 'Invalid @handle format.');
      return;
    }

    setIsSaving(true);

    try {
      if (cleanUsername !== channel.username.toLowerCase()) {
        const taken = await isUsernameTaken(cleanUsername, channel.id);
        if (taken) {
          setError(`The handle @${cleanUsername} is already taken by another creator. Please pick another.`);
          setIsSaving(false);
          return;
        }
      }

      const updates: Partial<Channel> = {
        name: cleanName,
        username: cleanUsername,
        handle: cleanUsername,
        tagline: tagline.trim(),
        description: description.trim(),
        logo: logo.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        banner: banner.trim() || undefined,
        category,
        contactEmail: contactEmail.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        businessName: businessName.trim() || undefined,
        sellerContact: sellerContact.trim() || undefined,
      };

      await updateChannel(channel.id, updates);

      const updatedChannel: Channel = {
        ...channel,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      onChannelUpdated(updatedChannel);
      onShowToast(`Channel @${cleanUsername} updated successfully!`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error updating channel.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 text-left">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Customize Channel
              </h3>
              <p className="text-[11px] text-slate-500">
                Edit branding, handle, description, and social links
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Channel Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Channel Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Smart Shopping India"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
                required
                maxLength={45}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Unique @Handle *</span>
                <span className="text-[10px] text-slate-400">/channel/@handle</span>
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="techdeals"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs font-mono text-indigo-700"
                  required
                  maxLength={30}
                />
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Channel Tagline / Catchphrase</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Daily verified tech deals, gadget reviews & honest savings"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Channel Description / About</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell visitors what kind of products, deals, and videos you curate..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs leading-relaxed"
              required
            />
          </div>

          {/* Branding: Logo & Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Profile Picture / Logo URL</label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://.../logo.png"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Banner Image URL</label>
              <input
                type="url"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://.../banner.jpg"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Primary Channel Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Social Links */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 block">Creator Social Links</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="Website URL"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="relative">
                <Youtube className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="YouTube Channel URL"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="relative">
                <Instagram className="w-4 h-4 text-pink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="Instagram profile URL"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="relative">
                <Twitter className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="X / Twitter URL"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Contact / Business Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Support Contact / WhatsApp</label>
              <input
                type="text"
                value={sellerContact}
                onChange={(e) => setSellerContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Channel Changes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
