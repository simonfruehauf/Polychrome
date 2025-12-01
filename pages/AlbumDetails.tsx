import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { AlbumDetails } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { Play, Plus, Clock, ListPlus } from 'lucide-react';
import { formatDuration } from '../services/utils';

import LazyImage from '../components/LazyImage';

const AlbumDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<AlbumDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { playContext, addToQueue } = usePlayer();
    const { openAddToPlaylistModal } = useLibrary();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getAlbum(id)
            .then(res => setData(res))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-neutral-500 p-8">Loading album...</div>;
    if (!data) return <div className="text-neutral-500 p-8">Album not found.</div>;

    const handlePlayAll = () => {
        playContext(data.tracks, 0, data.album.title);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end gap-8 mb-10 pb-6">
                <LazyImage 
                    src={api.getCoverUrl(data.album.cover, '640')} 
                    alt={data.album.title} 
                    className="w-56 h-56 rounded-lg shadow-2xl object-cover"
                />
                <div className="flex-1">
                    <h2 className="text-sm font-bold uppercase text-neutral-400 mb-2">Album</h2>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{data.album.title}</h1>
                    <div className="flex items-center gap-2 text-neutral-300 text-sm font-medium mb-6">
                        <Link to={`/artist/${data.album.artist?.id}`} className="hover:underline text-white font-bold">{data.album.artist?.name}</Link>
                        <span>•</span>
                        <span>{data.album.releaseDate?.split('-')[0]}</span>
                        <span>•</span>
                        <span>{data.tracks.length} songs</span>
                    </div>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={handlePlayAll}
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center gap-2"
                        >
                            <Play fill="black" size={20} /> Play
                        </button>
                    </div>
                </div>
            </div>

            {/* Tracklist */}
            <div className="border-t border-neutral-800">
                <div className="flex text-neutral-400 text-sm border-b border-neutral-800 p-3">
                    <div className="w-10 text-center">#</div>
                    <div className="flex-1 px-4">Title</div>
                    <div className="w-16 flex justify-end"><Clock size={16} /></div>
                </div>
                {data.tracks.map((track, i) => (
                    <div 
                        key={track.id} 
                        className="group flex items-center text-sm p-3 rounded-lg hover:bg-neutral-800/50 cursor-pointer transition"
                        onClick={() => playContext(data.tracks, i, data.album.title)}
                    >
                        <div className="w-10 text-center text-neutral-500 group-hover:text-white">
                            <span className="group-hover:hidden">{track.trackNumber || i + 1}</span>
                            <Play size={14} className="hidden group-hover:inline ml-1" fill="white" />
                        </div>
                        <div className="flex-1 px-4">
                            <div className="text-white font-medium">{track.title}</div>
                            <div className="text-neutral-500 group-hover:text-neutral-400">{track.artist?.name}</div>
                        </div>
                        <div className="flex items-center gap-4">
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
                            <span className="text-neutral-500 w-12 text-right font-mono">
                                {formatDuration(track.duration)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlbumDetailsPage;
