import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext'; // Assuming this might be needed for modals later

export const useKeyboardShortcuts = () => {
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    // seek is not directly exposed as a setter in PlayerContext, but we can manipulate audioRef.currentTime
    volume,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleQueue,
    currentTrack, // Needed for lyrics/karaoke context
    audioRef, // Direct access to audio element for currentTime and duration
    isQueueOpen, // To toggle queue visibility
  } = usePlayer();

  const {
    closeConfirmDeleteModal, // Assuming these modals might be open
    closeCreatePlaylistModal,
  } = useLibrary(); // Use LibraryContext for modals

  const navigate = useNavigate();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore shortcuts if an input field is focused
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case ' ': // Spacebar
        event.preventDefault();
        togglePlay();
        break;
      case 'arrowright':
        if (event.ctrlKey) { // Changed from shiftKey to ctrlKey
          nextTrack();
        } else {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            audioRef.current.currentTime = Math.min(
              audioRef.current.duration,
              audioRef.current.currentTime + 10
            );
          }
        }
        break;
      case 'arrowleft':
        if (event.ctrlKey) { // Changed from shiftKey to ctrlKey
          prevTrack();
        } else {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }
        }
        break;
      case 'arrowup':
        event.preventDefault(); // Prevent page scroll
        setVolume(volume + 0.1);
        break;
      case 'arrowdown':
        event.preventDefault(); // Prevent page scroll
        setVolume(volume - 0.1);
        break;
      case 'm': // Mute/Unmute
        if (audioRef.current) {
          audioRef.current.muted = !audioRef.current.muted;
          // The volume display should react to this automatically via volumechange event
        }
        break;
      case 's': // Toggle Shuffle
        toggleShuffle();
        break;
      case 'r': // Toggle Repeat
        toggleRepeat();
        break;
      case 'q': // Toggle Queue sidebar/modal
        toggleQueue();
        break;
      case '/': // Focus search input
        event.preventDefault();
        // TODO: Implement actual focus for search input. This will likely involve
        // either exposing a ref from the search input or a context-based focus trigger.
        // For now, navigate to search page.
        navigate('/search'); 
        break;
      case 'escape': // Close modals, lyrics, karaoke
        // Close modals from LibraryContext
        closeConfirmDeleteModal();
        closeCreatePlaylistModal();
        
        // Close queue if open
        if (isQueueOpen) {
          toggleQueue();
        }
        // TODO: Handle closing lyrics/karaoke view if open.
        // This would require the lyrics panel state to be exposed and settable.
        break;
      case 'l': // Toggle Lyrics/Cover view (Now Playing Mode)
        // TODO: This would require 'nowPlayingSettings' and a way to toggle
        // between lyrics/cover view, possibly exposed by PlayerContext.
        // For now, navigate to current track's album page if track is playing.
        if (currentTrack?.album?.id) {
          navigate(`/album/${currentTrack.album.id}`);
        }
        break;
      default:
        break;
    }
  }, [
    togglePlay, nextTrack, prevTrack, setVolume, toggleShuffle, toggleRepeat, toggleQueue,
    audioRef, closeConfirmDeleteModal, closeCreatePlaylistModal, navigate, currentTrack, isQueueOpen, volume, // Added volume to dependencies
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
