import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Trash2, ListMusic } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const Library: React.FC = () => {
    const { playlists, deletePlaylist, createPlaylist } = useLibrary();
    const { playTrack, userQueue, contextQueue, contextIndex } = usePlayer();

    // A simple function to create a playlist from current queue
    const createPlaylistFromQueue = () => {
        // combine userQueue and remaining contextQueue
        const remainingContext = contextQueue.slice(contextIndex + 1);
        const combined = [...userQueue, ...remainingContext];
        
        if (combined.length === 0) return alert("Queue is empty!");
        const name = prompt("Name for queue playlist:");
        if(name) {
            createPlaylist(name, combined);
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
                                    <img src={api.getCoverUrl(playlist.tracks[0].album.cover, '640')} className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition" />
                                ) : (
                                    <ListMusic size={48} className="text-neutral-700" />
                                )}
                            </div>
                            
                            <h3 className="font-bold text-lg truncate">{playlist.name}</h3>
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
                        
                        <button 
                            onClick={(e) => {
                                e.preventDefault(); 
                                if(confirm("Delete playlist?")) deletePlaylist(playlist.id);
                            }} 
                            className="absolute top-7 right-7 p-2 bg-black/50 rounded-full text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                            <Trash2 size={16} />
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
