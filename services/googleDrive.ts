import { UserPlaylist } from '../types';

export interface GoogleDrivePlaylist {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private readonly STORAGE_SPACE = 'appDataFolder'; // Completely hidden from users

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetchFromGoogleDrive(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('Access token not set. Please sign in first.');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Access token expired or invalid');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Drive API error: ${error.error?.message || response.statusText}`);
    }

    return response;
  }

  async savePlaylist(playlist: UserPlaylist): Promise<string> {
    try {
      const fileContent = JSON.stringify(playlist, null, 2);

      // Check if file already exists in appDataFolder
      const searchResponse = await this.fetchFromGoogleDrive(
        `/files?q=name='${playlist.name}.json' and 'appDataFolder' in parents and trashed=false&spaces=appDataFolder&pageSize=1`
      );
      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        // Update existing file
        const fileId = searchData.files[0].id;
        const response = await this.fetchFromGoogleDrive(
          `/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            body: fileContent,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        await response.json();
        return fileId;
      }

      // Create new file with proper multipart format
      const metadata = {
        name: `${playlist.name}.json`,
        mimeType: 'application/json',
        parents: [this.STORAGE_SPACE],
        appProperties: {
          'polychrome-internal': 'true',
          'app': 'polychrome-music-player'
        },
        properties: {
          'polychrome-internal': 'true'
        }
      };

      const boundary = '===============1234567890==';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Failed to create playlist: ${error.error?.message || createResponse.statusText}`);
      }

      const createData = await createResponse.json();
      return createData.id;
    } catch (error) {
      console.error('Error saving playlist to Google Drive:', error);
      throw error;
    }
  }


  async getPlaylist(playlistName: string): Promise<UserPlaylist | null> {
    try {
      const searchResponse = await this.fetchFromGoogleDrive(
        `/files?q=name='${playlistName}.json' and 'appDataFolder' in parents and trashed=false&spaces=appDataFolder&pageSize=1`
      );
      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        return null;
      }

      const fileId = searchData.files[0].id;
      const fileResponse = await this.fetchFromGoogleDrive(`/files/${fileId}?alt=media`);
      const playlist = await fileResponse.json();
      return playlist;
    } catch (error) {
      console.error('Error getting playlist from Google Drive:', error);
      return null;
    }
  }

  async listPlaylists(): Promise<GoogleDrivePlaylist[]> {
    try {
      const response = await this.fetchFromGoogleDrive(
        `/files?q=trashed=false&spaces=appDataFolder&pageSize=100`
      );
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing playlists from Google Drive:', error);
      return [];
    }
  }

  async deletePlaylist(playlistName: string): Promise<boolean> {
    try {
      const searchResponse = await this.fetchFromGoogleDrive(
        `/files?q=name='${playlistName}.json' and 'appDataFolder' in parents and trashed=false&spaces=appDataFolder&pageSize=1`
      );
      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        return false;
      }

      const fileId = searchData.files[0].id;
      await this.fetchFromGoogleDrive(`/files/${fileId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Error deleting playlist from Google Drive:', error);
      return false;
    }
  }

  async loadAllPlaylists(): Promise<{ playlists: any[], success: boolean }> {
    try {
      const files = await this.listPlaylists();
      const playlists: any[] = [];

      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const fileResponse = await this.fetchFromGoogleDrive(`/files/${file.id}?alt=media`);
            const playlist = await fileResponse.json();
            playlist.syncedToGoogle = true; // Mark as synced since we loaded from drive
            playlists.push(playlist);
          } catch (error) {
            console.error(`Error loading playlist ${file.name}:`, error);
          }
        }
      }

      return { playlists, success: true };
    } catch (error) {
      console.error('Error loading all playlists from Google Drive:', error);
      return { playlists: [], success: false };
    }
  }
}

export const googleDriveService = new GoogleDriveService();