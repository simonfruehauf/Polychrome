import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { Play, Trash2, ListMusic, Cloud, CloudCheck, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

import LazyImage from '../components/LazyImage';

const Library: React.FC = () => {
    const { playlists, openDeleteModal, openCreatePlaylistModal, syncPlaylistToGoogle } = useLibrary();
    const { playTrack, userQueue, contextQueue, contextIndex } = usePlayer();
    const { showToast } = useToast();
    const [syncingId, setSyncingId] = React.useState<string | null>(null);

    // A simple function to create a playlist from current queue
    const createPlaylistFromQueue = () => {
        // combine userQueue and remaining contextQueue
        const remainingContext = contextQueue.slice(contextIndex + 1);
        const combined = [...userQueue, ...remainingContext];
        
        if (combined.length === 0) {
            showToast("Queue is empty!");
            return;
        }
        openCreatePlaylistModal(combined);
    };

    const handleSyncPlaylist = async (playlistId: string) => {
        setSyncingId(playlistId);
        try {
            await syncPlaylistToGoogle(playlistId);
            const playlist = playlists.find(p => p.id === playlistId);
            showToast(`✓ "${playlist?.name}" synced to Google Drive`);
        } catch (error) {
            showToast('Failed to sync playlist');
            console.error(error);
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Your Library</h1>
                <button 
                    onClick={createPlaylistFromQueue}
                    className="bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition"
                >
                    Save Current Queue
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map(playlist => (
                    <div key={playlist.id} className="bg-neutral-800/40 p-5 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition group relative">
                        <Link to={`/playlist/${playlist.id}`} className="block">
                            <div className="relative aspect-square bg-neutral-900 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                                {playlist.tracks.length > 0 && playlist.tracks[0].album?.cover ? (
                                    <LazyImage src={api.getCoverUrl(playlist.tracks[0].album.cover, '640')} className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition" />
                                ) : (
                                    <ListMusic size={48} className="text-neutral-700" />
                                )}
                            </div>
                            
                            <h3 className="font-bold text-lg truncate flex items-center gap-2">
                                {playlist.name}
                                {playlist.syncedToGoogle && (
                                    <CheckCircle size={16} className="text-green-400 shrink-0" title="Synced to Google Drive" />
                                )}
                            </h3>
                            <p className="text-sm text-neutral-400">{playlist.tracks.length} tracks</p>
                        </Link>
                        
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                             <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(playlist.tracks.length > 0) playTrack(playlist.tracks[0]);
                                }}
                                className="bg-green-500 rounded-full p-4 shadow-xl hover:scale-110 transition"
                            >
                                <Play fill="black" className="text-black ml-1" />
                             </button>
                        </div>
                        
<button onClick={() => openDeleteModal(playlist)} className="p-2 text-neutral-400 hover:text-white transition">
    <Trash2 size={16} />
</button>

                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                handleSyncPlaylist(playlist.id);
                            }}
                            disabled={syncingId === playlist.id}
                            className="absolute bottom-7 right-7 p-2 bg-black/50 rounded-full text-neutral-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                            title={playlist.syncedToGoogle ? "Synced to Google Drive" : "Sync to Google Drive"}
                        >
                            {syncingId === playlist.id ? (
                                <Cloud size={16} className="text-blue-400 animate-sync-pulse" />
                            ) : playlist.syncedToGoogle ? (
                                <CloudCheck size={16} className="text-green-400 animate-sync-check" />
                            ) : (
                                <Cloud size={16} />
                            )}
                        </button>
                    </div>
                ))}
            </div>
            
            {playlists.length === 0 && (
                <div className="text-center text-neutral-500 mt-20">
                    Your library is empty. Go search for some music!
                </div>
            )}
        </div>
    );
};

export default Library;
