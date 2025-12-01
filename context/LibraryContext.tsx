import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPlaylist, Track } from '../types';

interface LibraryContextType {
  playlists: UserPlaylist[];
  createPlaylist: (name: string, tracks?: Track[]) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  getPlaylist: (id: string) => UserPlaylist | undefined;
  addToPlaylistModalTrack: Track | null;
  openAddToPlaylistModal: (track: Track) => void;
  closeAddToPlaylistModal: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [addToPlaylistModalTrack, setAddToPlaylistModalTrack] = useState<Track | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('opentidal_playlists');
    if (saved) {
      setPlaylists(JSON.parse(saved));
    } else {
        // Initial example playlist
        setPlaylists([{
            id: 'liked-songs',
            name: 'Liked Songs',
            tracks: [],
            syncedToGoogle: false
        }]);
    }
  }, []);

  const savePlaylists = (updated: UserPlaylist[]) => {
    setPlaylists(updated);
    localStorage.setItem('opentidal_playlists', JSON.stringify(updated));
  };

  const createPlaylist = (name: string, tracks: Track[] = []) => {
    const newPlaylist: UserPlaylist = {
      id: Date.now().toString(),
      name,
      tracks,
      syncedToGoogle: false
    };
    savePlaylists([...playlists, newPlaylist]);
  };

  const deletePlaylist = (id: string) => {
    if (id === 'liked-songs') return; // Protect default
    savePlaylists(playlists.filter(p => p.id !== id));
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    const updated = playlists.map(p => {
        if (p.id === playlistId) {
            // Check for duplicates if desired, ignoring for now
            // Simple check to avoid adding exact same track ID twice if desired
            if(p.tracks.some(t => t.id === track.id)) return p;
            return { ...p, tracks: [...p.tracks, track] };
        }
        return p;
    });
    savePlaylists(updated);
  };

  const getPlaylist = (id: string) => playlists.find(p => p.id === id);

  const openAddToPlaylistModal = (track: Track) => setAddToPlaylistModalTrack(track);
  const closeAddToPlaylistModal = () => setAddToPlaylistModalTrack(null);

  return (
    <LibraryContext.Provider value={{ 
        playlists, 
        createPlaylist, 
        deletePlaylist, 
        addToPlaylist, 
        getPlaylist,
        addToPlaylistModalTrack,
        openAddToPlaylistModal,
        closeAddToPlaylistModal
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};