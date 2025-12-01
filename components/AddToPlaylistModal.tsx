import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X } from 'lucide-react';
import { api } from '../services/api';

const AddToPlaylistModal: React.FC = () => {
    const { addToPlaylistModalTrack, closeAddToPlaylistModal, playlists, createPlaylist, addToPlaylist } = useLibrary();
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!addToPlaylistModalTrack) return null;

    const handleCreate = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName, [addToPlaylistModalTrack]);
            closeAddToPlaylistModal();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={closeAddToPlaylistModal}>
            <div 
                className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Add to Playlist</h3>
                    <button onClick={closeAddToPlaylistModal}><X size={20} className="text-neutral-400 hover:text-white" /></button>
                </div>
                
                <div className="p-4 flex items-center gap-4 bg-neutral-800/30">
                     <img 
                        src={api.getCoverUrl(addToPlaylistModalTrack.album?.cover, '160')} 
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                    />
                    <div className="overflow-hidden">
                        <div className="font-bold truncate text-white">{addToPlaylistModalTrack.title}</div>
                        <div className="text-sm text-neutral-400 truncate">{addToPlaylistModalTrack.artist?.name}</div>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {playlists.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => {
                                addToPlaylist(p.id, addToPlaylistModalTrack);
                                closeAddToPlaylistModal();
                            }}
                            className="w-full text-left p-3 hover:bg-neutral-800 rounded-lg flex items-center gap-3 transition group"
                        >
                            <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center rounded overflow-hidden">
                                {p.tracks.length > 0 && p.tracks[0].album?.cover ? (
                                     <img src={api.getCoverUrl(p.tracks[0].album.cover, '80')} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xs text-neutral-500">List</div> 
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-white group-hover:text-white">{p.name}</div>
                                <div className="text-xs text-neutral-500">{p.tracks.length} tracks</div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-neutral-800">
                    {!isCreating ? (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="w-full py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition"
                        >
                            New Playlist
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 text-sm text-white focus:outline-none focus:border-white"
                                placeholder="Playlist name"
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <button onClick={handleCreate} className="px-4 bg-white text-black font-bold rounded hover:bg-neutral-200">Add</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default AddToPlaylistModal;