import React, { useState } from 'react'; // Added useState
import { useParams } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { Play, Plus, Trash2, ListMusic, ListPlus, Download } from 'lucide-react'; // Import Download icon
import { formatDuration } from '../services/utils';
import { api } from '../services/api';
import { downloadPlaylistAsZip } from '../services/downloads'; // Import downloadPlaylistAsZip

import LazyImage from '../components/LazyImage';

const PlaylistDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getPlaylist, openDeleteModal, openAddToPlaylistModal } = useLibrary();
    const { playContext, addToQueue } = usePlayer();

    const playlist = id ? getPlaylist(id) : undefined;

    if (!playlist) {
        return <div className="p-8 text-neutral-500">Playlist not found.</div>;
    }

    return (
        <div>
             {/* Header */}
             <div className="flex flex-col md:flex-row items-end gap-8 mb-10 pb-6 bg-gradient-to-b from-neutral-800/20 to-transparent">
                <div className="w-56 h-56 bg-neutral-800 rounded-lg shadow-2xl flex items-center justify-center">
                    {playlist.tracks.length > 0 && playlist.tracks[0].album?.cover ? (
                        <LazyImage src={api.getCoverUrl(playlist.tracks[0].album.cover, '640')} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <ListMusic size={64} className="text-neutral-600" />
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-sm font-bold uppercase text-neutral-400 mb-2">Playlist</h2>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{playlist.name}</h1>
                    <div className="text-neutral-300 text-sm font-medium mb-6">
                        {playlist.tracks.length} songs
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                if (playlist.tracks.length > 0) {
                                    playContext(playlist.tracks, 0, playlist.name);
                                }
                            }}
                            className="bg-green-500 text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center gap-2 shadow-lg hover:bg-green-400"
                        >
                            <Play fill="black" size={20} /> Play
                        </button>
                        <button 
                            onClick={handleDownloadPlaylist}
                            className="bg-neutral-800 text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center gap-2"
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Download size={20} />
                            )}
                            Download
                        </button>
                        
                        <button 
                            onClick={() => {
                                if(playlist) {
                                    openDeleteModal(playlist);
                                    // ideally navigate away
                                }
                            }}
                            className="text-neutral-400 hover:text-red-500 px-4 py-3 transition ml-auto"
                        >
                           <Trash2 size={24} />
                        </button>                    </div>
                </div>
            </div>

            {/* Tracklist */}
            <div className="flex flex-col gap-1">
                {playlist.tracks.length === 0 ? (
                    <div className="text-neutral-500 italic mt-8">No tracks in this playlist yet. Add some from the Search page!</div>
                ) : (
                    playlist.tracks.map((track, i) => (
                        <div 
                            key={`${track.id}-${i}`} 
                            className="group flex items-center text-sm p-3 rounded-lg hover:bg-neutral-800/50 cursor-pointer transition"
                            onClick={() => playContext(playlist.tracks, i, playlist.name)}
                        >
                             <div className="w-8 text-center text-neutral-500 group-hover:text-white mr-4">
                                {i + 1}
                            </div>
                            <LazyImage 
                                src={api.getCoverUrl(track.album?.cover, '80')} 
                                className="w-10 h-10 rounded mr-4 object-cover"
                                alt=""
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{track.title}</div>
                                <div className="text-neutral-500 truncate group-hover:text-neutral-400">{track.artist?.name}</div>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition"
                                    title="Add to Queue"
                                >
                                    <ListPlus size={18} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openAddToPlaylistModal(track); }}
                                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition"
                                    title="Add to Playlist"
                                >
                                    <Plus size={18} />
                                </button>
                                <span className="text-neutral-500 font-mono w-12 text-right">
                                    {formatDuration(track.duration)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PlaylistDetails;
