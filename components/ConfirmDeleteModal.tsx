import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X } from 'lucide-react';

const ConfirmDeleteModal: React.FC = () => {
    const { playlistToDelete, closeDeleteModal, deletePlaylist } = useLibrary();

    if (!playlistToDelete) return null;

    const handleDelete = () => {
        if(playlistToDelete) {
            deletePlaylist(playlistToDelete.id);
            closeDeleteModal();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={closeDeleteModal}>
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Delete Playlist</h3>
                    <button onClick={closeDeleteModal}><X size={20} className="text-neutral-400 hover:text-white" /></button>
                </div>

                <div className="p-6 text-center">
                    <p className="text-white">
                        Are you sure you want to delete the playlist "{playlistToDelete?.name}"?
                    </p>
                    <p className="text-neutral-400 text-sm mt-2">
                        This action cannot be undone.
                    </p>
                </div>

                <div className="p-4 bg-neutral-900/50 flex justify-end gap-3">
                    <button
                        onClick={closeDeleteModal}
                        className="px-4 py-2 bg-neutral-700 text-white font-bold rounded-full hover:bg-neutral-600 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
