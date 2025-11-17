import { Component, ChangeDetectionStrategy, input, output, signal, inject, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import type { AppWindow } from '../../models/app.model';
import { interval } from 'rxjs';

@Component({
  selector: 'app-taskbar',
  templateUrl: './taskbar.component.html',
  imports: [CommonModule],
})
export class TaskbarComponent {
  openWindows = input.required<AppWindow[]>();
  
  focusWindow = output<number>();
  minimizeWindow = output<number>();
  toggleStartMenu = output<void>();
  showDesktop = output<void>();
  launchWithFile = output<{ appId: string, filePath: string }>();

  currentTime = signal(new Date());
  batteryStatus = signal<{ level: number; charging: boolean } | null>(null);
  dragOverAppId = signal<string | null>(null);

  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });

    if (isPlatformBrowser(this.platformId)) {
      this.initBatteryMonitor();
    }
  }

  runningApps = computed(() => {
    const windows = this.openWindows();
    const appMap = new Map<string, AppWindow>();
    for (const win of windows) {
      if (!appMap.has(win.appId) || win.zIndex > appMap.get(win.appId)!.zIndex) {
        appMap.set(win.appId, win);
      }
    }
    return Array.from(appMap.values()).sort((a,b) => a.id - b.id);
  });

  private initBatteryMonitor(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateStatus = () => {
          this.batteryStatus.set({
            level: battery.level,
            charging: battery.charging,
          });
        };
        
        updateStatus();
        
        battery.addEventListener('levelchange', updateStatus);
        battery.addEventListener('chargingchange', updateStatus);

        this.destroyRef.onDestroy(() => {
          battery.removeEventListener('levelchange', updateStatus);
          battery.removeEventListener('chargingchange', updateStatus);
        });
      });
    }
  }
  
  private highestZIndex = computed(() => {
      const windows = this.openWindows();
      if (windows.length === 0) return 0;
      return Math.max(0, ...windows.filter(w => w.state !== 'minimized').map(w => w.zIndex));
  });

  onAppClick(window: AppWindow) {
    if (window.zIndex === this.highestZIndex() && window.state !== 'minimized') {
        this.minimizeWindow.emit(window.id);
    } else {
        this.focusWindow.emit(window.id);
    }
  }

  isActive(appId: string): boolean {
    const highestZ = this.highestZIndex();
    if (highestZ === 0) return false;
    return this.openWindows().some(w => w.appId === appId && w.zIndex === highestZ && w.state !== 'minimized');
  }

  onDragOver(event: DragEvent, appId: string) {
    const isFileDrag = event.dataTransfer?.types.includes('application/webos-file-path');
    if (isFileDrag) {
      event.preventDefault();
      this.dragOverAppId.set(appId);
    }
  }

  onDragLeave() {
    this.dragOverAppId.set(null);
  }

  onDrop(event: DragEvent, appId: string) {
    event.preventDefault();
    this.dragOverAppId.set(null);
    const filePath = event.dataTransfer?.getData('application/webos-file-path');
    if (filePath) {
      this.launchWithFile.emit({ appId, filePath });
    }
  }
}
