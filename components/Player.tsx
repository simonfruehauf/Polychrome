import React, { useState } from 'react'; // Added useState
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { formatDuration } from '../services/utils';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, ListMusic, Shuffle, Repeat, Repeat1, Loader2, Download } from 'lucide-react'; // Import Download icon
import { downloadCurrentTrack } from '../services/downloads'; // Import downloadCurrentTrack

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    currentTime, 
    duration, 
    seek, 
    volume, 
    setVolume,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    toggleQueue,
    isQueueOpen,
    isLoading,
    quality // Get quality from usePlayer
  } = usePlayer();

  const [isDownloading, setIsDownloading] = useState(false); // New state for download loading

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTrack) return;
    seek(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const VolumeIcon = () => {
      if (volume === 0) return <VolumeX size={20} className="text-neutral-400" />;
      if (volume < 0.5) return <Volume1 size={20} className="text-neutral-400" />;
      return <Volume2 size={20} className="text-neutral-400" />;
  };

  const handleDownloadCurrentTrack = async () => {
    if (!currentTrack) return;
    setIsDownloading(true);
    try {
        await downloadCurrentTrack(currentTrack, quality);
    } catch (error) {
        console.error('Failed to download current track:', error);
        alert('Failed to download current track: ' + (error as Error).message);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-900 px-4 h-24 flex items-center justify-between z-50 text-white select-none">
      {/* Track Info */}
      <div className="flex items-center w-[30%] min-w-[180px]">
        <div className="relative mr-4 group">
            {isLoading ? (
                <div className="w-14 h-14 bg-neutral-800 rounded flex items-center justify-center">
                    <Loader2 size={24} className="text-neutral-400 animate-spin" />
                </div>
            ) : currentTrack?.album?.cover ? (
              <img 
                src={api.getCoverUrl(currentTrack.album.cover, '80')} 
                alt="Cover" 
                className="w-14 h-14 rounded shadow-lg group-hover:opacity-80 transition"
              />
            ) : (
              <div className="w-14 h-14 bg-neutral-800 rounded flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-700/50" />
              </div>
            )}
        </div>
       
        <div className="overflow-hidden mr-4">
          <div className="font-semibold text-sm truncate text-white min-h-[1.25rem]">
              {currentTrack?.title || ''}
          </div>
          <div className="text-xs text-neutral-400 truncate hover:underline cursor-pointer hover:text-white transition min-h-[1rem]">
            {currentTrack?.artist?.name || ''}
          </div>
        </div>
      </div>

      {/* Controls & Progress */}
      <div className="flex flex-col items-center w-[40%] max-w-2xl">
        <div className="flex items-center space-x-6 mb-2">
            <button 
                onClick={toggleShuffle} 
                className={`transition ${isShuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
                title="Shuffle"
                disabled={!currentTrack || isLoading}
            >
                <Shuffle size={18} />
            </button>

            <button 
                onClick={prevTrack} 
                className={`transition ${currentTrack && !isLoading ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 cursor-default'}`}
                disabled={!currentTrack || isLoading}
            >
                <SkipBack size={20} fill="currentColor" />
            </button>
            
            <button 
                onClick={togglePlay} 
                className={`rounded-full p-2 transition ${currentTrack && !isLoading ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-neutral-800 text-neutral-500 cursor-default'}`}
                disabled={!currentTrack || isLoading}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            
            <button 
                onClick={nextTrack} 
                className={`transition ${currentTrack && !isLoading ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 cursor-default'}`}
                disabled={!currentTrack || isLoading}
            >
                <SkipForward size={20} fill="currentColor" />
            </button>

            <button 
                onClick={toggleRepeat} 
                className={`transition ${repeatMode !== 'OFF' ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
                title="Repeat"
                disabled={!currentTrack || isLoading}
            >
                {repeatMode === 'ONE' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
        </div>
        
        <div className="w-full flex items-center space-x-2 text-xs font-medium text-neutral-400">
          <span className="w-10 text-right tabular-nums">{currentTrack ? formatDuration(currentTime) : '-:--'}</span>
          <div className="flex-1 h-1 bg-neutral-800 rounded-full relative group">
             <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={!currentTrack || isLoading}
                className={`absolute inset-0 w-full h-full opacity-0 z-10 ${currentTrack && !isLoading ? 'cursor-pointer' : ''}`}
              />
              <div 
                className={`h-full rounded-full transition-colors ${currentTrack && !isLoading ? 'bg-white group-hover:bg-green-500' : 'bg-neutral-600'}`}
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
          </div>
          <span className="w-10 tabular-nums">{currentTrack ? formatDuration(duration) : '-:--'}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end w-[30%] space-x-4">
        <button 
            onClick={handleDownloadCurrentTrack}
            className={`transition bg-transparent border-none p-0 flex items-center ${isDownloading ? 'text-neutral-600' : 'text-neutral-400 hover:text-white'}`}
            title="Download Current Track"
            disabled={!currentTrack || isLoading || isDownloading}
        >
            {isDownloading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Download size={20} />
            )}
        </button>

        <button 
            onClick={toggleQueue}
            className={`transition bg-transparent border-none p-0 flex items-center ${isQueueOpen ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} 
            title="Queue"
        >
            <ListMusic size={20} />
        </button>
        
        <div className="flex items-center group w-24 sm:w-32">
          <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="mr-2 text-neutral-400 hover:text-white">
            <VolumeIcon />
          </button>
          <div className="flex-1 h-1 bg-neutral-800 rounded-full relative">
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
                className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
                style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;