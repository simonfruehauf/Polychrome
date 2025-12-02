import React, { useEffect, useState, useCallback } from 'react';
import { Settings } from '../services/utils';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { lyricsSettings } from '../services/storage'; // Import only lyricsSettings

interface MirrorStatus {
    url: string;
    latency: number;
}

const SettingsPage: React.FC = () => {
    const { quality, setQuality } = usePlayer();
    const [mirrors, setMirrors] = useState<MirrorStatus[]>([]);
    const [isRefreshingMirrors, setIsRefreshingMirrors] = useState<boolean>(false);
    const [isClearingCache, setIsClearingCache] = useState<boolean>(false);
    const [downloadLyricsWithTracks, setDownloadLyricsWithTracks] = useState<boolean>(lyricsSettings.shouldDownloadLyrics());
    const [filenameTemplate, setFilenameTemplate] = useState<string>(localStorage.getItem('filename-template') || '{trackNumber} - {artist} - {title}');
    const [zipFolderTemplate, setZipFolderTemplate] = useState<string>(localStorage.getItem('zip-folder-template') || '{albumTitle} - {albumArtist} - polychrome.tf');


    const settings = Settings.getInstance();

    // Mirror Status Effect
    useEffect(() => {
        const handleMirrorsUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<MirrorStatus[]>;
            setMirrors(customEvent.detail);
            setIsRefreshingMirrors(false);
        };

        setMirrors(settings.getSortedMirrors()); // Initial load

        settings.addEventListener('mirrorsUpdated', handleMirrorsUpdate as EventListener);

        return () => {
            settings.removeEventListener('mirrorsUpdated', handleMirrorsUpdate as EventListener);
        };
    }, [settings]);

    const handleRefreshMirrors = async () => {
        setIsRefreshingMirrors(true);
        await settings.refreshMirrors();
    };



    // Download Settings Handlers
    const handleDownloadLyricsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setDownloadLyricsWithTracks(checked);
        lyricsSettings.setDownloadLyrics(checked);
    };

    const handleFilenameTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilenameTemplate(value);
        localStorage.setItem('filename-template', value);
    };

    const handleZipFolderTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setZipFolderTemplate(value);
        localStorage.setItem('zip-folder-template', value);
    };


    // Cache Management Handler
    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            await api.clearCache(); // api.clearCache also clears IndexedDB
            settings.clearCache(); // Clear cached speed tests etc. if any
            alert('Cache cleared successfully!');
        } catch (error) {
            alert('Failed to clear cache.');
            console.error('Failed to clear cache:', error);
        } finally {
            setIsClearingCache(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
{/* Keyboard Shortcuts Help Area */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Keyboard Shortcuts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-neutral-300">
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Play / Pause</span>
                        <kbd className="kbd">Space</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Next Track</span>
                        <kbd className="kbd">Shift</kbd> + <kbd className="kbd">→</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Previous Track</span>
                        <kbd className="kbd">Shift</kbd> + <kbd className="kbd">←</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Seek Forward 10s</span>
                        <kbd className="kbd">→</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Seek Backward 10s</span>
                        <kbd className="kbd">←</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Volume Up</span>
                        <kbd className="kbd">↑</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Volume Down</span>
                        <kbd className="kbd">↓</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Mute / Unmute</span>
                        <kbd className="kbd">M</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Toggle Shuffle</span>
                        <kbd className="kbd">S</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Toggle Repeat</span>
                        <kbd className="kbd">R</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Toggle Queue</span>
                        <kbd className="kbd">Q</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Focus Search</span>
                        <kbd className="kbd">/</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">Close Modals / Panels</span>
                        <kbd className="kbd">Esc</kbd>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-md">
                        <span className="font-medium">View Current Track Info (Album)</span>
                        <kbd className="kbd">L</kbd>
                    </div>
                </div>
            </div>
            {/* Playback Settings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Playback Settings</h2>
                
                <div className="mb-4">
                    <label htmlFor="quality-select" className="block text-neutral-300 text-sm font-medium mb-2">Playback Quality</label>
                    <select
                        id="quality-select"
                        className="block w-full sm:w-1/2 lg:w-1/3 p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-green-500 focus:border-green-500"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as any)} // Cast to any to match Quality type
                    >
                        <option value="LOW">Low</option>
                        <option value="HIGH">High</option>
                        <option value="LOSSLESS">Lossless</option>
                        <option value="HI_RES_LOSSLESS">Hi-Res Lossless</option>
                    </select>
                    <p className="text-neutral-500 text-xs mt-1">Changes the quality of streamed audio.</p>
                </div>
            </div>

            {/* Download Settings */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Download Settings</h2>
                
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="download-lyrics-toggle"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-neutral-700 rounded"
                        checked={downloadLyricsWithTracks}
                        onChange={handleDownloadLyricsToggle}
                    />
                    <label htmlFor="download-lyrics-toggle" className="ml-2 block text-neutral-300 text-sm font-medium">Download lyrics with tracks</label>
                </div>

                <div className="mb-4">
                    <label htmlFor="filename-template-input" className="block text-neutral-300 text-sm font-medium mb-2">Track Filename Template</label>
                    <input
                        type="text"
                        id="filename-template-input"
                        className="block w-full sm:w-2/3 lg:w-1/2 p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-green-500 focus:border-green-500"
                        value={filenameTemplate}
                        onChange={handleFilenameTemplateChange}
                        placeholder="{trackNumber} - {artist} - {title}"
                    />
                    <p className="text-neutral-500 text-xs mt-1">Available placeholders: {'{trackNumber}, {artist}, {title}, {album}'}</p>
                </div>

                <div className="mb-4">
                    <label htmlFor="zip-folder-template-input" className="block text-neutral-300 text-sm font-medium mb-2">ZIP Folder Template</label>
                    <input
                        type="text"
                        id="zip-folder-template-input"
                        className="block w-full sm:w-2/3 lg:w-1/2 p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white focus:ring-green-500 focus:border-green-500"
                        value={zipFolderTemplate}
                        onChange={handleZipFolderTemplateChange}
                        placeholder="{albumTitle} - {albumArtist} - polychrome.tf"
                    />
                    <p className="text-neutral-500 text-xs mt-1">Available placeholders: {'{albumTitle}, {albumArtist}, {year}'}</p>
                </div>
            </div>

            {/* Cache Management */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Cache Management</h2>
                <p className="text-neutral-400 mb-4">Clear all cached API responses and streamed content data from your browser.</p>
                <button 
                    onClick={handleClearCache} 
                    disabled={isClearingCache}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isClearingCache ? 'Clearing...' : 'Clear All Cache'}
                </button>
            </div>

            {/* Mirror Status (existing section, integrated) */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Mirror Status</h2>
                <p className="text-neutral-400 mb-4">
                    The application uses a list of mirrors to fetch content. These mirrors are sorted by latency to ensure the best performance.
                    You can manually refresh the latency check below.
                </p>
                <button 
                    onClick={handleRefreshMirrors} 
                    disabled={isRefreshingMirrors}
                    className="bg-white text-black font-bold py-2 px-4 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRefreshingMirrors ? 'Refreshing...' : 'Refresh Mirror Latency'}
                </button>

                <div className="mt-6">
                    {mirrors.length === 0 ? (
                        <p className="text-neutral-400">No mirrors available or being checked.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-700">
                                <thead className="bg-neutral-800">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Mirror URL
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Latency
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {mirrors.map((mirror, index) => (
                                        <tr key={index} className="hover:bg-neutral-800">
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">
                                                <a href={mirror.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    {mirror.url}
                                                </a>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-300">
                                                {mirror.latency === Infinity ? 'Failed' : `${mirror.latency.toFixed(2)}ms`}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    mirror.latency === Infinity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {mirror.latency === Infinity ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;