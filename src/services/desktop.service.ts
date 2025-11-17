import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DesktopService {
  readonly defaultWallpaper = 'https://picsum.photos/id/11/1920/1080';
  wallpaperUrl = signal<string>(this.defaultWallpaper);

  constructor() {
    try {
        const savedWallpaper = localStorage.getItem('windows-wallpaper');
        if (savedWallpaper) {
          this.wallpaperUrl.set(savedWallpaper);
        }
    } catch (e) {
        console.warn('Could not access localStorage for wallpaper.', e);
        this.wallpaperUrl.set(this.defaultWallpaper);
    }

    effect(() => {
        try {
            localStorage.setItem('windows-wallpaper', this.wallpaperUrl());
        } catch (e) {
            console.warn('Could not save wallpaper to localStorage.', e);
        }
    });
  }

  setWallpaper(url: string) {
    this.wallpaperUrl.set(url);
  }
}
