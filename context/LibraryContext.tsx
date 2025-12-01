import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserPlaylist, Track } from '../types';
import { googleDriveService } from '../services/googleDrive';

interface LibraryContextType {
  playlists: UserPlaylist[];
  createPlaylist: (name: string, tracks?: Track[]) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  getPlaylist: (id:string) => UserPlaylist | undefined;
  syncPlaylistToGoogle: (playlistId: string) => Promise<void>;
  syncAllPlaylistsToGoogle: () => Promise<void>;
  loadPlaylistsFromGoogle: () => Promise<void>;
  addToPlaylistModalTrack: Track | null;
  openAddToPlaylistModal: (track: Track) => void;
  closeAddToPlaylistModal: () => void;
  playlistToDelete: UserPlaylist | null;
  openDeleteModal: (playlist: UserPlaylist) => void;
  closeDeleteModal: () => void;
  isCreatePlaylistModalOpen: boolean;
  tracksToAddToPlaylist: Track[] | null;
  openCreatePlaylistModal: (tracks?: Track[]) => void;
  closeCreatePlaylistModal: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [addToPlaylistModalTrack, setAddToPlaylistModalTrack] = useState<Track | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<UserPlaylist | null>(null);
  const [isCreatePlaylistModalOpen, setCreatePlaylistModalOpen] = useState(false);
  const [tracksToAddToPlaylist, setTracksToAddToPlaylist] = useState<Track[] | null>(null);
  const isUserLoggedInRef = React.useRef(false);

  // Check if user is logged in
  useEffect(() => {
    const checkUserLogin = () => {
      const user = localStorage.getItem('opentidal_user');
      isUserLoggedInRef.current = !!user;
    };
    checkUserLogin();
    // Listen for user login/logout changes
    window.addEventListener('storage', checkUserLogin);
    return () => window.removeEventListener('storage', checkUserLogin);
  }, []);

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

  const autoSyncPlaylist = async (playlist: UserPlaylist) => {
    if (!isUserLoggedInRef.current) return;

    try {
      await googleDriveService.savePlaylist(playlist);
      console.log(`Playlist ""${playlist.name}"" auto-synced to Google Drive`);
    } catch (error) {
      console.error('Failed to auto-sync playlist to Google Drive:', error);
    }
  };

  const syncPlaylistToGoogle = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    try {
      await googleDriveService.savePlaylist(playlist);
      // Mark as synced
      const updated = playlists.map(p => 
        p.id === playlistId ? { ...p, syncedToGoogle: true } : p
      );
      setPlaylists(updated);
      localStorage.setItem('opentidal_playlists', JSON.stringify(updated));
      console.log(`Playlist ""${playlist.name}"" synced to Google Drive`);
    } catch (error) {
      console.error('Failed to sync playlist to Google Drive:', error);
      throw error;
    }
  };

  const loadPlaylistsFromGoogle = async () => {
    try {
      const { playlists: googlePlaylists, success } = await googleDriveService.loadAllPlaylists();
      
      if (!success || googlePlaylists.length === 0) {
        console.log('No playlists found on Google Drive');
        return;
      }

      // Keep all current local playlists and only add new ones from Google Drive
      const playlistMap = new Map(playlists.map(p => [p.name, p]));

      // Add Google playlists, but don't override existing ones with same name
      let newCount = 0;
      googlePlaylists.forEach(gPlaylist => {
        if (!playlistMap.has(gPlaylist.name)) {
          playlistMap.set(gPlaylist.name, gPlaylist);
          newCount++;
        }
      });

      if (newCount > 0) {
        const merged = Array.from(playlistMap.values());
        setPlaylists(merged);
        localStorage.setItem('opentidal_playlists', JSON.stringify(merged));
        console.log(`Loaded ${newCount} new playlists from Google Drive`);
      }
    } catch (error) {
      console.error('Failed to load playlists from Google Drive:', error);
    }
  };

  const syncAllPlaylistsToGoogle = async () => {
    try {
      console.log(`Syncing ${playlists.length} playlists to Google Drive...`);
      let syncedCount = 0;

      for (const playlist of playlists) {
        if (playlist.id !== 'liked-songs' || playlist.tracks.length > 0) {
          try {
            await googleDriveService.savePlaylist(playlist);
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync playlist ""${playlist.name}"":`, error);
          }
        }
      }

      // Mark all playlists as synced
      const updated = playlists.map(p => ({ ...p, syncedToGoogle: true }));
      setPlaylists(updated);
      localStorage.setItem('opentidal_playlists', JSON.stringify(updated));
      console.log(`Successfully synced ${syncedCount} playlists to Google Drive`);
    } catch (error) {
      console.error('Failed to sync playlists to Google Drive:', error);
      throw error;
    }
  };

  const createPlaylist = (name: string, tracks: Track[] = []) => {
    const newPlaylist: UserPlaylist = {
      id: Date.now().toString(),
      name,
      tracks,
      syncedToGoogle: false
    };
    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    localStorage.setItem('opentidal_playlists', JSON.stringify(updatedPlaylists));
    autoSyncPlaylist(newPlaylist);
  };

  const deletePlaylist = async (id: string) => {
    if (id === 'liked-songs') return; // Protect default

    const playlistToDelete = playlists.find(p => p.id === id);
    if (!playlistToDelete) return;

    try {
      // First, delete from Google Drive
      await googleDriveService.deletePlaylist(playlistToDelete.name);
      console.log(`Playlist ""${playlistToDelete.name}"" deleted from Google Drive.`);

      // Then, remove from local state
      const updatedPlaylists = playlists.filter(p => p.id !== id);
      setPlaylists(updatedPlaylists);
      localStorage.setItem('opentidal_playlists', JSON.stringify(updatedPlaylists));
    } catch (error) {
      console.error(`Failed to delete playlist ""${playlistToDelete.name}"" from Google Drive:`, error);
      // Optional: Decide if you still want to remove it locally or handle the error differently
    }
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    let playlistToSync: UserPlaylist | null = null;
    const updatedPlaylists = playlists.map(p => {
        if (p.id === playlistId) {
            // Check for duplicates
            if(p.tracks.some(t => t.id === track.id)) return p;
            // Keep syncedToGoogle status and just update tracks
            const updatedPlaylist = { ...p, tracks: [...p.tracks, track], syncedToGoogle: p.syncedToGoogle };
            playlistToSync = updatedPlaylist;
            return updatedPlaylist;
        }
        return p;
    });
    setPlaylists(updatedPlaylists);
    localStorage.setItem('opentidal_playlists', JSON.stringify(updatedPlaylists));
    if (playlistToSync) {
      autoSyncPlaylist(playlistToSync);
    }
  };

  const getPlaylist = (id: string) => playlists.find(p => p.id === id);

  const openAddToPlaylistModal = (track: Track) => setAddToPlaylistModalTrack(track);
  const closeAddToPlaylistModal = () => setAddToPlaylistModalTrack(null);

  const openDeleteModal = (playlist: UserPlaylist) => setPlaylistToDelete(playlist);
  const closeDeleteModal = () => setPlaylistToDelete(null);

  const openCreatePlaylistModal = (tracks?: Track[]) => {
    setTracksToAddToPlaylist(tracks || null);
    setCreatePlaylistModalOpen(true);
  };
  const closeCreatePlaylistModal = () => {
    setTracksToAddToPlaylist(null);
    setCreatePlaylistModalOpen(false);
  }

  return (
    <LibraryContext.Provider value={{ 
        playlists, 
        createPlaylist, 
        deletePlaylist, 
        addToPlaylist, 
        getPlaylist,
        syncPlaylistToGoogle,
        syncAllPlaylistsToGoogle,
        loadPlaylistsFromGoogle,
        addToPlaylistModalTrack,
        openAddToPlaylistModal,
        closeAddToPlaylistModal,
        playlistToDelete,
        openDeleteModal,
        closeDeleteModal,
        isCreatePlaylistModalOpen,
        tracksToAddToPlaylist,
        openCreatePlaylistModal,
        closeCreatePlaylistModal
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