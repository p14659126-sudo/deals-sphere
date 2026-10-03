import React from 'react';
import { CreatorChannel, UserAccount } from '../types';
import { 
  Tv, 
  Users, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Video, 
  ArrowRight, 
  Tag, 
  Plus, 
  Search 
} from 'lucide-react';
import { formatSocialCount } from '../utils/video';

interface Props {
  channels: CreatorChannel[];
  currentUser: UserAccount | null;
  followedChannelIds: Set<string>;
  onToggleFollow: (channel: CreatorChannel) => void;
  onSelectChannel: (channel: CreatorChannel) => void;
  onCreateChannel: () => void;
  userChannel: CreatorChannel | null;
}

export const ChannelsDirectoryView: React.FC<Props> = ({
  channels,
  currentUser,
  followedChannelIds,
  onToggleFollow,
  onSelectChannel,
  onCreateChannel,
  userChannel,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const filteredChannels = channels.filter((c) => {
    if (selectedCategory !== 'all' && c.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.handle || c.username || '').toLowerCase().includes(q) ||
        (c.bio || c.description || '').toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left pb-16">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>Creator Hub</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Discover Creator Channels
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore YouTube-style channels by verified deal curators, unboxers, and reviewers. Follow your favorite sellers to stay updated on the best discounts.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {userChannel ? (
              <button
                onClick={() => onSelectChannel(userChannel)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-full text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4 text-indigo-600" />
                <span>Go to My Channel</span>
              </button>
            ) : (
              <button
                onClick={onCreateChannel}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Channel to Sell</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels by name, handle, or niche..."
            className="w-full pl-9 pr-4 py-2 bg-white text-xs text-slate-900 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold self-start sm:self-center">
          {filteredChannels.length} {filteredChannels.length === 1 ? 'channel found' : 'channels found'}
        </div>
      </div>

      {/* Channels Grid (Instagram + YouTube style cards) */}
      {filteredChannels.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Tv className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900">No channels found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery 
              ? 'Try modifying your search query or view all channels.' 
              : 'Be the first creator to launch your affiliate channel on DealSphere!'}
          </p>
          {!userChannel && (
            <button
              onClick={onCreateChannel}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all"
            >
              Create Your Channel Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredChannels.map((chan) => {
            const isFollowing = followedChannelIds.has(chan.id);
            return (
              <div
                key={chan.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Channel Banner Header */}
                  <div 
                    onClick={() => onSelectChannel(chan)}
                    className="relative h-28 w-full bg-slate-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={chan.bannerUrl}
                      alt={chan.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    <span className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold">
                      {chan.category}
                    </span>
                  </div>

                  {/* Channel Identity */}
                  <div className="p-4 pt-0 relative">
                    <div className="flex items-end justify-between -mt-7 mb-3">
                      <img
                        onClick={() => onSelectChannel(chan)}
                        src={chan.avatarUrl}
                        alt={chan.name}
                        className="w-14 h-14 rounded-2xl border-2 border-white shadow-md object-cover bg-white cursor-pointer"
                      />

                      {/* Instagram-style Follow Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollow(chan);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                          isFollowing
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div 
                      onClick={() => onSelectChannel(chan)}
                      className="cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {chan.name}
                        </h3>
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                          ✓
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium">
                        {chan.handle || chan.username} · <span className="font-semibold text-slate-800">{formatSocialCount(chan.followerCount ?? chan.followersCount ?? 0)} followers</span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                        {chan.bio}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action to Visit Channel */}
                <div 
                  onClick={() => onSelectChannel(chan)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 cursor-pointer transition-colors"
                >
                  <span>Visit Channel &amp; Deals</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
