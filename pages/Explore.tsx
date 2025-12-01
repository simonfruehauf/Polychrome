import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Album } from '../types';
import { Link } from 'react-router-dom';

const Explore: React.FC = () => {
    const [topAlbums, setTopAlbums] = useState<Album[]>([]);
    const [popAlbums, setPopAlbums] = useState<Album[]>([]);
    const [rockAlbums, setRockAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Simulate explore content by searching for generic popular terms
                const [top, pop, rock] = await Promise.all([
                    api.searchAlbums('Top 2024'),
                    api.searchAlbums('Pop Hits'),
                    api.searchAlbums('Rock Classics')
                ]);
                setTopAlbums(top.items.slice(0, 5));
                setPopAlbums(pop.items.slice(0, 5));
                setRockAlbums(rock.items.slice(0, 5));
            } catch (error) {
                console.error("Failed to load explore content", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    const AlbumRow = ({ title, albums }: { title: string, albums: Album[] }) => (
        <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {albums.map((album) => (
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
    );

    if (loading) {
        return <div className="p-8 text-neutral-500 animate-pulse">Loading amazing music...</div>;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Explore</h1>
            <AlbumRow title="Trending Now" albums={topAlbums} />
            <AlbumRow title="Pop Essentials" albums={popAlbums} />
            <AlbumRow title="Rock Classics" albums={rockAlbums} />
        </div>
    );
};

export default Explore;