import { APICache } from './cache';
import { Settings, delay, deriveTrackQuality, RATE_LIMIT_ERROR_MESSAGE } from './utils';
import { Track, Album, Artist, ArtistDetails, AlbumDetails, SearchResult, Playlist } from '../types';

export const DASH_MANIFEST_UNAVAILABLE_CODE = 'DASH_MANIFEST_UNAVAILABLE';

export class LosslessAPI {
    private settings: Settings;
    private cache: APICache;
    private streamCache: Map<string, string>;

    constructor() {
        this.settings = Settings.getInstance();
        this.cache = new APICache({
            maxSize: 200,
            ttl: 1000 * 60 * 30
        });
        this.streamCache = new Map();

        setInterval(() => {
            this.cache.clearExpired();
            this.pruneStreamCache();
        }, 1000 * 60 * 5);
    }

    private pruneStreamCache() {
        if (this.streamCache.size > 50) {
            const entries = Array.from(this.streamCache.entries());
            const toDelete = entries.slice(0, entries.length - 50);
            toDelete.forEach(([key]) => this.streamCache.delete(key));
        }
    }

    private async fetchWithRetry(relativePath: string, options: { signal?: AbortSignal } = {}): Promise<Response> {
        const instances = await this.settings.getInstances();
        if (instances.length === 0) {
            throw new Error("No API instances configured.");
        }

        const maxRetries = 3;
        let lastError: any = null;

        for (const baseUrl of instances) {
            const url = baseUrl.endsWith('/')
                ? `${baseUrl}${relativePath.substring(1)}`
                : `${baseUrl}${relativePath}`;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, { 
                        signal: options.signal,
                        mode: 'cors'
                    });

                    if (response.status === 429) {
                        throw new Error(RATE_LIMIT_ERROR_MESSAGE);
                    }

                    if (response.ok) {
                        return response;
                    }

                    if (response.status === 401) {
                         if (attempt < maxRetries) {
                            await delay(200 * attempt);
                            continue;
                        }
                    }

                    if (response.status >= 500 && attempt < maxRetries) {
                        await delay(200 * attempt);
                        continue;
                    }

                    lastError = new Error(`Request to ${url} failed with status ${response.status}`);
                    break;

                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        throw error;
                    }

                    lastError = error;

                    if (attempt < maxRetries) {
                        await delay(200 * attempt);
                    }
                }
            }
        }

        throw lastError || new Error(`All API instances failed for: ${relativePath}`);
    }

    private findSearchSection(source: any, key: string, visited: Set<any>): any {
        if (!source || typeof source !== 'object') return;

        if (Array.isArray(source)) {
            for (const e of source) {
                const f = this.findSearchSection(e, key, visited);
                if (f) return f;
            }
            return;
        }

        if (visited.has(source)) return;
        visited.add(source);

        if ('items' in source && Array.isArray(source.items)) return source;

        if (key in source) {
            const f = this.findSearchSection(source[key], key, visited);
            if (f) return f;
        }

        for (const v of Object.values(source)) {
            const f = this.findSearchSection(v, key, visited);
            if (f) return f;
        }
    }

    private buildSearchResponse(section: any): SearchResult {
        const items = section?.items ?? [];
        return {
            items,
            limit: section?.limit ?? items.length,
            offset: section?.offset ?? 0,
            totalNumberOfItems: section?.totalNumberOfItems ?? items.length
        };
    }

    private normalizeSearchResponse(data: any, key: string): SearchResult {
        const section = this.findSearchSection(data, key, new Set());
        return this.buildSearchResponse(section);
    }

    private prepareTrack(track: any): Track {
        let normalized = track;

        if (!track.artist && Array.isArray(track.artists) && track.artists.length > 0) {
            normalized = { ...track, artist: track.artists[0] };
        }

        const derivedQuality = deriveTrackQuality(normalized);
        if (derivedQuality && normalized.audioQuality !== derivedQuality) {
            normalized = { ...normalized, audioQuality: derivedQuality };
        }

        return normalized as Track;
    }

    private prepareAlbum(album: any): Album {
        if (!album.artist && Array.isArray(album.artists) && album.artists.length > 0) {
            return { ...album, artist: album.artists[0] };
        }
        return album as Album;
    }

    private prepareArtist(artist: any): Artist {
        if (!artist.type && Array.isArray(artist.artistTypes) && artist.artistTypes.length > 0) {
            return { ...artist, type: artist.artistTypes[0] };
        }
        return artist as Artist;
    }

    private parseTrackLookup(data: any): { track: Track, info: any, originalTrackUrl?: string } {
        const entries = Array.isArray(data) ? data : [data];
        let track, info, originalTrackUrl;

        for (const entry of entries) {
            if (!entry || typeof entry !== 'object') continue;

            if (!track && 'duration' in entry) {
                track = entry;
                continue;
            }

            if (!info && 'manifest' in entry) {
                info = entry;
                continue;
            }

            if (!originalTrackUrl && 'OriginalTrackUrl' in entry) {
                const candidate = entry.OriginalTrackUrl;
                if (typeof candidate === 'string') {
                    originalTrackUrl = candidate;
                }
            }
        }

        if (!track || !info) {
             if(track) return { track, info: {} };
             throw new Error('Malformed track response');
        }

        return { track, info, originalTrackUrl };
    }

    public extractStreamUrlFromManifest(manifest: string): string | null {
        try {
            const decoded = atob(manifest);

            try {
                const parsed = JSON.parse(decoded);
                if (parsed?.urls?.[0]) {
                    return parsed.urls[0];
                }
            } catch {
                const match = decoded.match(/https?:\/\/[\w\-.~:?#[@!$&'()*+,;=%/]+/);
                return match ? match[0] : null;
            }
        } catch (error) {
            console.error('Failed to decode manifest:', error);
            return null;
        }
        return null;
    }

    async searchTracks(query: string): Promise<SearchResult> {
        const cached = await this.cache.get<SearchResult>('search_tracks', query);
        if (cached) return cached;

        try {
            const response = await this.fetchWithRetry(`/search/?s=${encodeURIComponent(query)}`);
            const data = await response.json();
            const normalized = this.normalizeSearchResponse(data, 'tracks');
            const result = {
                ...normalized,
                items: normalized.items.map(t => this.prepareTrack(t))
            };

            await this.cache.set('search_tracks', query, result);
            return result;
        } catch (error) {
            console.error('Track search failed:', error);
            return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
        }
    }

    async searchArtists(query: string): Promise<SearchResult> {
        const cached = await this.cache.get<SearchResult>('search_artists', query);
        if (cached) return cached;

        try {
            const response = await this.fetchWithRetry(`/search/?a=${encodeURIComponent(query)}`);
            const data = await response.json();
            const normalized = this.normalizeSearchResponse(data, 'artists');
            const result = {
                ...normalized,
                items: normalized.items.map(a => this.prepareArtist(a))
            };

            await this.cache.set('search_artists', query, result);
            return result;
        } catch (error) {
            console.error('Artist search failed:', error);
            return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
        }
    }

    async searchAlbums(query: string): Promise<SearchResult> {
        const cached = await this.cache.get<SearchResult>('search_albums', query);
        if (cached) return cached;

        try {
            const response = await this.fetchWithRetry(`/search/?al=${encodeURIComponent(query)}`);
            const data = await response.json();
            const normalized = this.normalizeSearchResponse(data, 'albums');
            const result = {
                ...normalized,
                items: normalized.items.map(a => this.prepareAlbum(a))
            };

            await this.cache.set('search_albums', query, result);
            return result;
        } catch (error) {
            console.error('Album search failed:', error);
            return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
        }
    }

    async getAlbum(id: string | number): Promise<AlbumDetails> {
        const cached = await this.cache.get<AlbumDetails>('album', id);
        if (cached) return cached;

        const response = await this.fetchWithRetry(`/album/?id=${id}`);
        const data = await response.json();
        const entries = Array.isArray(data) ? data : [data];

        let album: Album | undefined, tracksSection: any;

        for (const entry of entries) {
            if (!entry || typeof entry !== 'object') continue;

            if (!album && 'numberOfTracks' in entry) {
                album = this.prepareAlbum(entry);
            }

            if (!tracksSection && 'items' in entry) {
                tracksSection = entry;
            }
        }

        if (!album) throw new Error('Album not found');

        const tracks = (tracksSection?.items || []).map((i: any) => this.prepareTrack(i.item || i));
        const result = { album, tracks };

        await this.cache.set('album', id, result);
        return result;
    }

    async getArtist(artistId: string | number): Promise<ArtistDetails> {
        const cached = await this.cache.get<ArtistDetails>('artist', artistId);
        if (cached) return cached;

        const [primaryResponse, contentResponse] = await Promise.all([
            this.fetchWithRetry(`/artist/?id=${artistId}`),
            this.fetchWithRetry(`/artist/?f=${artistId}`)
        ]);

        const primaryData = await primaryResponse.json();
        const rawArtist = Array.isArray(primaryData) ? primaryData[0] : primaryData;

        if (!rawArtist) throw new Error('Primary artist details not found.');

        const artist: Artist = {
            ...this.prepareArtist(rawArtist),
            picture: rawArtist.picture || null,
            name: rawArtist.name || 'Unknown Artist'
        };

        const contentData = await contentResponse.json();
        const entries = Array.isArray(contentData) ? contentData : [contentData];

        const albumMap = new Map();
        const trackMap = new Map();

        const isTrack = (v: any) => v?.id && v.duration && v.album;
        const isAlbum = (v: any) => v?.id && 'numberOfTracks' in v;

        const scan = (value: any, visited = new Set()) => {
            if (!value || typeof value !== 'object' || visited.has(value)) return;
            visited.add(value);

            if (Array.isArray(value)) {
                value.forEach(item => scan(item, visited));
                return;
            }

            const item = value.item || value;
            if (isAlbum(item)) albumMap.set(item.id, this.prepareAlbum(item));
            if (isTrack(item)) trackMap.set(item.id, this.prepareTrack(item));

            Object.values(value).forEach(nested => scan(nested, visited));
        };

        entries.forEach(entry => scan(entry));

        const albums = Array.from(albumMap.values()).sort((a: any, b: any) =>
            new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()
        );

        const tracks = Array.from(trackMap.values())
            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 10);

        const result = { ...artist, albums, tracks };

        await this.cache.set('artist', artistId, result);
        return result;
    }

    async getPlaylist(id: string | number): Promise<{ playlist: Playlist, tracks: Track[] }> {
        const cached = await this.cache.get<{ playlist: Playlist, tracks: Track[] }>('playlist', id);
        if (cached) return cached;

        const response = await this.fetchWithRetry(`/playlist/?id=${id}`);
        const data = await response.json();
        const entries = Array.isArray(data) ? data : [data];

        let playlist: any, tracksSection: any;

        for (const entry of entries) {
            if (!entry || typeof entry !== 'object') continue;

            if (!playlist && ('uuid' in entry || 'numberOfTracks' in entry)) {
                playlist = entry;
            }

            if (!tracksSection && 'items' in entry) {
                tracksSection = entry;
            }
        }

        if (!playlist) throw new Error('Playlist not found');

        const tracks = (tracksSection?.items || []).map((i: any) => this.prepareTrack(i.item || i));
        
        // Normalize playlist object
        const normalizedPlaylist: Playlist = {
            uuid: playlist.uuid || playlist.id,
            title: playlist.title,
            numberOfTracks: playlist.numberOfTracks,
            image: playlist.image || playlist.uuid,
            creator: playlist.creator
        };

        const result = { playlist: normalizedPlaylist, tracks };

        await this.cache.set('playlist', id, result);
        return result;
    }

    async getTrack(id: string | number, quality = 'LOSSLESS'): Promise<{ track: Track, info: any, originalTrackUrl?: string }> {
        const cacheKey = `${id}_${quality}`;
        const cached = await this.cache.get<any>('track', cacheKey);
        if (cached) return cached;

        const response = await this.fetchWithRetry(`/track/?id=${id}&quality=${quality}`);
        const result = this.parseTrackLookup(await response.json());

        await this.cache.set('track', cacheKey, result);
        return result;
    }

    async getStreamUrl(id: string | number, quality = 'LOSSLESS'): Promise<string> {
        const cacheKey = `stream_${id}_${quality}`;

        if (this.streamCache.has(cacheKey)) {
            return this.streamCache.get(cacheKey) as string;
        }

        const lookup = await this.getTrack(id, quality);

        let streamUrl;
        if (lookup.originalTrackUrl) {
            streamUrl = lookup.originalTrackUrl;
        } else if (lookup.info && lookup.info.manifest) {
            streamUrl = this.extractStreamUrlFromManifest(lookup.info.manifest);
        }

        if (!streamUrl) {
            console.error('Lookup failed for ID:', id, lookup);
            throw new Error('Could not resolve stream URL. Track might be restricted or manifest unavailable.');
        }

        this.streamCache.set(cacheKey, streamUrl);
        return streamUrl;
    }

    getCoverUrl(id?: string, size = '1280'): string {
        if (!id) {
            return `https://picsum.photos/300/300?grayscale`;
        }
        const formattedId = id.replace(/-/g, '/');
        return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
    }

    getArtistPictureUrl(id?: string, size = '750'): string {
        if (!id) {
            return `https://picsum.photos/300/300?blur`;
        }
        const formattedId = id.replace(/-/g, '/');
        return `https://resources.tidal.com/images/${formattedId}/${size}x${size}.jpg`;
    }
}

export const api = new LosslessAPI();