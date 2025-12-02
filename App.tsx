import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import { LibraryProvider } from './context/LibraryContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import SearchPage from './pages/Search';
import Library from './pages/Library';
import Explore from './pages/Explore';
import ArtistDetailsPage from './pages/ArtistDetails';
import AlbumDetailsPage from './pages/AlbumDetails';
import PlaylistDetails from './pages/PlaylistDetails';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import SettingsPage from './pages/Settings'; // Import the new SettingsPage

const App: React.FC = () => {
  return (
    <LibraryProvider>
        <ToastProvider>
            <ConfirmDeleteModal />
            <CreatePlaylistModal />
            <PlayerProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Navigate to="/explore" replace />} />
                            <Route path="explore" element={<Explore />} />
                            <Route path="library" element={<Library />} />
                            <Route path="search" element={<SearchPage />} />
                            <Route path="artist/:id" element={<ArtistDetailsPage />} />
                            <Route path="album/:id" element={<AlbumDetailsPage />} />
                            <Route path="playlist/:id" element={<PlaylistDetails />} />
                            <Route path="settings" element={<SettingsPage />} /> {/* Add the new route */}
                        </Route>
                    </Routes>
                </Router>
            </PlayerProvider>
        </ToastProvider>
    </LibraryProvider>
  );
};

export default App;