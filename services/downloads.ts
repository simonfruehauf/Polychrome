// services/downloads.ts
import JSZip from 'jszip';
import { buildTrackFilename, sanitizeForFilename, RATE_LIMIT_ERROR_MESSAGE, getTrackTitle, getTrackArtists, formatTemplate } from './utils';
import { api } from './api'; // Assuming 'api' is an instance of LosslessAPI
import { Track, Album, Artist, Playlist } from '../types'; // Assuming these types exist

const downloadTasks = new Map<string, { taskEl: HTMLDivElement, abortController: AbortController }>();
let downloadNotificationContainer: HTMLDivElement | null = null;

function createDownloadNotification(): HTMLDivElement {
    if (!downloadNotificationContainer) {
        downloadNotificationContainer = document.createElement('div');
        downloadNotificationContainer.id = 'download-notifications';
        document.body.appendChild(downloadNotificationContainer);
    }
    return downloadNotificationContainer;
}

export function addDownloadTask(trackId: string, track: Track, filename: string): { taskEl: HTMLDivElement, abortController: AbortController } {
    const container = createDownloadNotification();

    const taskEl = document.createElement('div');
    taskEl.className = 'download-task';
    taskEl.dataset.trackId = trackId;
    const trackTitle = getTrackTitle(track);
    taskEl.innerHTML = `
        <div style="display: flex; align-items: start; gap: 0.75rem;">
            <img src="${api.getCoverUrl(track.album?.cover, '80')}"
                 style="width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 500; font-size: 0.9rem; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trackTitle}</div>
                <div style="font-size: 0.8rem; color: var(--muted-foreground); margin-bottom: 0.5rem;">${track.artist?.name || 'Unknown'}</div>
                <div class="download-progress-bar" style="height: 4px; background: var(--secondary); border-radius: 2px; overflow: hidden;">
                    <div class="download-progress-fill" style="width: 0%; height: 100%; background: var(--highlight); transition: width 0.2s;"></div>
                </div>
                <div class="download-status" style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.25rem;">Starting...</div>
            </div>
            <button class="download-cancel" style="background: transparent; border: none; color: var(--muted-foreground); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;

    container.appendChild(taskEl);

    const abortController = new AbortController();
    downloadTasks.set(trackId, { taskEl, abortController });

    taskEl.querySelector('.download-cancel')?.addEventListener('click', () => {
        abortController.abort();
        removeDownloadTask(trackId);
    });

    return { taskEl, abortController };
}

export function updateDownloadProgress(trackId: string, progress: { stage: string; receivedBytes: number; totalBytes?: number }): void {
    const task = downloadTasks.get(trackId);
    if (!task) return;

    const { taskEl } = task;
    const progressFill = taskEl.querySelector('.download-progress-fill') as HTMLDivElement;
    const statusEl = taskEl.querySelector('.download-status') as HTMLDivElement;

    if (progress.stage === 'downloading') {
        const percent = progress.totalBytes
            ? Math.round((progress.receivedBytes / progress.totalBytes) * 100)
            : 0;

        progressFill.style.width = `${percent}%`;

        const receivedMB = (progress.receivedBytes / (1024 * 1024)).toFixed(1);
        const totalMB = progress.totalBytes
            ? (progress.totalBytes / (1024 * 1024)).toFixed(1)
            : '?';

        statusEl.textContent = `Downloading: ${receivedMB}MB / ${totalMB}MB (${percent}%)`;
    }
}

export function completeDownloadTask(trackId: string, success = true, message: string | null = null): void {
    const task = downloadTasks.get(trackId);
    if (!task) return;

    const { taskEl } = task;
    const progressFill = taskEl.querySelector('.download-progress-fill') as HTMLDivElement;
    const statusEl = taskEl.currentTrack = null;taskEl.querySelector('.download-status') as HTMLDivElement;
    const cancelBtn = taskEl.querySelector('.download-cancel') as HTMLButtonElement;

    if (success) {
        progressFill.style.width = '100%';
        progressFill.style.background = '#10b981';
        statusEl.textContent = '✓ Downloaded';
        statusEl.style.color = '#10b981';
        if(cancelBtn) cancelBtn.remove();

        setTimeout(() => removeDownloadTask(trackId), 3000);
    } else {
        progressFill.style.background = '#ef4444';
        statusEl.textContent = message || '✗ Download failed';
        statusEl.style.color = '#ef4444';
        if(cancelBtn) {
            cancelBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            cancelBtn.onclick = () => removeDownloadTask(trackId);
        }

        setTimeout(() => removeDownloadTask(trackId), 5000);
    }
}

function removeDownloadTask(trackId: string): void {
    const task = downloadTasks.get(trackId);
    if (!task) return;

    const { taskEl } = task;
    taskEl.style.animation = 'slideOut 0.3s ease';

    setTimeout(() => {
        taskEl.remove();
        downloadTasks.delete(trackId);

        if (downloadNotificationContainer && downloadNotificationContainer.children.length === 0) {
            downloadNotificationContainer.remove();
            downloadNotificationContainer = null;
        }
    }, 300);
}

async function downloadTrackBlob(track: Track, quality: string): Promise<Blob> {
    const lookup = await api.getTrack(track.id, quality);
    let streamUrl;

    if (lookup.originalTrackUrl) {
        streamUrl = lookup.originalTrackUrl;
    } else {
        streamUrl = api.extractStreamUrlFromManifest(lookup.info.manifest);
        if (!streamUrl) {
            throw new Error('Could not resolve stream URL');
        }
    }

    const response = await fetch(streamUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
}

export async function downloadAlbumAsZip(album: Album, tracks: Track[], quality: string): Promise<void> {
    const zip = new JSZip();

    const template = localStorage.getItem('zip-folder-template') || '{albumTitle} - {albumArtist} - monochrome.tf';
    const folderName = formatTemplate(template, {
        albumTitle: album.title,
        albumArtist: album.artist?.name,
        year: new Date(album.releaseDate).getFullYear()
    });

    const notification = createBulkDownloadNotification('album', album.title, tracks.length);

    try {
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const filename = buildTrackFilename(track, quality);
            const trackTitle = getTrackTitle(track);

            updateBulkDownloadProgress(notification, i, tracks.length, trackTitle);

            const blob = await downloadTrackBlob(track, quality);
            zip.file(`${folderName}/${filename}`, blob);
        }

        updateBulkDownloadProgress(notification, tracks.length, tracks.length, 'Creating ZIP...');

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        completeBulkDownload(notification, true);
    } catch (error: any) {
        completeBulkDownload(notification, false, error.message);
        throw error;
    }
}

export async function downloadPlaylistAsZip(playlist: Playlist, tracks: Track[], quality: string): Promise<void> {
    const zip = new JSZip();

    const template = localStorage.getItem('zip-folder-template') || '{playlistTitle} - {playlistArtist} - monochrome.tf'; // Changed template key names
    const folderName = formatTemplate(template, {
        playlistTitle: playlist.title,
        playlistArtist: playlist.creator, // Assuming creator is the artist for a playlist
        year: new Date().getFullYear()
    });

    const notification = createBulkDownloadNotification('playlist', playlist.title, tracks.length);

    try {
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const filename = buildTrackFilename(track, quality);
            const trackTitle = getTrackTitle(track);

            updateBulkDownloadProgress(notification, i, tracks.length, trackTitle);

            const blob = await downloadTrackBlob(track, quality);
            zip.file(`${folderName}/${filename}`, blob);
        }

        updateBulkDownloadProgress(notification, tracks.length, tracks.length, 'Creating ZIP...');

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        completeBulkDownload(notification, true);
    } catch (error: any) {
        completeBulkDownload(notification, false, error.message);
        throw error;
    }
}

export async function downloadDiscography(artist: Artist, albums: Album[], quality: string): Promise<void> {
    const zip = new JSZip();

    const template = localStorage.getItem('zip-folder-template') || '{albumTitle} - {albumArtist} - monochrome.tf';
    const rootFolder = `${sanitizeForFilename(artist.name)} discography - monochrome.tf`;

    const totalAlbums = albums.length;
    const notification = createBulkDownloadNotification('discography', artist.name, totalAlbums);

    try {
        for (let albumIndex = 0; albumIndex < albums.length; albumIndex++) {
            const album = albums[albumIndex];

            updateBulkDownloadProgress(notification, albumIndex, totalAlbums, album.title);

            try {
                const { tracks } = await api.getAlbum(album.id); // Assuming api.getAlbum returns { album: Album, tracks: Track[] }
                const albumFolder = formatTemplate(template, {
                    albumTitle: album.title,
                    albumArtist: album.artist?.name,
                    year: new Date(album.releaseDate).getFullYear()
                });

                for (const track of tracks) {
                    const filename = buildTrackFilename(track, quality);
                    const blob = await downloadTrackBlob(track, quality);
                    zip.file(`${rootFolder}/${albumFolder}/${filename}`, blob);
                }
            } catch (error) {
                console.error(`Failed to download album ${album.title}:`, error);
            }
        }

        updateBulkDownloadProgress(notification, totalAlbums, totalAlbums, 'Creating ZIP...');

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rootFolder}.zip`;
        document.body.appendChild(a);
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        completeBulkDownload(notification, true);
    } catch (error: any) {
        completeBulkDownload(notification, false, error.message);
        throw error;
    }
}

function createBulkDownloadNotification(type: string, name: string, totalItems: number): HTMLDivElement {
    const container = createDownloadNotification();

    const notifEl = document.createElement('div');
    notifEl.className = 'download-task bulk-download';

    const typeLabel = type === 'album' ? 'Album' : type === 'playlist' ? 'Playlist' : 'Discography';

    notifEl.innerHTML = `
        <div style="display: flex; align-items: start; gap: 0.75rem;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">
                    Downloading ${typeLabel}
                </div>
                <div style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
                <div class="download-progress-bar" style="height: 4px; background: var(--secondary); border-radius: 2px; overflow: hidden;">
                    <div class="download-progress-fill" style="width: 0%; height: 100%; background: var(--highlight); transition: width 0.2s;"></div>
                </div>
                <div class="download-status" style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.25rem;">Starting...</div>
            </div>
        </div>
    `;

    container.appendChild(notifEl);
    return notifEl;
}

function updateBulkDownloadProgress(notifEl: HTMLDivElement, current: number, total: number, currentItem: string): void {
    const progressFill = notifEl.querySelector('.download-progress-fill') as HTMLDivElement;
    const statusEl = notifEl.querySelector('.download-status') as HTMLDivElement;

    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    statusEl.textContent = `${current}/${total} - ${currentItem}`;
}

function completeBulkDownload(notifEl: HTMLDivElement, success = true, message: string | null = null): void {
    const progressFill = notifEl.querySelector('.download-progress-fill') as HTMLDivElement;
    const statusEl = notifEl.querySelector('.download-status') as HTMLDivElement;

    if (success) {
        progressFill.style.width = '100%';
        progressFill.style.background = '#10b981';
        statusEl.textContent = '✓ Download complete';
        statusEl.style.color = '#10b981';

        setTimeout(() => {
            notifEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notifEl.remove(), 300);
        }, 3000);
    } else {
        progressFill.style.background = '#ef4444';
        statusEl.textContent = message || '✗ Download failed';
        statusEl.style.color = '#ef4444';

        setTimeout(() => {
            notifEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notifEl.remove(), 300);
        }, 5000);
    }
}

export async function downloadCurrentTrack(track: Track, quality: string): Promise<void> {
    if (!track) {
        alert('No track is currently playing'); // This should ideally be a toast
        return;
    }

    const filename = buildTrackFilename(track, quality);

    try {
        const { taskEl, abortController } = addDownloadTask(
            track.id.toString(), // Ensure track.id is a string for map key
            track,
            filename
        );

        await api.downloadTrack(track.id, quality, filename, {
            signal: abortController.signal,
            onProgress: (progress) => {
                updateDownloadProgress(track.id.toString(), progress);
            }
        });

        completeDownloadTask(track.id.toString(), true);
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            const errorMsg = error.message === RATE_LIMIT_ERROR_MESSAGE
                ? error.message
                : 'Download failed. Please try again.';
            completeDownloadTask(track.id.toString(), false, errorMsg);
        }
    }
}