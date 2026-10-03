import React, { useState, useEffect } from 'react';
import { ChannelVideo, MarketProduct, Channel, UserAccount, VideoVisibility, PLAN_LIMITS } from '../types';
import { 
  X, 
  Video, 
  Upload, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  ShoppingBag, 
  Image as ImageIcon, 
  Eye, 
  Tag, 
  Link2, 
  AlertCircle,
  Play,
  Lock,
  Globe,
  FileText
} from 'lucide-react';
import { createVideo, updateVideo, deleteVideo } from '../services/videoService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  currentChannel: Channel | null;
  products: MarketProduct[];
  editingVideo?: ChannelVideo | null;
  totalUserVideosCount?: number;
  onVideoSaved: (video: ChannelVideo) => void;
  onVideoDeleted?: (videoId: string) => void;
  onShowToast: (msg: string) => void;
}

const VIDEO_CATEGORIES = [
  'Tech Reviews & Unboxing',
  'Shopping Hauls & Try-On',
  'Top 5 / Best Of Recommendations',
  'Gadgets & Lifestyle',
  'Fashion & Styling',
  'Budget Buying Guides',
  'Comics & Pop Culture',
  'Deals & Bargain Hunting',
  'Other'
];

export const UploadVideoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  currentChannel,
  products,
  editingVideo,
  totalUserVideosCount = 0,
  onVideoSaved,
  onVideoDeleted,
  onShowToast,
}) => {
  const [title, setTitle] = useState(editingVideo?.title || '');
  const [description, setDescription] = useState(editingVideo?.description || '');
  const [videoUrl, setVideoUrl] = useState(editingVideo?.videoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(editingVideo?.thumbnailUrl || '');
  const [category, setCategory] = useState(editingVideo?.category || VIDEO_CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState((editingVideo?.keywords || []).join(', '));
  const [affiliateLink, setAffiliateLink] = useState(editingVideo?.affiliateLink || '');
  const [visibility, setVisibility] = useState<VideoVisibility>(editingVideo?.visibility || 'public');
  const [attachedProductIds, setAttachedProductIds] = useState<string[]>(editingVideo?.attachedProductIds || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Plan limits check
  const plan = currentUser.subscriptionPlan || 'free';
  const limits = PLAN_LIMITS[plan];
  const isVideoLimitReached = !editingVideo && totalUserVideosCount >= limits.maxVideos;

  useEffect(() => {
    if (editingVideo) {
      setTitle(editingVideo.title);
      setDescription(editingVideo.description);
      setVideoUrl(editingVideo.videoUrl);
      setThumbnailUrl(editingVideo.thumbnailUrl);
      setCategory(editingVideo.category);
      setTagsInput((editingVideo.keywords || []).join(', '));
      setAffiliateLink(editingVideo.affiliateLink || '');
      setVisibility(editingVideo.visibility);
      setAttachedProductIds(editingVideo.attachedProductIds || []);
    } else {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setThumbnailUrl('');
      setCategory(VIDEO_CATEGORIES[0]);
      setTagsInput('');
      setAffiliateLink('');
      setVisibility('public');
      setAttachedProductIds([]);
    }
    setError(null);
  }, [editingVideo, isOpen]);

  if (!isOpen) return null;

  const handleToggleProduct = (productId: string) => {
    setAttachedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleGenerateTags = () => {
    if (!title.trim()) {
      setError('Please enter a video title first to generate tags.');
      return;
    }
    const clean = title.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
    const generated = [
      title.toLowerCase().slice(0, 30),
      category.toLowerCase(),
      `${clean[0] || 'deal'} review`,
      'dealsphere',
      'affiliate deals',
      'best buys',
    ];
    setTagsInput(Array.from(new Set(generated)).join(', '));
    onShowToast('✨ Generated video tags based on title and category!');
  };

  const handleSave = async (targetVisibility: VideoVisibility) => {
    if (!currentChannel) {
      setError('Please create a channel first before uploading videos.');
      return;
    }
    if (!title.trim()) {
      setError('Video title is required.');
      return;
    }
    if (!videoUrl.trim()) {
      setError('Video URL or link is required.');
      return;
    }

    if (isVideoLimitReached) {
      setError(`You have reached the video upload limit for the ${limits.name} (${limits.maxVideos} videos). Upgrade your plan to upload more!`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const keywords = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Fallback thumbnail if none supplied
    let finalThumbnail = thumbnailUrl.trim();
    if (!finalThumbnail) {
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const idMatch = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.exec(videoUrl);
        if (idMatch && idMatch[1]) {
          finalThumbnail = `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`;
        }
      }
      if (!finalThumbnail) {
        finalThumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      }
    }

    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, {
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: finalThumbnail,
          category,
          keywords,
          attachedProductIds,
          affiliateLink: affiliateLink.trim() || undefined,
          visibility: targetVisibility,
        });

        const updated: ChannelVideo = {
          ...editingVideo,
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: finalThumbnail,
          category,
          keywords,
          attachedProductIds,
          affiliateLink: affiliateLink.trim() || undefined,
          visibility: targetVisibility,
          updatedAt: new Date().toISOString(),
        };

        onVideoSaved(updated);
        onShowToast(`Video "${title.slice(0, 24)}..." updated.`);
        onClose();
      } else {
        const created = await createVideo({
          channelId: currentChannel.id,
          channelUsername: currentChannel.username,
          channelName: currentChannel.name,
          channelLogo: currentChannel.logo,
          ownerId: currentUser.id,
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          thumbnailUrl: finalThumbnail,
          category,
          keywords,
          attachedProductIds,
          affiliateLink: affiliateLink.trim() || undefined,
          visibility: targetVisibility,
        });

        onVideoSaved(created);
        onShowToast(`Video "${title.slice(0, 24)}..." published to @${currentChannel.username}!`);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingVideo) return;
    if (window.confirm(`Are you sure you want to delete video "${editingVideo.title}"?`)) {
      try {
        await deleteVideo(editingVideo.id);
        if (onVideoDeleted) onVideoDeleted(editingVideo.id);
        onShowToast('Video deleted.');
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to delete video.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 text-left flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                {editingVideo ? 'Edit Channel Video' : 'Upload Video to Channel'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Channel: <strong className="text-slate-800">@{currentChannel?.username || 'None'}</strong> • {limits.name} ({totalUserVideosCount}/{limits.maxVideos} videos)
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {isVideoLimitReached && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <p className="font-bold">Video allowance limit reached</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                The Free plan allows up to 3 videos. Upgrade to <strong>Pro</strong> (50 videos) or <strong>Ultimate</strong> (Unlimited) to continue uploading!
              </p>
            </div>
          )}

          {/* Video URL */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Video Link / URL *</span>
              <span className="text-[10px] text-slate-400">YouTube, MP4, Vimeo, WebM</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none text-xs"
              />
            </div>
          </div>

          {/* Video Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Video Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Best 5 Budget Earbuds Under ₹2,000 (Detailed Comparison)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none text-xs"
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Explain the highlights, what's featured, and why buyers should check out these deals..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Thumbnail Image URL</span>
              <span className="text-[10px] text-slate-400">Auto-detected from YouTube if empty</span>
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://.../thumbnail.jpg"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none text-xs"
              />
            </div>
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs bg-white"
              >
                {VIDEO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VideoVisibility)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs bg-white"
              >
                <option value="public">🌐 Public (Visible on Channel & Search)</option>
                <option value="unlisted">🔗 Unlisted (Only via link)</option>
                <option value="private">🔒 Private (Only you)</option>
                <option value="draft">📝 Draft</option>
              </select>
            </div>
          </div>

          {/* Keywords / Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Search Keywords & Tags</label>
              <button
                type="button"
                onClick={handleGenerateTags}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>AI Auto-Generate</span>
              </button>
            </div>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="earbuds, electronics, best deals, unboxing (comma separated)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
            />
          </div>

          {/* ATTACH DEAL SPHERE PRODUCTS (The Core Connection) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Attach Deal Sphere Products to this Video</span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {attachedProductIds.length} attached
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              When viewers watch this video, these products appear right underneath with instant <strong>"View Deal"</strong> buttons.
            </p>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 p-1">
              {products.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No products in your catalog yet. You can upload products first!
                </div>
              ) : (
                products.map((p) => {
                  const isSelected = attachedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProduct(p.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-bold text-slate-700">{p.currency}{p.price}</span>
                            <span>•</span>
                            <span>{p.merchant || 'Store'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Optional Creator Direct Affiliate Link */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Creator Affiliate Destination Link (Optional)</span>
              <span className="text-[10px] text-slate-400">Direct deal / store affiliate link</span>
            </label>
            <input
              type="url"
              value={affiliateLink}
              onChange={(e) => setAffiliateLink(e.target.value)}
              placeholder="https://amzn.to/... or https://affiliate.example.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-xs"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          {editingVideo ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Video</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={isSubmitting || isVideoLimitReached}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSave('public')}
              disabled={isSubmitting || isVideoLimitReached}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{editingVideo ? 'Save Changes' : 'Publish Video'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
