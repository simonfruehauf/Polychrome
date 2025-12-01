import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Player from './Player';
import AddToPlaylistModal from './AddToPlaylistModal';
import QueueSidebar from './QueueSidebar';
import { Search, Library, LogIn, Music, Compass, Plus, List } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

// Define the window.google interface
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: any) => void;
                    }) => {
                        requestAccessToken: () => void;
                    };
                };
            };
        };
    }
}

// NOTE: When building with Vite, use import.meta.env.VITE_GOOGLE_CLIENT_ID
// Fix: Cast import.meta to any to resolve TS error about missing env property
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '63434169086-8mcheesofd88bic8ktemlqmhkho5b801.apps.googleusercontent.com
';

const Layout: React.FC = () => {
    const { currentTrack } = usePlayer();
    const { playlists, createPlaylist } = useLibrary();
    const [user, setUser] = useState<{name: string, email: string, picture?: string} | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // Load user from local storage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('opentidal_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const handleGoogleLogin = () => {
        if (typeof window === 'undefined' || !window.google) {
            alert("Google Sign-In is not loaded. Please check your internet connection.");
            return;
        }

        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
            alert("Please configure a valid Google Client ID in the code or environment variables.");
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    try {
                        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: {
                                'Authorization': `Bearer ${tokenResponse.access_token}`
                            }
                        });
                        
                        if (userInfoResponse.ok) {
                            const userData = await userInfoResponse.json();
                            const userProfile = {
                                name: userData.name,
                                email: userData.email,
                                picture: userData.picture
                            };
                            setUser(userProfile);
                            localStorage.setItem('opentidal_user', JSON.stringify(userProfile));
                        }
                    } catch (error) {
                        console.error("Failed to fetch user profile", error);
                    }
                }
            },
        });

        client.requestAccessToken();
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        } else if (query.trim() === '') {
             // Optional behavior on empty search
        }
    };

    const handleCreatePlaylist = () => {
        const name = prompt("Enter playlist name:");
        if (name) {
            createPlaylist(name);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            <AddToPlaylistModal />
            
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 bg-black flex flex-col border-r border-neutral-900 z-40 transition-all duration-300 pb-28">
                <div className="flex items-center justify-center lg:justify-start gap-3 h-20 px-4 lg:px-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shrink-0">
                        <Music className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold tracking-tight hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Polychrome
                    </span>
                </div>

                <nav className="space-y-2 py-6 px-2 lg:px-4">
                    <NavLink 
                        to="/explore" 
                        className={({ isActive }) => `flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}
                    >
                        <Compass size={24} />
                        <span className="font-medium hidden lg:block">Explore</span>
                    </NavLink>
                    <NavLink 
                        to="/library" 
                        className={({ isActive }) => `flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'}`}
                    >
                        <Library size={24} />
                        <span className="font-medium hidden lg:block">Library</span>
                    </NavLink>
                </nav>

                <div className="mt-4 px-4 lg:px-6 mb-2 flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-bold uppercase tracking-wider hidden lg:block">Playlists</span>
                    <button 
                        onClick={handleCreatePlaylist}
                        className="hover:text-white transition"
                        title="Create Playlist"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 lg:px-4 space-y-1">
                     {playlists.map(playlist => (
                         <NavLink
                            key={playlist.id}
                            to={`/playlist/${playlist.id}`}
                            className={({ isActive }) => `flex items-center justify-center lg:justify-start gap-4 px-4 py-2 rounded-lg transition-all text-sm ${isActive ? 'text-white bg-neutral-900' : 'text-neutral-400 hover:text-white hover:bg-neutral-900/30'}`}
                         >
                             <List size={20} className="shrink-0" />
                             <span className="truncate hidden lg:block">{playlist.name}</span>
                         </NavLink>
                     ))}
                </div>

                <div className="mt-auto border-t border-neutral-900 p-4">
                    {user ? (
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                             {user.picture ? (
                                 <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full shrink-0" />
                             ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                                    {user.name.charAt(0)}
                                </div>
                             )}
                            <div className="hidden lg:block overflow-hidden">
                                <p className="font-medium truncate text-sm">{user.name}</p>
                                <button 
                                    onClick={() => {
                                        setUser(null);
                                        localStorage.removeItem('opentidal_user');
                                    }} 
                                    className="text-xs text-red-400 hover:underline"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 w-full bg-neutral-800 text-white py-3 rounded-xl font-bold hover:bg-neutral-700 transition"
                            title="Sign in with Google"
                        >
                            <LogIn size={20} />
                            <span className="hidden lg:block text-sm">Sign in</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#090909]">
                {/* Global Search Header */}
                <header className="h-20 flex items-center px-8 sticky top-0 z-30 bg-[#090909]/95 backdrop-blur-md border-b border-neutral-800/50">
                    <div className="relative w-full max-w-xl group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-neutral-500 group-focus-within:text-white transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={handleSearch}
                            placeholder="Search for artists, albums, or tracks..." 
                            className="block w-full bg-neutral-800/50 border border-transparent text-white rounded-full py-3 pl-11 pr-4 placeholder-neutral-500 focus:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-sm"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 mb-24">
                    <Outlet />
                </div>
            </main>
            
            <QueueSidebar />

            {/* Player Bar */}
            <Player />
        </div>
    );
};

export default Layout;