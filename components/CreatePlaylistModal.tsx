import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X } from 'lucide-react';

const CreatePlaylistModal: React.FC = () => {
    const { isCreatePlaylistModalOpen, closeCreatePlaylistModal, createPlaylist, tracksToAddToPlaylist } = useLibrary();
    const [playlistName, setPlaylistName] = useState('');

    if (!isCreatePlaylistModalOpen) return null;

    const handleCreate = () => {
        if (playlistName.trim()) {
            createPlaylist(playlistName, tracksToAddToPlaylist || []);
            setPlaylistName('');
            closeCreatePlaylistModal();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={closeCreatePlaylistModal}>
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">New Playlist</h3>
                    <button onClick={closeCreatePlaylistModal}><X size={20} className="text-neutral-400 hover:text-white" /></button>
                </div>

                <div className="p-6">
                    <input
                        autoFocus
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
                        placeholder="Playlist name"
                        value={playlistName}
                        onChange={e => setPlaylistName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                </div>

                <div className="p-4 bg-neutral-900/50 flex justify-end gap-3">
                    <button
                        onClick={closeCreatePlaylistModal}
                        className="px-4 py-2 bg-neutral-700 text-white font-bold rounded-full hover:bg-neutral-600 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
