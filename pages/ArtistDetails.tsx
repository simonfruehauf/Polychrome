import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArtistDetails } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { Play, Plus, ListPlus, Download } from 'lucide-react'; // Import Download icon
import { formatDuration } from '../services/utils';
import { downloadDiscography } from '../services/downloads'; // Import downloadDiscography

const ArtistDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [artistData, setArtistData] = useState<ArtistDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // New state for error messages
    const [isDownloading, setIsDownloading] = useState(false); // New state for download loading
    const { playContext, addToQueue, quality } = usePlayer(); // Get quality from usePlayer
    const { openAddToPlaylistModal } = useLibrary();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setErrorMessage(null); // Clear previous errors
        api.getArtist(id)
            .then(data => {
                setArtistData(data);
                setErrorMessage(null);
            })
            .catch(err => {
                console.error(err);
                if (err.message.includes('Primary artist details not found.')) {
                    setErrorMessage('Artist data could not be loaded. This may be due to an expired API token or an unavailable mirror. Please check your API settings or try again later.');
                } else {
                    setErrorMessage('An unexpected error occurred while loading artist details.');
                }
                setArtistData(null); // Ensure artistData is null on error
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-neutral-500 p-8">Loading artist...</div>;

    const playAllTopTracks = () => {
        if(artistData?.tracks && artistData.tracks.length > 0) {
            playContext(artistData.tracks, 0, artistData.name || 'Unknown Artist');
        }
    };

    const handleDownloadDiscography = async () => {
        if (!artistData || !artistData.albums || artistData.albums.length === 0) {
            alert('No albums found to download for this artist.');
            return;
        }
        setIsDownloading(true);
        try {
            await downloadDiscography(artistData, artistData.albums, quality);
        } catch (error) {
            console.error('Failed to download discography:', error);
            alert('Failed to download discography: ' + (error as Error).message);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div>
            {errorMessage && (
                <div className="bg-red-900 text-white p-4 rounded-lg mb-6">
                    <p className="font-bold">Error:</p>
                    <p>{errorMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10 pb-6 border-b border-neutral-800">
                <img 
                    src={artistData?.picture ? api.getArtistPictureUrl(artistData.picture, '750') : `https://picsum.photos/300/300?blur`} 
                    alt={artistData?.name || 'Unknown Artist'} 
                    className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl object-cover"
                />
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">{artistData?.name || 'Unknown Artist'}</h1>
                    {artistData?.tracks && artistData.tracks.length > 0 && ( // Only show play button if tracks are available
                        <div className="flex gap-4 justify-center md:justify-start">
                             <button 
                                onClick={playAllTopTracks}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition flex items-center gap-2"
                            >
                                <Play fill="black" size={20} /> Play Top Tracks
                            </button>
                            <button 
                                onClick={handleDownloadDiscography}
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
                                Download Discography
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Tracks */}
            {artistData?.tracks && artistData.tracks.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Top Tracks</h2>
                    <div className="grid grid-cols-1 gap-1">
                        {artistData.tracks.map((track, index) => (
                            <div 
                                key={track.id} 
                                className="group flex items-center p-3 rounded-lg hover:bg-neutral-800/50 transition cursor-pointer"
                                onClick={() => playContext(artistData.tracks, index, artistData.name || 'Unknown Artist')}
                            >
                                <span className="w-8 text-neutral-500 text-center">{index + 1}</span>
                                
                                <div className="relative w-10 h-10 mr-4 shrink-0">
                                    <img 
                                        src={api.getCoverUrl(track.album?.cover, '80')} 
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded">
                                         <Play size={16} className="text-white" fill="white" />
                                    </div>
                                </div>

                                <div className="flex-1 font-medium text-white truncate pr-4">{track.title}</div>
                                <div className="hidden md:block text-neutral-400 text-sm mr-8 truncate max-w-[200px]">{track.album?.title}</div>
                                
                                <div className="flex items-center gap-3 mr-4">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                                        className="p-2 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                        title="Add to Queue"
                                    >
                                        <ListPlus size={20} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openAddToPlaylistModal(track); }}
                                        className="p-2 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                        title="Add to Playlist"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                
                                <span className="text-sm text-neutral-500 font-mono w-10 text-right">{formatDuration(track.duration)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Albums */}
            {artistData?.albums && artistData.albums.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-6">Albums</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {artistData.albums.map((album) => (
                            <Link to={`/album/${album.id}`} key={album.id} className="group cursor-pointer bg-neutral-800/30 hover:bg-neutral-800 p-4 rounded-xl transition">
                                <div className="relative aspect-square mb-4 rounded-md overflow-hidden shadow-lg">
                                    <img 
                                        src={api.getCoverUrl(album.cover, '640')} 
                                        alt={album.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-green-500 p-3 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                                        <Play fill="black" className="text-black ml-0.5" size={20} />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-white truncate">{album.title}</div>
                                    <div className="text-sm text-neutral-400 truncate">{album.releaseDate?.split('-')[0]}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ArtistDetailsPage;

