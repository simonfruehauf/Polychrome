import React, { useRef, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { X, Trash2, GripVertical, Play } from 'lucide-react';

const QueueSidebar: React.FC = () => {
    const { 
        userQueue, 
        contextQueue, 
        currentTrack, 
        contextIndex,
        contextTitle,
        isQueueOpen, 
        toggleQueue, 
        removeFromUserQueue, 
        reorderUserQueue, 
        clearUserQueue,
        playContextTrack,
        playTrack
    } = usePlayer();
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Calculate upcoming context tracks
    // If we are currently playing from context, we show items after contextIndex
    // If we are playing from userQueue, we show items after contextIndex (next to be played)
    const nextContextTracks = contextQueue.slice(contextIndex + 1);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
        const target = e.target as HTMLElement;
        target.style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData('text/plain');
        const dragIndex = parseInt(dragIndexStr, 10);
        
        if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
            reorderUserQueue(dragIndex, dropIndex);
        }
        setDragOverIndex(null);
    };

    return (
        <div 
            className={`${isQueueOpen ? 'w-80 border-l opacity-100' : 'w-0 opacity-0 border-none'} flex-shrink-0 bg-black border-neutral-800 flex flex-col transition-all duration-300 ease-in-out pb-24 overflow-hidden z-20`}
        >
            <div className="w-80 h-full flex flex-col">
                {/* Header */}
                <div className="p-6 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-xl text-white">Queue</h2>
                    <button onClick={toggleQueue} className="text-neutral-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6" ref={scrollRef}>
                    {/* Now Playing Section */}
                    {currentTrack && (
                        <div className="mb-8">
                            <h3 className="font-bold text-base text-white mb-4">Now playing</h3>
                            <div className="flex items-center gap-4 group p-3 rounded-lg hover:bg-neutral-900 transition border border-neutral-800 hover:border-neutral-700">
                                <img 
                                    src={api.getCoverUrl(currentTrack.album?.cover, '320')} 
                                    className="w-12 h-12 rounded object-cover shadow-lg" 
                                    alt={currentTrack.title} 
                                />
                                <div className="overflow-hidden">
                                    <div className="text-green-500 font-bold text-sm truncate w-48">{currentTrack.title}</div>
                                    <div className="text-neutral-400 text-xs truncate w-48">{currentTrack.artist?.name}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Queue Section */}
                    {userQueue.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-base text-white">Next in queue</h3>
                                <button 
                                    onClick={clearUserQueue}
                                    className="text-xs font-bold text-neutral-400 hover:text-white transition border border-neutral-700 hover:border-white px-2 py-1 rounded-full"
                                >
                                    Clear queue
                                </button>
                            </div>
                            
                            <div className="space-y-1">
                                {userQueue.map((track, i) => (
                                    <div 
                                        key={`uq-${track.id}-${i}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={(e) => handleDrop(e, i)}
                                        className={`group flex items-center p-2 rounded-lg hover:bg-neutral-900 cursor-pointer transition-all border border-transparent
                                            ${dragOverIndex === i ? 'border-neutral-600 bg-neutral-800' : ''}
                                        `}
                                        // Playing a track from user queue immediately plays it and removes it (as it becomes current)
                                        onClick={() => playTrack(track)}
                                    >
                                        <div className="text-neutral-600 mr-2 cursor-grab active:cursor-grabbing hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition">
                                            <GripVertical size={16} />
                                        </div>

                                        <div className="relative w-10 h-10 mr-3 shrink-0">
                                             <img src={api.getCoverUrl(track.album?.cover, '80')} className="w-full h-full rounded object-cover" alt="" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm text-white font-medium">{track.title}</div>
                                            <div className="truncate text-xs text-neutral-400">{track.artist?.name}</div>
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFromUserQueue(i); }}
                                            className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition p-2"
                                            title="Remove from queue"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Context Queue Section */}
                    {nextContextTracks.length > 0 && (
                        <div>
                            <h3 className="font-bold text-base text-white mb-4">
                                Next from: <span className="text-neutral-400 font-normal">{contextTitle}</span>
                            </h3>
                            <div className="space-y-1">
                                {nextContextTracks.map((track, i) => {
                                    // Calculate actual index in contextQueue
                                    const actualIndex = contextIndex + 1 + i;
                                    return (
                                        <div 
                                            key={`cq-${track.id}-${actualIndex}`}
                                            className="group flex items-center p-2 rounded-lg hover:bg-neutral-900 cursor-pointer transition-all"
                                            onClick={() => playContextTrack(actualIndex)}
                                        >
                                            <div className="text-neutral-600 mr-2 w-4 text-center opacity-0 group-hover:opacity-100 transition">
                                                <Play size={12} fill="currentColor" />
                                            </div>

                                            <div className="relative w-10 h-10 mr-3 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                                 <img src={api.getCoverUrl(track.album?.cover, '80')} className="w-full h-full rounded object-cover" alt="" />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate text-sm text-neutral-300 group-hover:text-white font-medium">{track.title}</div>
                                                <div className="truncate text-xs text-neutral-500">{track.artist?.name}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {userQueue.length === 0 && nextContextTracks.length === 0 && !currentTrack && (
                        <div className="text-neutral-500 text-sm py-4 text-center">
                            Queue is empty.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default QueueSidebar;
