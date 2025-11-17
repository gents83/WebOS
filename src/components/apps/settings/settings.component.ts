import { Component, ChangeDetectionStrategy, signal, inject, afterNextRender, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesktopService } from '../../../services/desktop.service';
import { CloudStorageService } from '../../../services/cloud-storage.service';
import { AppManagerService } from '../../../services/app-manager.service';
import { IconService } from '../../../services/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../../services/app-state.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  desktopService = inject(DesktopService);
  cloudStorageService = inject(CloudStorageService);
  appManagerService = inject(AppManagerService);
  iconService = inject(IconService);
  appStateService = inject(AppStateService);
  activeSection = signal('Personalization');

  googleUser = this.cloudStorageService.googleUser;
  dropboxUser = this.cloudStorageService.dropboxUser;
  oneDriveUser = this.cloudStorageService.oneDriveUser;

  isGoogleConnected = this.cloudStorageService.isGoogleConnected;
  isDropboxConnected = this.cloudStorageService.isDropboxConnected;
  isOneDriveConnected = this.cloudStorageService.isOneDriveConnected;

  googleClientIdInput = signal('');
  dropboxClientIdInput = signal('');
  oneDriveClientIdInput = signal('');

  showGoogleHelp = signal(false);
  showDropboxHelp = signal(false);
  showOneDriveHelp = signal(false);

  menuItems = [
    { id: 'System', name: 'System', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>' },
    { id: 'Bluetooth', name: 'Bluetooth & devices', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 3.83l1.88 1.88L13 7.59V3.83zm1.88 16.46L13 18.41v-3.76l1.88 1.88z"/></svg>' },
    { id: 'Network', name: 'Network & internet', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1h-2v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>' },
    { id: 'Personalization', name: 'Personalization', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>' },
    { id: 'App Icons', name: 'App Icons', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>'},
    { id: 'Cloud Storage', name: 'Cloud Storage', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>' },
    { id: 'Apps', name: 'Apps', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>' },
    { id: 'Accounts', name: 'Accounts', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>' },
    { id: 'Time', name: 'Time & language', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>' },
    { id: 'Gaming', name: 'Gaming', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>' },
    { id: 'Accessibility', name: 'Accessibility', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-5v12h-2v-6h-2v6H8V9H3V7h18v2z"/></svg>' },
    { id: 'Privacy', name: 'Privacy & security', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>' },
    { id: 'Update', name: 'Windows Update', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>' },
  ];
  
  wallpapers = [
    { name: 'Bloom', url: 'https://picsum.photos/id/11/1920/1080', thumb: 'https://picsum.photos/id/11/200/110' },
    { name: 'Cosmic Fusion', url: 'https://picsum.photos/id/12/1920/1080', thumb: 'https://picsum.photos/id/12/200/110' },
    { name: 'Mountain Peak', url: 'https://picsum.photos/id/15/1920/1080', thumb: 'https://picsum.photos/id/15/200/110' },
    { name: 'Forest', url: 'https://picsum.photos/id/22/1920/1080', thumb: 'https://picsum.photos/id/22/200/110' },
    { name: 'City Night', url: 'https://picsum.photos/id/27/1920/1080', thumb: 'https://picsum.photos/id/27/200/110' },
    { name: 'Abstract', url: 'https://picsum.photos/id/33/1920/1080', thumb: 'https://picsum.photos/id/33/200/110' },
  ];

  displayedApps = this.appStateService.launchableApps;
  
  constructor() {
    this.appManagerService.navigateToSection$.pipe(
      takeUntilDestroyed()
    ).subscribe(sectionId => {
      if (this.menuItems.some(item => item.id === sectionId)) {
        this.activeSection.set(sectionId);
      }
    });

    afterNextRender(() => {
      this.googleClientIdInput.set(this.cloudStorageService.getClientId('google') ?? '');
      this.dropboxClientIdInput.set(this.cloudStorageService.getClientId('dropbox') ?? '');
      this.oneDriveClientIdInput.set(this.cloudStorageService.getClientId('onedrive') ?? '');
    });
  }

  selectSection(name: string) {
    this.activeSection.set(name);
  }

  changeWallpaper(url: string) {
    this.desktopService.setWallpaper(url);
  }

  connect(provider: 'google' | 'dropbox' | 'onedrive') {
    let clientId: string | undefined;
    switch (provider) {
        case 'google': clientId = this.googleClientIdInput().trim(); break;
        case 'dropbox': clientId = this.dropboxClientIdInput().trim(); break;
        case 'onedrive': clientId = this.oneDriveClientIdInput().trim(); break;
    }

    if (clientId) {
        this.cloudStorageService.setClientId(provider, clientId);
        this.cloudStorageService.login(provider)
          .catch(err => {
            console.error('Connection failed:', err);
            alert(`Connection failed: ${err}`);
          });
    } else {
        alert(`Please enter a Client ID for ${provider}.`);
    }
  }

  disconnect(provider: 'google' | 'dropbox' | 'onedrive') {
    this.cloudStorageService.logout(provider);
  }

  toggleHelp(provider: 'google' | 'dropbox' | 'onedrive') {
    switch (provider) {
      case 'google': this.showGoogleHelp.update(v => !v); break;
      case 'dropbox': this.showDropboxHelp.update(v => !v); break;
      case 'onedrive': this.showOneDriveHelp.update(v => !v); break;
    }
  }

  onIconChange(event: Event, appId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) { // 500KB limit
        alert('File is too large. Please choose an icon under 500KB.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        this.iconService.setCustomIcon(appId, result);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  resetIcon(appId: string) {
    this.iconService.resetCustomIcon(appId);
  }

  hasCustomIcon(appId: string): boolean {
    return !!this.iconService.customIcons()[appId];
  }
}
