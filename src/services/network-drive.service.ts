import { Injectable, signal, effect } from '@angular/core';

export interface NetworkDrive {
  name: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class NetworkDriveService {
  private readonly storageKey = 'webos-network-drives';
  drives = signal<NetworkDrive[]>([]);

  constructor() {
    this.loadDrivesFromStorage();
    effect(() => {
      this.saveDrivesToStorage(this.drives());
    });
  }

  private loadDrivesFromStorage() {
    try {
      const storedDrives = localStorage.getItem(this.storageKey);
      if (storedDrives) {
        this.drives.set(JSON.parse(storedDrives));
      }
    } catch (e) {
      console.error('Failed to load network drives from localStorage', e);
    }
  }

  private saveDrivesToStorage(drives: NetworkDrive[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(drives));
    } catch (e) {
      console.error('Failed to save network drives to localStorage', e);
    }
  }

  mountDrive(name: string, path: string): boolean {
    if (this.drives().some(drive => drive.name.toLowerCase() === name.toLowerCase())) {
      alert(`A drive with the name "${name}" already exists.`);
      return false;
    }
    if (!path.includes(':/')) {
        alert(`Invalid path. Path should be a valid root like "C:/".`);
        return false;
    }
    this.drives.update(drives => [...drives, { name, path }]);
    return true;
  }

  unmountDrive(name: string) {
    this.drives.update(drives => drives.filter(drive => drive.name !== name));
  }
}
