import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IconService {
  private readonly storageKey = 'webos-custom-icons';
  customIcons = signal<Record<string, string>>({});

  constructor() {
    this.loadFromStorage();

    effect(() => {
      this.saveToStorage(this.customIcons());
    });
  }

  private loadFromStorage() {
    try {
      const storedIcons = localStorage.getItem(this.storageKey);
      if (storedIcons) {
        this.customIcons.set(JSON.parse(storedIcons));
      }
    } catch (e) {
      console.error('Failed to load custom icons from localStorage', e);
    }
  }

  private saveToStorage(icons: Record<string, string>) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(icons));
    } catch (e) {
      console.error('Failed to save custom icons to localStorage', e);
    }
  }

  setCustomIcon(appId: string, iconDataUrl: string) {
    this.customIcons.update(icons => ({
      ...icons,
      [appId]: iconDataUrl
    }));
  }

  resetCustomIcon(appId: string) {
    this.customIcons.update(icons => {
      const newIcons = { ...icons };
      delete newIcons[appId];
      return newIcons;
    });
  }
}
