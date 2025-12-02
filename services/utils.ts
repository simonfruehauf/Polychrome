import { Track } from "../types";

export const QUALITY = 'LOSSLESS';

export const REPEAT_MODE = {
    OFF: 0,
    ALL: 1,
    ONE: 2
};

export const AUDIO_QUALITIES = {
    HI_RES_LOSSLESS: 'HI_RES_LOSSLESS',
    LOSSLESS: 'LOSSLESS',
    HIGH: 'HIGH',
    LOW: 'LOW'
};

export const QUALITY_PRIORITY = ['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH', 'LOW'];

export const QUALITY_TOKENS = {
    HI_RES_LOSSLESS: ['HI_RES_LOSSLESS', 'HIRES_LOSSLESS', 'HIRESLOSSLESS', 'HIFI_PLUS', 'HI_RES_FLAC', 'HI_RES', 'HIRES', 'MASTER', 'MASTER_QUALITY', 'MQA'],
    LOSSLESS: ['LOSSLESS', 'HIFI'],
    HIGH: ['HIGH', 'HIGH_QUALITY'],
    LOW: ['LOW', 'LOW_QUALITY']
};

export const RATE_LIMIT_ERROR_MESSAGE = 'Too Many Requests. Please wait a moment and try again.';

export const SVG_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
export const SVG_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
export const SVG_VOLUME = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
export const SVG_MUTE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';

export const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

export const createPlaceholder = (text: string, isLoading = false): string => {
    return `<div class="placeholder-text ${isLoading ? 'loading' : ''}">${text}</div>`;
};

export const trackDataStore = new WeakMap<Element, Track>();

export const sanitizeForFilename = (value: string): string => {
    if (!value) return 'Unknown';
    return value
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, ' ')
        .trim();
};

export const getExtensionForQuality = (quality: string): string => {
    switch (quality) {
        case 'LOW':
        case 'HIGH':
            return 'm4a';
        default:
            return 'flac';
    }
};

export const buildTrackFilename = (track: Track, quality: string): string => {
    const template = localStorage.getItem('filename-template') || '{trackNumber} - {artist} - {title}';
    const extension = getExtensionForQuality(quality);

    const data = {
        trackNumber: track.trackNumber,
        artist: track.artist?.name,
        title: getTrackTitle(track),
        album: track.album?.title
    };

    return formatTemplate(template, data) + '.' + extension;
};

const sanitizeToken = (value: string): string => {
    if (!value) return '';
    return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
};

export const normalizeQualityToken = (value: string | null | undefined): string | null => {
    if (!value) return null;

    const token = sanitizeToken(value);

    for (const [quality, aliases] of Object.entries(QUALITY_TOKENS)) {
        if (aliases.includes(token)) {
            return quality;
        }
    }

    return null;
};

export const deriveQualityFromTags = (rawTags: string[] | null | undefined): string | null => {
    if (!Array.isArray(rawTags)) return null;

    const candidates: string[] = [];
    for (const tag of rawTags) {
        if (typeof tag !== 'string') continue;
        const normalized = normalizeQualityToken(tag);
        if (normalized && !candidates.includes(normalized)) {
            candidates.push(normalized);
        }
    }

    return pickBestQuality(candidates);
};

export const pickBestQuality = (candidates: string[]): string | null => {
    let best: string | null = null;
    let bestRank = Infinity;

    for (const candidate of candidates) {
        if (!candidate) continue;
        const rank = QUALITY_PRIORITY.indexOf(candidate);
        const currentRank = rank === -1 ? Infinity : rank;

        if (currentRank < bestRank) {
            best = candidate;
            bestRank = currentRank;
        }
    }

    return best;
};

export const deriveTrackQuality = (track: Track): string | null => {
    if (!track) return null;

    const candidates = [
        deriveQualityFromTags(track.mediaMetadata?.tags),
        deriveQualityFromTags(track.album?.mediaMetadata?.tags),
        normalizeQualityToken(track.audioQuality)
    ];

    return pickBestQuality(candidates);
};

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const hasExplicitContent = (item: { explicit?: boolean; explicitLyrics?: boolean }): boolean => {
    return item?.explicit === true || item?.explicitLyrics === true;
};

export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const getTrackTitle = (track: Track, { fallback = 'Unknown Title' } = {}): string => {
    if (!track?.title) return fallback;
    return track?.version ? `${track.title} (${track.version})` : track.title;
};

export const getTrackArtists = (track: Partial<Track> = {}, { fallback = 'Unknown Artist' } = {}): string => {
    if (track?.artists?.length) {
        return track.artists.map(artist => artist?.name).join(', ');
    }

    if (track?.artist?.name) {
        return track.artist.name;
    }

    return fallback;
};

export const formatTemplate = (template: string, data: Record<string, string | number | undefined>): string => {
    let result = template;
    result = result.replace(/\{trackNumber\}/g, data.trackNumber ? String(data.trackNumber).padStart(2, '0') : '00');
    result = result.replace(/\{artist\}/g, sanitizeForFilename(data.artist as string || 'Unknown Artist'));
    result = result.replace(/\{title\}/g, sanitizeForFilename(data.title as string || 'Unknown Title'));
    result = result.replace(/\{album\}/g, sanitizeForFilename(data.album as string || 'Unknown Album'));
    result = result.replace(/\{albumArtist\}/g, sanitizeForFilename(data.albumArtist as string || 'Unknown Artist'));
    result = result.replace(/\{albumTitle\}/g, sanitizeForFilename(data.albumTitle as string || 'Unknown Album'));
    result = result.replace(/\{year\}/g, data.year ? String(data.year) : 'Unknown');
    return result;
};

export const calculateTotalDuration = (tracks: Track[]): number => {
    if (!Array.isArray(tracks) || tracks.length === 0) return 0;
    return tracks.reduce((total, track) => total + (track.duration || 0), 0);
};

export const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0 min';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
};


export const BASE_MIRRORS = [
    'https://tidal.kinoplus.online',
    'https://api.tidalhifi.com',
    'https://wolf.qqdl.site',
    'https://maus.qqdl.site',
    'https://vogel.qqdl.site',
    'https://katze.qqdl.site',
    'https://hifi.401658.xyz',
    'https://ohio.monochrome.tf',
    'https://virginia.monochrome.tf',
    'https://oregon.monochrome.tf',
    'https://california.monochrome.tf',
    'https://frankfurt.monochrome.tf',
    'https://london.monochrome.tf',
    'https://singapore.monochrome.tf',
    'https://jakarta.monochrome.tf',
    'https://triton.squid.wtf',
    'https://aether.squid.wtf',
    'https://zeus.squid.wtf',
    'https://kraken.squid.wtf',
    'https://phoenix.squid.wtf',
    'https://shiva.squid.wtf',
    'https://chaos.squid.wtf',
    'https://hund.qqdl.site'
];

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

interface MirrorLatency {
    url: string;
    latency: number;
    isProxied: boolean;
}

export const testMirrorLatency = async (mirrorUrl: string, useProxy: boolean): Promise<MirrorLatency> => {
    let urlToFetch = mirrorUrl;
    if (useProxy) {
        urlToFetch = `${CORS_PROXY}${encodeURIComponent(mirrorUrl)}`;
    }
    const finalUrl = `${urlToFetch}/`; // Append '/' for root path check
    
    const start = performance.now();
    try {
        const response = await fetch(finalUrl, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            return { url: mirrorUrl, latency: Infinity, isProxied: useProxy };
        }
    } catch (error) {
        console.error(`Failed to test mirror latency for ${mirrorUrl} ${useProxy ? '(proxied)' : '(direct)'}:`, error);
        return { url: mirrorUrl, latency: Infinity, isProxied: useProxy };
    }
    const end = performance.now();
    return { url: mirrorUrl, latency: end - start, isProxied: useProxy };
};



// Mock settings class to supply instances
export class Settings extends EventTarget {
    private static instance: Settings;
    private rawSortedMirrors: MirrorLatency[] = []; // Store raw mirrors with latency and proxy status
    private lastSortTime: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        super(); // Call EventTarget constructor
        this.initializeMirrors();
    }

    public static getInstance(): Settings {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }

    private async initializeMirrors(): Promise<void> {

        const allMirrorResults: MirrorLatency[] = [];

        // First pass: Test all mirrors directly (without proxy)
        const directLatencyPromises = BASE_MIRRORS.map(mirror => testMirrorLatency(mirror, false));
        const directLatencies = await Promise.all(directLatencyPromises);
        
        const failedDirectMirrors = directLatencies.filter(ml => ml.latency === Infinity);
        const successfulDirectMirrors = directLatencies.filter(ml => ml.latency !== Infinity);
        allMirrorResults.push(...successfulDirectMirrors);

        // Second pass: For mirrors that failed direct test, try with proxy
        const proxiedLatencyPromises = failedDirectMirrors.map(ml => testMirrorLatency(ml.url, true));
        const proxiedLatencies = await Promise.all(proxiedLatencyPromises);
        allMirrorResults.push(...proxiedLatencies);

        // Combine and sort results
        this.rawSortedMirrors = allMirrorResults
            .sort((a, b) => {
                // Prioritize non-proxied if latencies are very similar
                if (Math.abs(a.latency - b.latency) < 10) { // Within 10ms
                    if (!a.isProxied && b.isProxied) return -1;
                    if (a.isProxied && !b.isProxied) return 1;
                }
                return a.latency - b.latency;
            });
        
        this.lastSortTime = Date.now();
        this.dispatchEvent(new CustomEvent('mirrorsUpdated', { detail: this.rawSortedMirrors }));
    }

    public async refreshMirrors(): Promise<void> {
        await this.initializeMirrors();
    }

    public getSortedMirrors(): MirrorLatency[] {
        return this.rawSortedMirrors;
    }

    public async getInstances(): Promise<string[]> {
        if (Date.now() - this.lastSortTime > this.CACHE_DURATION || this.rawSortedMirrors.length === 0) {
            await this.initializeMirrors();
        }
        // Return the best URL for each mirror, either direct or proxied, filtering out complete failures
        return this.rawSortedMirrors
            .filter(ml => ml.latency !== Infinity)
            .map(ml => ml.isProxied ? `${CORS_PROXY}${encodeURIComponent(ml.url)}` : ml.url);
    }
}