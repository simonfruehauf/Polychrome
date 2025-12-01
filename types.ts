export interface Track {
  id: number | string;
  title: string;
  duration: number;
  trackNumber: number;
  volumeNumber: number;
  isrc?: string;
  audioQuality?: string;
  artist?: Artist;
  artists?: Artist[];
  album?: Album;
  url?: string;
  originalTrackUrl?: string; // Sometimes provided directly
  info?: {
    manifest?: string; // Base64 DASH manifest
  };
}

export interface Album {
  id: number | string;
  title: string;
  cover: string; // uuid
  releaseDate?: string;
  artist?: Artist;
  artists?: Artist[];
  numberOfTracks?: number;
}

export interface Artist {
  id: number | string;
  name: string;
  picture?: string; // uuid
  type?: string;
}

export interface Playlist {
  uuid: string;
  title: string;
  numberOfTracks: number;
  image?: string;
  creator?: { name: string };
}

export interface SearchResult {
  items: any[]; // Can be Track[], Album[], etc.
  limit: number;
  offset: number;
  totalNumberOfItems: number;
}

export interface ArtistDetails extends Artist {
  albums: Album[];
  tracks: Track[];
}

export interface AlbumDetails {
  album: Album;
  tracks: Track[];
}

export interface UserPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  syncedToGoogle: boolean;
}

export type Quality = 'LOW' | 'HIGH' | 'LOSSLESS' | 'HI_RES';