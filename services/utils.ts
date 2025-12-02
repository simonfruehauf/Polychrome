import { Track } from "../types";

export const RATE_LIMIT_ERROR_MESSAGE = "Rate limit reached. Please wait.";

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const deriveTrackQuality = (track: Track): string => {
  if (track.audioQuality === 'HI_RES') return 'HI_RES';
  if (track.audioQuality === 'LOSSLESS') return 'LOSSLESS';
  return 'HIGH';
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            console.warn(`Mirror ${mirrorUrl} ${useProxy ? '(proxied)' : '(direct)'} returned status ${response.status}`);
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
        console.log('Sorting mirrors by latency...');
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
        console.log('Mirrors sorted:', this.rawSortedMirrors.map(ml => 
            `${ml.url} (${ml.latency === Infinity ? 'Failed' : ml.latency.toFixed(0) + 'ms'}${ml.isProxied ? ', proxied' : ''})`
        ).join(', '));
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