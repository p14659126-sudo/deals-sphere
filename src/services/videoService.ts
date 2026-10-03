import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  increment 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { ChannelVideo } from '../types';

const VIDEOS_CACHE_KEY = 'ds_videos_cache';

function getLocalVideos(): ChannelVideo[] {
  try {
    const raw = localStorage.getItem(VIDEOS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalVideos(list: ChannelVideo[]) {
  try {
    localStorage.setItem(VIDEOS_CACHE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error setting local videos cache:', err);
  }
}

export function generateVideoId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `vid_${rand}`;
}

export async function getAllPublicVideos(): Promise<ChannelVideo[]> {
  const local = getLocalVideos();
  try {
    const q = query(collection(db, 'videos'), where('visibility', '==', 'public'));
    const snapshot = await getDocs(q);
    const firestoreVideos: ChannelVideo[] = [];
    snapshot.forEach((d) => {
      firestoreVideos.push(d.data() as ChannelVideo);
    });

    const map = new Map<string, ChannelVideo>();
    local.filter((v) => v.visibility === 'public').forEach((v) => map.set(v.id, v));
    firestoreVideos.forEach((v) => map.set(v.id, v));
    const combined = Array.from(map.values());
    setLocalVideos(combined);
    return combined;
  } catch (err) {
    return local.filter((v) => v.visibility === 'public');
  }
}

export async function getVideosByChannel(channelId: string): Promise<ChannelVideo[]> {
  const local = getLocalVideos().filter((v) => v.channelId === channelId);
  try {
    const q = query(collection(db, 'videos'), where('channelId', '==', channelId));
    const snapshot = await getDocs(q);
    const remote: ChannelVideo[] = [];
    snapshot.forEach((d) => remote.push(d.data() as ChannelVideo));
    const map = new Map<string, ChannelVideo>();
    local.forEach((v) => map.set(v.id, v));
    remote.forEach((v) => map.set(v.id, v));
    return Array.from(map.values());
  } catch {
    return local;
  }
}

export async function getVideosByOwner(ownerId: string): Promise<ChannelVideo[]> {
  const local = getLocalVideos().filter((v) => v.ownerId === ownerId);
  try {
    const q = query(collection(db, 'videos'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const remote: ChannelVideo[] = [];
    snapshot.forEach((d) => remote.push(d.data() as ChannelVideo));
    const map = new Map<string, ChannelVideo>();
    local.forEach((v) => map.set(v.id, v));
    remote.forEach((v) => map.set(v.id, v));
    return Array.from(map.values());
  } catch {
    return local;
  }
}

export async function createVideo(
  videoData: Omit<ChannelVideo, 'id' | 'views' | 'likes' | 'createdAt'> & { id?: string }
): Promise<ChannelVideo> {
  const videoId = videoData.id || generateVideoId();
  const now = new Date().toISOString();

  const newVideo: ChannelVideo = {
    ...videoData,
    id: videoId,
    views: 0,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };

  const local = getLocalVideos();
  setLocalVideos([newVideo, ...local.filter((v) => v.id !== videoId)]);

  try {
    await setDoc(doc(db, 'videos', videoId), newVideo);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `videos/${videoId}`);
  }

  return newVideo;
}

export async function updateVideo(videoId: string, updates: Partial<ChannelVideo>): Promise<void> {
  const now = new Date().toISOString();
  const merged = { ...updates, updatedAt: now };

  const local = getLocalVideos();
  setLocalVideos(local.map((v) => (v.id === videoId ? { ...v, ...merged } : v)));

  try {
    await updateDoc(doc(db, 'videos', videoId), merged);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  const local = getLocalVideos();
  setLocalVideos(local.filter((v) => v.id !== videoId));

  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `videos/${videoId}`);
  }
}

export async function recordVideoView(videoId: string): Promise<void> {
  const local = getLocalVideos();
  setLocalVideos(
    local.map((v) => (v.id === videoId ? { ...v, views: (v.views || 0) + 1 } : v))
  );

  try {
    await updateDoc(doc(db, 'videos', videoId), {
      views: increment(1),
    });
  } catch {
    //
  }
}
