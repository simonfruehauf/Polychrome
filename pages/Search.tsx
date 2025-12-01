import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PlayCircle, Plus, Disc, Mic2, Music, ListPlus } from 'lucide-react';
import { api } from '../services/api';
import { Track, Artist, Album } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { formatDuration } from '../services/utils';

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(false);
    
    const { playTrack, addToQueue } = usePlayer();
    const { openAddToPlaylistModal } = useLibrary();

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const [trackRes, artistRes, albumRes] = await Promise.all([
                        api.searchTracks(query),
                        api.searchArtists(query),
                        api.searchAlbums(query)
                    ]);
                    
                    setTracks(trackRes.items);
                    setArtists(artistRes.items);
                    setAlbums(albumRes.items);
                } catch (e) {
                    console.error("Search failed", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setTracks([]);
                setArtists([]);
                setAlbums([]);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
                <div className="bg-neutral-800/50 p-6 rounded-full mb-6">
                    <Music size={48} className="text-neutral-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Search Polychrome</h2>
                <p>Find your favorite artists, albums, and tracks.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {loading && <div className="text-neutral-400 animate-pulse">Searching...</div>}

            {/* Artists Section */}
            {!loading && artists.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Mic2 className="text-purple-400" size={24} /> Artists
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {artists.slice(0, 6).map((artist) => (
                            <Link to={`/artist/${artist.id}`} key={artist.id} className="group flex flex-col items-center cursor-pointer hover:bg-neutral-800/50 p-4 rounded-xl transition">
                                <img 
                                    src={api.getArtistPictureUrl(artist.picture, '320')} 
                                    alt={artist.name} 
                                    className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg group-hover:scale-105 transition duration-300"
                                />
                                <div className="text-center">
                                    <div className="font-bold text-white truncate w-full">{artist.name}</div>
                                    <div className="text-sm text-neutral-400">Artist</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Albums Section */}
            {!loading && albums.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Disc className="text-indigo-400" size={24} /> Albums
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {albums.slice(0, 10).map((album) => (
                            <Link to={`/album/${album.id}`} key={album.id} className="group cursor-pointer bg-neutral-800/30 hover:bg-neutral-800 p-4 rounded-xl transition">
                                <div className="relative aspect-square mb-4 rounded-md overflow-hidden shadow-lg">
                                    <img 
                                        src={api.getCoverUrl(album.cover, '640')} 
                                        alt={album.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-white truncate">{album.title}</div>
                                    <div className="text-sm text-neutral-400 truncate">{album.artist?.name}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Tracks Section */}
            {!loading && tracks.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Music className="text-pink-400" size={24} /> Songs
                    </h2>
                    <div className="space-y-1">
                        {tracks.map((track) => (
                            <div 
                                key={track.id} 
                                className="group flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                                onClick={() => playTrack(track)}
                            >
                                <div className="flex items-center flex-1 overflow-hidden gap-4">
                                    <div className="relative w-12 h-12 shrink-0">
                                            <img 
                                            src={api.getCoverUrl(track.album?.cover, '160')} 
                                            alt={track.title} 
                                            className="w-full h-full rounded object-cover"
                                        />
                                        <div 
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <PlayCircle size={20} className="text-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{track.title}</div>
                                        <Link to={`/artist/${track.artist?.id}`} className="text-sm text-neutral-400 truncate hover:underline" onClick={e => e.stopPropagation()}>
                                            {track.artist?.name}
                                        </Link>
                                    </div>
                                </div>

                                <Link to={`/album/${track.album?.id}`} className="hidden md:block flex-1 text-sm text-neutral-400 truncate px-4 hover:underline" onClick={e => e.stopPropagation()}>
                                    {track.album?.title}
                                </Link>

                                <div className="flex items-center space-x-4 pl-4 min-w-[100px] justify-end">
                                    <span className="text-sm text-neutral-500 font-mono">{formatDuration(track.duration)}</span>
                                    <button 
                                        className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToQueue(track);
                                        }}
                                        title="Add to queue"
                                    >
                                        <ListPlus size={20} />
                                    </button>
                                    <button 
                                        className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openAddToPlaylistModal(track);
                                        }}
                                        title="Add to Playlist"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {!loading && query.length > 1 && tracks.length === 0 && artists.length === 0 && albums.length === 0 && (
                <div className="text-center text-neutral-500 mt-20">
                    No results found for "{query}"
                </div>
            )}
        </div>
    );
};

export default SearchPage;