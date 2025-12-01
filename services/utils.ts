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

// Mock settings class to supply instances
export class Settings {
    async getInstances(): Promise<string[]> {
        // Using corsproxy.io to bypass CORS restrictions in the browser environment
        const proxy = 'https://corsproxy.io/?';
        return [
            `${proxy}https://tidal.kinoplus.online`,
            `${proxy}https://api.tidalhifi.com` 
        ];
    }
}