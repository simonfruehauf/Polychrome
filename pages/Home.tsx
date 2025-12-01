import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-6">Welcome to OpenTidal</h1>
            <p className="text-neutral-400 mb-8 max-w-2xl">
                Experience high-fidelity audio streaming directly from Tidal's massive library. 
                Search for your favorite artists, albums, or tracks and start listening instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition">
                    <h3 className="text-xl font-bold mb-2 text-cyan-400">Lossless Quality</h3>
                    <p className="text-sm text-neutral-400">
                        Stream FLAC audio directly to your browser without compression artifacts.
                    </p>
                </div>
                <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition">
                    <h3 className="text-xl font-bold mb-2 text-purple-400">Cloud Library</h3>
                    <p className="text-sm text-neutral-400">
                        Sign in to save your playlists to Google Drive and access them anywhere.
                    </p>
                </div>
                <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition">
                    <h3 className="text-xl font-bold mb-2 text-green-400">No Ads</h3>
                    <p className="text-sm text-neutral-400">
                        Enjoy uninterrupted music listening with zero advertisements.
                    </p>
                </div>
            </div>

            <div className="mt-12">
                <Link 
                    to="/search" 
                    className="inline-block px-8 py-3 bg-cyan-500 text-black font-bold rounded-full hover:bg-cyan-400 transition transform hover:scale-105"
                >
                    Start Listening
                </Link>
            </div>
        </div>
    );
};

export default Home;