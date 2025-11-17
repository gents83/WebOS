import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// A simplified version of the FileSystemItem for cloud files
export interface CloudFileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified?: string;
}

type Provider = 'google' | 'dropbox' | 'onedrive';

interface ProviderConfig {
  [key: string]: {
    authUrl: string;
    scope: string;
    extraParams?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class CloudStorageService {
  private http = inject(HttpClient);

  // --- Signals for UI State ---
  googleUser = signal<any>(null);
  dropboxUser = signal<any>(null);
  oneDriveUser = signal<any>(null);

  isGoogleConnected = computed(() => !!this.googleUser());
  isDropboxConnected = computed(() => !!this.dropboxUser());
  isOneDriveConnected = computed(() => !!this.oneDriveUser());

  private tokens = {
    google: signal<string | null>(null),
    dropbox: signal<string | null>(null),
    onedrive: signal<string | null>(null),
  };
  
  private clientIds = {
    google: signal<string | null>(null),
    dropbox: signal<string | null>(null),
    onedrive: signal<string | null>(null),
  };

  private readonly PROVIDER_CONFIG: ProviderConfig = {
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile',
      extraParams: '&response_type=token',
    },
    dropbox: {
      authUrl: 'https://www.dropbox.com/oauth2/authorize',
      scope: 'files.content.read',
      extraParams: '&response_type=token&token_access_type=online',
    },
    onedrive: {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      scope: 'files.read user.read',
      extraParams: '&response_type=token',
    },
  };
  
  constructor() {
    effect(() => localStorage.setItem('cs_google_token', this.tokens.google() ?? ''));
    effect(() => localStorage.setItem('cs_dropbox_token', this.tokens.dropbox() ?? ''));
    effect(() => localStorage.setItem('cs_onedrive_token', this.tokens.onedrive() ?? ''));

    effect(() => localStorage.setItem('cs_google_clientid', this.clientIds.google() ?? ''));
    effect(() => localStorage.setItem('cs_dropbox_clientid', this.clientIds.dropbox() ?? ''));
    effect(() => localStorage.setItem('cs_onedrive_clientid', this.clientIds.onedrive() ?? ''));
  }

  init() {
    // 1. Handle OAuth redirect
    if (window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const state = params.get('state');

      if (accessToken && state && (state === 'google' || state === 'dropbox' || state === 'onedrive')) {
        this.tokens[state].set(accessToken);
        window.location.hash = ''; // Clean up the URL
      }
    }

    // 2. Load tokens & Client IDs from storage
    this.tokens.google.set(localStorage.getItem('cs_google_token') || null);
    this.tokens.dropbox.set(localStorage.getItem('cs_dropbox_token') || null);
    this.tokens.onedrive.set(localStorage.getItem('cs_onedrive_token') || null);
    
    this.clientIds.google.set(localStorage.getItem('cs_google_clientid') || null);
    this.clientIds.dropbox.set(localStorage.getItem('cs_dropbox_clientid') || null);
    this.clientIds.onedrive.set(localStorage.getItem('cs_onedrive_clientid') || null);

    // 3. Fetch user profiles if tokens exist
    if(this.tokens.google()) this.fetchUserProfile('google');
    if(this.tokens.dropbox()) this.fetchUserProfile('dropbox');
    if(this.tokens.onedrive()) this.fetchUserProfile('onedrive');
  }

  setClientId(provider: Provider, clientId: string) {
    this.clientIds[provider].set(clientId);
  }

  getClientId(provider: Provider): string | null {
    return this.clientIds[provider]();
  }
  
  getRedirectUri(): string {
    return window.location.origin + window.location.pathname;
  }

  login(provider: Provider): Promise<void> {
    return new Promise((resolve, reject) => {
        const clientId = this.clientIds[provider]();
        if (!clientId) {
            return reject(`Client ID for ${provider} is not configured.`);
        }

        const config = this.PROVIDER_CONFIG[provider];
        const redirectUri = this.getRedirectUri();
        const url = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${provider}${config.extraParams}`;

        // Simple popup-based flow
        const authWindow = window.open(url, '_blank', 'width=500,height=600');
        
        const interval = setInterval(() => {
            try {
                if (authWindow?.closed) {
                    clearInterval(interval);
                    // After popup closes, re-init to check for new token
                    this.init(); 
                    if (this.isConnected(provider)) {
                        resolve();
                    } else {
                        reject('Authentication cancelled or failed.');
                    }
                }
            } catch (e) {
                // Cross-origin error, ignore
            }
        }, 500);
    });
}


  logout(provider: Provider) {
    this.tokens[provider].set(null);
    switch(provider) {
        case 'google': this.googleUser.set(null); break;
        case 'dropbox': this.dropboxUser.set(null); break;
        case 'onedrive': this.oneDriveUser.set(null); break;
    }
  }

  isConnected = (provider: Provider) => !!this.tokens[provider]();
  
  private async fetchUserProfile(provider: Provider) {
    const token = this.tokens[provider]();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    
    try {
        switch(provider) {
            case 'google':
                const gUser = await firstValueFrom(this.http.get<any>('https://www.googleapis.com/oauth2/v2/userinfo', { headers }));
                this.googleUser.set({ name: gUser.name, email: gUser.email });
                break;
            case 'dropbox':
                const dbUser = await firstValueFrom(this.http.post<any>('https://api.dropboxapi.com/2/users/get_current_account', null, { headers }));
                this.dropboxUser.set({ name: dbUser.name.display_name, email: dbUser.email });
                break;
            case 'onedrive':
                const odUser = await firstValueFrom(this.http.get<any>('https://graph.microsoft.com/v1.0/me', { headers }));
                this.oneDriveUser.set({ name: odUser.displayName, email: odUser.userPrincipalName });
                break;
        }
    } catch(e) {
        console.error(`Failed to fetch ${provider} user profile`, e);
        this.logout(provider); // Token is likely invalid
    }
  }

  async getFiles(provider: Provider, folderId: string = ''): Promise<CloudFileItem[]> {
    const token = this.tokens[provider]();
    if (!token) throw new Error('Not authenticated');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    try {
        switch(provider) {
            case 'google':
                const gParams = { q: `'${folderId || 'root'}' in parents and trashed=false`, fields: 'files(id, name, mimeType, modifiedTime, size)' };
                const gRes = await firstValueFrom(this.http.get<any>('https://www.googleapis.com/drive/v3/files', { headers, params: gParams }));
                return (gRes.files || []).map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
                    modified: f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : undefined,
                    size: f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : undefined,
                }));
            case 'dropbox':
                const dbBody = { path: folderId === '' ? '' : `/${folderId}`, include_media_info: false };
                const dbRes = await firstValueFrom(this.http.post<any>('https://api.dropboxapi.com/2/files/list_folder', dbBody, { headers }));
                return (dbRes.entries || []).map((f: any) => ({
                    id: f.name, // Dropbox path-based, name is the ID here for simplicity in this browser
                    name: f.name,
                    type: f['.tag'] === 'folder' ? 'folder' : 'file',
                    modified: f.server_modified ? new Date(f.server_modified).toLocaleString() : undefined,
                    size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : undefined,
                }));
            case 'onedrive':
                const odUrl = folderId ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children` : 'https://graph.microsoft.com/v1.0/me/drive/root/children';
                const odRes = await firstValueFrom(this.http.get<any>(odUrl, { headers }));
                return (odRes.value || []).map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    type: f.folder ? 'folder' : 'file',
                    modified: f.lastModifiedDateTime ? new Date(f.lastModifiedDateTime).toLocaleString() : undefined,
                    size: f.size ? `${(f.size / 1024).toFixed(1)} KB` : undefined,
                }));
        }
    } catch (e) {
        console.error(`Failed to get files for ${provider}`, e);
        this.logout(provider); // Token might be expired
        throw e;
    }
    return [];
  }
}