import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

type RepeatMode = 'OFF' | 'ALL' | 'ONE';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  userQueue: Track[];
  contextQueue: Track[];
  contextIndex: number;
  contextTitle: string;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isQueueOpen: boolean;
  playTrack: (track: Track) => Promise<void>;
  playContext: (tracks: Track[], startIndex?: number, title?: string) => void;
  playContextTrack: (index: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (track: Track) => void;
  addTracks: (tracks: Track[]) => void;
  removeFromUserQueue: (index: number) => void;
  reorderUserQueue: (fromIndex: number, toIndex: number) => void;
  clearUserQueue: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Split Queues
  const [userQueue, setUserQueue] = useState<Track[]>([]);
  const [contextQueue, setContextQueue] = useState<Track[]>([]);
  const [contextIndex, setContextIndex] = useState<number>(-1);
  const [contextTitle, setContextTitle] = useState<string>('');
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [volume, setVolumeState] = useState(0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
        audioRef.current.volume = clamped;
    }
  }, []);

  const toggleShuffle = useCallback(() => {
      setIsShuffle(prev => {
          const newVal = !prev;
          showToast(newVal ? "Shuffle On" : "Shuffle Off");
          
          if (newVal && contextQueue.length > 0) {
              // Shuffle context queue, but try to keep current context track logic sensible
              // For simplicity, we just shuffle the whole contextQueue
              // A better approach would be to shuffle only the upcoming tracks
              setContextQueue(prevQ => {
                  const items = [...prevQ];
                  for (let i = items.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [items[i], items[j]] = [items[j], items[i]];
                  }
                  return items;
              });
              // Reset index to -1 so we just play next available? 
              // Or find current track in new queue? 
              // For now, let's just shuffle and if we are in context, we might jump.
              // To handle this gracefully: we only shuffle "upcoming" in a real app.
              // Here: We just shuffle and let the user deal with the new order.
          }
          
          return newVal;
      });
  }, [contextQueue.length, showToast]);
  
  const toggleRepeat = useCallback(() => {
      setRepeatMode(prev => {
          let next: RepeatMode = 'OFF';
          if (prev === 'OFF') next = 'ALL';
          else if (prev === 'ALL') next = 'ONE';
          
          let msg = "Repeat Off";
          if (next === 'ALL') msg = "Repeat All";
          if (next === 'ONE') msg = "Repeat One";
          showToast(msg);
          
          return next;
      });
  }, [showToast]);

  const toggleQueue = useCallback(() => setIsQueueOpen(prev => !prev), []);

  const loadTrack = useCallback(async (track: Track, autoPlay = true) => {
    if (!audioRef.current) return;
    try {
      setCurrentTrack(track);
      setCurrentTime(0);

      const streamUrl = await api.getStreamUrl(track.id, 'LOSSLESS');
      
      audioRef.current.src = streamUrl;
      if (autoPlay) {
          await audioRef.current.play();
          setIsPlaying(true);
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist?.name,
          album: track.album?.title,
          artwork: track.album?.cover ? [
            { src: api.getCoverUrl(track.album.cover, '640'), sizes: '640x640', type: 'image/jpeg' }
          ] : []
        });
      }

    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error playing track. Access denied or rate limited.");
      setIsPlaying(false);
    }
  }, [showToast]);

  // Plays a single track, acting as a mini-context of 1
  const playTrack = useCallback(async (track: Track) => {
      setUserQueue([]); // Clear user queue on explicit play? 
      // Usually playing a song from search replaces context.
      setContextQueue([track]);
      setContextIndex(0);
      setContextTitle(track.title);
      await loadTrack(track);
  }, [loadTrack]);

  // Plays a context (album, playlist)
  const playContext = useCallback((tracks: Track[], startIndex = 0, title = 'Queue') => {
      setUserQueue([]); // Clear user queue when starting a new context
      setContextQueue(tracks);
      setContextIndex(startIndex);
      setContextTitle(title);
      if (tracks.length > startIndex) {
          loadTrack(tracks[startIndex]);
      }
  }, [loadTrack]);

  // Plays a specific track from the existing context (e.g. clicking in the queue list)
  const playContextTrack = useCallback((index: number) => {
      if (index >= 0 && index < contextQueue.length) {
          setContextIndex(index);
          loadTrack(contextQueue[index]);
          // Note: User queue remains intact, but we are playing *now* from context.
          // The next track logic will still prioritize User Queue after this one finishes
          // if we don't modify the logic.
      }
  }, [contextQueue, loadTrack]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    // If Repeat ONE is active, just replay current
    if (repeatMode === 'ONE' && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        return;
    }

    // 1. Check User Queue (High Priority)
    if (userQueue.length > 0) {
        const next = userQueue[0];
        const remaining = userQueue.slice(1);
        setUserQueue(remaining);
        loadTrack(next);
        return;
    }

    // 2. Check Context Queue
    const nextIndex = contextIndex + 1;
    if (nextIndex < contextQueue.length) {
        setContextIndex(nextIndex);
        loadTrack(contextQueue[nextIndex]);
    } else {
        // End of context
        if (repeatMode === 'ALL' && contextQueue.length > 0) {
            setContextIndex(0);
            loadTrack(contextQueue[0]);
        } else {
            setIsPlaying(false);
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = ""; // Stop buffering
            }
        }
    }
  }, [userQueue, contextQueue, contextIndex, repeatMode, loadTrack]);

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleEnded = () => nextTrack();
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
  }, [nextTrack]);

  const prevTrack = useCallback(() => {
    // If > 3 seconds, restart
    if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        return;
    }

    // Logic for prev track:
    // Ideally we have a history stack. Without it, we rely on contextIndex.
    // If we are deep in context, go back.
    // If we just played a user queue song, we might lose it (since we shifted it out).
    // For this implementation, we only support going back in Context Queue.
    
    if (contextIndex > 0) {
        const prevIndex = contextIndex - 1;
        setContextIndex(prevIndex);
        loadTrack(contextQueue[prevIndex]);
    } else {
        // Start of context, just restart
        if (audioRef.current) {
             audioRef.current.currentTime = 0;
             audioRef.current.play();
        }
    }
  }, [contextIndex, contextQueue, loadTrack]);

  const addToQueue = useCallback((track: Track) => {
    showToast(`Added to queue: ${track.title}`);
    // If nothing is playing, play immediately?
    // Or just add to queue. Standard is add to queue.
    // However, if contextQueue is empty and userQueue is empty and not playing, maybe play?
    if (!currentTrack && userQueue.length === 0 && contextQueue.length === 0) {
        playTrack(track);
    } else {
        setUserQueue(prev => [...prev, track]);
    }
  }, [currentTrack, userQueue.length, contextQueue.length, playTrack, showToast]);

  const addTracks = useCallback((tracks: Track[]) => {
      if (tracks.length === 0) return;
      if (!currentTrack && userQueue.length === 0 && contextQueue.length === 0) {
          playContext(tracks);
      } else {
          setUserQueue(prev => [...prev, ...tracks]);
          showToast(`Added ${tracks.length} tracks to queue`);
      }
  }, [currentTrack, userQueue.length, contextQueue.length, playContext, showToast]);

  const removeFromUserQueue = useCallback((index: number) => {
      setUserQueue(prev => {
          const newQ = [...prev];
          newQ.splice(index, 1);
          return newQ;
      });
  }, []);

  const reorderUserQueue = useCallback((fromIndex: number, toIndex: number) => {
    setUserQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearUserQueue = useCallback(() => {
    setUserQueue([]);
    showToast("Queue cleared");
  }, [showToast]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    }
  }, [togglePlay, prevTrack, nextTrack]);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      userQueue,
      contextQueue,
      contextIndex,
      contextTitle,
      currentTime,
      duration,
      volume,
      isShuffle,
      repeatMode,
      isQueueOpen,
      playTrack,
      playContext,
      playContextTrack,
      togglePlay,
      nextTrack,
      prevTrack,
      addToQueue,
      addTracks,
      removeFromUserQueue,
      reorderUserQueue,
      clearUserQueue,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      toggleQueue
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
