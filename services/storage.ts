// services/storage.ts
import { Artist, Album } from "../types"; // Import types if needed

export const apiSettings = {
    STORAGE_KEY: 'polychrome-api-instances',
    // INSTANCES_URL is handled by Settings class in utils.ts, but keeping the key name for consistency
    INSTANCES_URL: 'https://raw.githubusercontent.com/EduardPrigoana/hifi-instances/refs/heads/main/instances.json', 
    SPEED_TEST_CACHE_KEY: 'polychrome-instance-speeds',
    SPEED_TEST_CACHE_DURATION: 1000 * 60 * 60, // 1 hour
    // The actual logic for getInstances, refreshSpeedTests, saveInstances is in Settings class in utils.ts
    // This object mostly holds keys/constants related to API settings storage.
};

export const recentActivityManager = {
    STORAGE_KEY: 'polychrome-recent-activity',
    LIMIT: 10,

    _get(): { artists: Artist[], albums: Album[] } {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { artists: [], albums: [] };
        } catch (e) {
            console.error("Error loading recent activity:", e); // Keep error log for storage issues
            return { artists: [], albums: [] };
        }
    },

    _save(data: { artists: Artist[], albums: Album[] }) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving recent activity:", e); // Keep error log for storage issues
        }
    },

    getRecents() {
        return this._get();
    },

    _add(type: 'artists' | 'albums', item: Artist | Album) {
        const data = this._get();
        data[type] = data[type].filter((i: Artist | Album) => i.id !== item.id);
        data[type].unshift(item);
        data[type] = data[type].slice(0, this.LIMIT) as any; // Cast to any to satisfy TS for slicing
        this._save(data);
    },

    addArtist(artist: Artist) {
        this._add('artists', artist);
    },

    addAlbum(album: Album) {
        this._add('albums', album);
    }
};

export const themeManager = {
    STORAGE_KEY: 'polychrome-theme',
    CUSTOM_THEME_KEY: 'polychrome-custom-theme',

    getTheme(): string {
        try {
            return localStorage.getItem(this.STORAGE_KEY) || 'dark'; // Default to 'dark' for now
        } catch (e) {
            console.error("Error getting theme:", e);
            return 'dark';
        }
    },

    setTheme(theme: string): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
            document.documentElement.setAttribute('data-theme', theme);
            // Apply custom theme if 'custom' is selected and available
            if (theme === 'custom') {
                const customColors = this.getCustomTheme();
                if (customColors) {
                    this.applyCustomTheme(customColors);
                }
            } else {
                // Remove custom theme styles if switching away
                this.clearCustomThemeStyles();
            }
        } catch (e) {
            console.error("Error setting theme:", e);
        }
    },

    getCustomTheme(): Record<string, string> | null {
        try {
            const stored = localStorage.getItem(this.CUSTOM_THEME_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error("Error getting custom theme:", e);
            return null;
        }
    },

    setCustomTheme(colors: Record<string, string>): void {
        try {
            localStorage.setItem(this.CUSTOM_THEME_KEY, JSON.stringify(colors));
            this.applyCustomTheme(colors);
        } catch (e) {
            console.error("Error setting custom theme:", e);
        }
    },

    applyCustomTheme(colors: Record<string, string>): void {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(colors)) {
            root.style.setProperty(`--${key}`, value);
        }
        root.setAttribute('data-theme', 'custom'); // Ensure theme is marked as custom
    },

    clearCustomThemeStyles(): void {
        const root = document.documentElement;
        // This is a simplistic way; ideally we'd remove specific properties
        // For now, it will just rely on the new theme's CSS variables overriding.
        root.removeAttribute('data-theme'); // Remove custom theme attribute
    }
};

export const lastFMStorage = {
    STORAGE_KEY: 'polychrome-lastfm-enabled', // Changed to polychrome prefix

    isEnabled(): boolean {
        try {
            return localStorage.getItem(this.STORAGE_KEY) === 'true';
        } catch (e) {
            console.error("Error getting Last.fm enabled status:", e);
            return false;
        }
    },

    setEnabled(enabled: boolean): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, enabled ? 'true' : 'false');
        } catch (e) {
            console.error("Error setting Last.fm enabled status:", e);
        }
    }
};

export const nowPlayingSettings = {
    STORAGE_KEY: 'polychrome-now-playing-mode', // Changed to polychrome prefix

    getMode(): 'cover' | 'lyrics' | 'karaoke' { // Define modes
        try {
            return (localStorage.getItem(this.STORAGE_KEY) as 'cover' | 'lyrics' | 'karaoke') || 'cover';
        } catch (e) {
            console.error("Error getting Now Playing mode:", e);
            return 'cover';
        }
    },

    setMode(mode: 'cover' | 'lyrics' | 'karaoke'): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, mode);
        } catch (e) {
            console.error("Error setting Now Playing mode:", e);
        }
    }
};

export const lyricsSettings = {
    DOWNLOAD_WITH_TRACKS: 'polychrome-lyrics-download-with-tracks', // Changed to polychrome prefix

    shouldDownloadLyrics(): boolean {
        try {
            return localStorage.getItem(this.DOWNLOAD_WITH_TRACKS) === 'true';
        } catch (e) {
            console.error("Error getting lyrics download setting:", e);
            return false;
        }
    },

    setDownloadLyrics(enabled: boolean): void {
        try {
            localStorage.setItem(this.DOWNLOAD_WITH_TRACKS, enabled ? 'true' : 'false');
        } catch (e) {
            console.error("Error setting lyrics download setting:", e);
        }
    }
};
