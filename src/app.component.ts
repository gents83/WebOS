import { Component, ChangeDetectionStrategy, signal, computed, effect, ElementRef, viewChild, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowComponent } from './components/window/window.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';
import { DesktopIconComponent } from './components/desktop-icon/desktop-icon.component';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import type { App, AppWindow, WindowState } from './models/app.model';
import { APP_LIST } from './app-list';
import { DesktopService } from './services/desktop.service';
import { FocusService } from './services/focus.service';
import { CloudStorageService } from './services/cloud-storage.service';
import { AppManagerService } from './services/app-manager.service';
import { IconService } from './services/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStateService } from './services/app-state.service';
import { FileSystemService } from './services/file-system.service';

@Component({
  selector: 'app-root',
  template: `
<div 
  #desktop 
  class="h-screen w-screen bg-cover bg-center transition-all duration-500 relative" 
  [style.backgroundImage]="'url(' + wallpaperUrl() + ')'" 
  (click)="onDesktopClick()"
  (dragover)="onDesktopDragOver($event)"
  (drop)="onDesktopDrop($event)"
>
  <!-- Desktop Icons -->
  @for(app of launchableApps(); track app.id) {
    <app-desktop-icon 
      [app]="app"
      (launch)="openApp($event)"
      (launchWithFile)="openAppWithFile($event)"
      (dragStart)="onIconDragStart($event)"
    ></app-desktop-icon>
  }

  <!-- Windows -->
  @for (win of windows(); track win.id) {
    @if (win.state !== 'minimized') {
      <app-window
        [window]="win"
        (windowFocus)="focusWindow($event)"
        (windowStateChange)="handleWindowStateChange($event)"
        (windowDrag)="updateWindowState($event.id, { position: $event.position })"
        (windowResize)="updateWindowState($event.id, { size: $event.size })"
        (windowUpdate)="updateWindowState($event.id, $event.changes)"
      >
      </app-window>
    }
  }
</div>

@if (isStartMenuOpen()) {
  <app-start-menu
    [apps]="launchableApps()"
    (launchApp)="openApp($event)"
  ></app-start-menu>
}

<app-taskbar
  [openWindows]="windows()"
  (focusWindow)="focusWindow($event)"
  (minimizeWindow)="handleWindowStateChange({ id: $event, state: 'minimized' })"
  (toggleStartMenu)="toggleStartMenu()"
  (showDesktop)="onShowDesktop()"
  (launchWithFile)="openAppWithFile($event)"
></app-taskbar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    WindowComponent,
    TaskbarComponent,
    DesktopIconComponent,
    StartMenuComponent
  ],
})
export class AppComponent {
  private desktopService = inject(DesktopService);
  private focusService = inject(FocusService);
  private cloudStorageService = inject(CloudStorageService);
  private appManagerService = inject(AppManagerService);
  private iconService = inject(IconService);
  private appStateService = inject(AppStateService);
  private fileSystemService = inject(FileSystemService); // Inject FileSystemService
  desktop = viewChild.required<ElementRef>('desktop');
  
  apps = this.appStateService.apps;
  windows = signal<AppWindow[]>([]);
  wallpaperUrl = this.desktopService.wallpaperUrl;
  
  isStartMenuOpen = signal(false);
  private desktopShownWindowIds = signal<number[] | null>(null);
  
  private nextWindowId = 0;
  private highestZIndex = signal(0);
  
  private draggedIcon = signal<{ app: App, offset: { x: number, y: number } } | null>(null);

  launchableApps = this.appStateService.launchableApps;

  constructor() {
    this.appStateService.apps.set(APP_LIST);
    this.cloudStorageService.init();

    this.appManagerService.openAppRequest$.pipe(
      takeUntilDestroyed()
    ).subscribe(appId => {
      this.openApp(appId);
    });

    // Effect to apply custom icons
    effect(() => {
      const customIcons = this.iconService.customIcons();
      const currentApps = untracked(this.apps);
      
      const needsAppUpdate = currentApps.some(app => {
        const defaultApp = APP_LIST.find(a => a.id === app.id)!;
        const newIcon = customIcons[app.id] || defaultApp.icon;
        return app.icon !== newIcon;
      });

      if (needsAppUpdate) {
        this.apps.update(apps => apps.map(app => {
          const defaultApp = APP_LIST.find(a => a.id === app.id)!;
          return { ...app, icon: customIcons[app.id] || defaultApp.icon };
        }));
      }

      const currentWindows = untracked(this.windows);
      const needsWindowUpdate = currentWindows.some(win => {
         const defaultApp = APP_LIST.find(a => a.id === win.appId)!;
         const newIcon = customIcons[win.appId] || defaultApp.icon;
         return win.icon !== newIcon;
      });
      
      if (needsWindowUpdate) {
        this.windows.update(windows => windows.map(win => {
          const defaultApp = APP_LIST.find(a => a.id === win.appId)!;
          return { ...win, icon: customIcons[win.appId] || defaultApp.icon };
        }));
      }
    });
  }

  maximizedWindows = computed(() => this.windows().filter(w => w.state === 'maximized'));

  openAppWithFile({ appId, filePath }: { appId: string, filePath: string }) {
    // Basic file type association
    if (appId === 'notepad' && filePath.toLowerCase().endsWith('.txt')) {
       this.openApp(appId, { filePath });
    } else {
      // Maybe show an alert for incompatible file types
      console.warn(`App ${appId} does not support opening ${filePath}`);
    }
  }

  openApp(appId: string, launchData?: { filePath: string }) {
    this.isStartMenuOpen.set(false);
    const app = this.apps().find(a => a.id === appId);
    if (!app) return;
    
    // If a window for this app is already open, focus it. 
    // A more advanced implementation might ask to open the new file in the existing window.
    const existingWindow = this.windows().find(w => w.appId === appId);
    if (existingWindow) {
        this.focusWindow(existingWindow.id);
        // If launchData is provided, we could update the existing window, but for now we'll just focus.
        return;
    }

    const newZIndex = this.highestZIndex() + 1;
    this.highestZIndex.set(newZIndex);

    const desktopRect = this.desktop().nativeElement.getBoundingClientRect();
    const defaultWidth = Math.min(800, desktopRect.width - 100);
    const defaultHeight = Math.min(600, desktopRect.height - 100);
    
    let title = app.name;
    if (launchData?.filePath) {
      const fileName = launchData.filePath.split('/').pop();
      title = `${fileName} - ${app.name}`;
    }

    const newWindow: AppWindow = {
      id: this.nextWindowId++,
      appId: app.id,
      title: title,
      component: app.component,
      icon: app.icon,
      state: 'normal',
      position: { x: (desktopRect.width - defaultWidth) / 2 + (this.windows().length % 10 * 20) , y: (desktopRect.height - defaultHeight) / 2 + (this.windows().length % 10 * 20) },
      size: { width: defaultWidth, height: defaultHeight },
      zIndex: newZIndex,
      launchData: launchData
    };

    this.windows.update(windows => [...windows, newWindow]);
    this.focusService.activeAppId.set(app.id);
  }

  focusWindow(windowId: number) {
    const window = this.windows().find(w => w.id === windowId);
    if (window?.zIndex === this.highestZIndex() && window.state !== 'minimized') {
        return;
    }

    const newZIndex = this.highestZIndex() + 1;
    this.highestZIndex.set(newZIndex);
    this.windows.update(windows => 
      windows.map(w => w.id === windowId ? { ...w, zIndex: newZIndex, state: w.state === 'minimized' ? (w.prevStateBeforeMinimize ?? 'normal') : w.state } : w)
    );
    
    const focusedWindow = this.windows().find(w => w.id === windowId);
    if (focusedWindow) {
        this.focusService.activeAppId.set(focusedWindow.appId);
    }
  }

  updateWindowState(windowId: number, newState: Partial<AppWindow>) {
    this.windows.update(windows => 
      windows.map(w => w.id === windowId ? { ...w, ...newState } : w)
    );
  }
  
  handleWindowStateChange({ id, state, ...otherChanges }: { id: number, state: WindowState } & Partial<AppWindow>) {
    const window = this.windows().find(w => w.id === id);
    if (!window) return;

    if(state === 'closed') {
      const wasFocused = window.zIndex === this.highestZIndex();
      this.windows.update(ws => ws.filter(w => w.id !== id));
      
      if (wasFocused) {
          const remainingWindows = this.windows();
          const newHighestZ = remainingWindows.length > 0 ? Math.max(...remainingWindows.map(w => w.zIndex)) : 0;
          this.highestZIndex.set(newHighestZ);
          const nextTopWindow = remainingWindows.find(w => w.zIndex === newHighestZ && w.state !== 'minimized');
          this.focusService.activeAppId.set(nextTopWindow?.appId ?? null);
      }
      return;
    }

    if(state === 'minimized') {
       // Fix: Ensure prevStateBeforeMinimize is always a valid state ('normal' or 'maximized').
       this.windows.update(ws => ws.map(w => w.id === id ? {...w, state: 'minimized', prevStateBeforeMinimize: (w.state === 'normal' || w.state === 'maximized') ? w.state : (w.prevStateBeforeMinimize ?? 'normal') } : w));
       const visibleWindows = this.windows().filter(w => w.state !== 'minimized');
       const newHighestZ = visibleWindows.length > 0 ? Math.max(...visibleWindows.map(w => w.zIndex)) : 0;
       this.highestZIndex.set(newHighestZ);

       const nextTopWindow = this.windows().find(w => w.zIndex === newHighestZ && w.state !== 'minimized');
       this.focusService.activeAppId.set(nextTopWindow?.appId ?? null);
       return;
    }

    if(state === 'maximized' || state === 'normal') {
      this.focusWindow(id);
      this.windows.update(ws => ws.map(w => w.id === id ? {...w, state: state, ...otherChanges } : w));
    }
  }

  onDesktopClick() {
    this.focusService.activeAppId.set(null);
    if(this.isStartMenuOpen()) {
        this.isStartMenuOpen.set(false);
    }
  }

  toggleStartMenu() {
    this.isStartMenuOpen.update(v => !v);
  }

  onShowDesktop() {
    const idsToRestore = this.desktopShownWindowIds();

    if (idsToRestore) {
      this.windows.update(currentWindows =>
        currentWindows.map(w => 
          idsToRestore.includes(w.id)
            ? { ...w, state: w.prevStateBeforeMinimize ?? 'normal' }
            : w
        )
      );
      
      const restoredWindows = this.windows().filter(w => idsToRestore.includes(w.id));
      if (restoredWindows.length > 0) {
          const topWindow = restoredWindows.reduce((top, w) => w.zIndex > top.zIndex ? w : top, restoredWindows[0]);
          this.focusWindow(topWindow.id);
      }

      this.desktopShownWindowIds.set(null);
    } else {
      const windowsToMinimize = this.windows().filter(w => w.state !== 'minimized');
      if (windowsToMinimize.length === 0) return;

      const idsToMinimize = windowsToMinimize.map(w => w.id);
      this.desktopShownWindowIds.set(idsToMinimize);

      this.windows.update(currentWindows => 
        currentWindows.map(w => 
          idsToMinimize.includes(w.id) 
            // Fix: Explicitly check for valid previous states to satisfy TypeScript.
            // The state will always be 'normal' or 'maximized' here, but this makes the type checker happy.
            ? { ...w, state: 'minimized', prevStateBeforeMinimize: (w.state === 'normal' || w.state === 'maximized') ? w.state : 'normal' } 
            : w
        )
      );
      
      this.focusService.activeAppId.set(null);
    }
  }

  onIconDragStart({ event, app }: { event: DragEvent; app: App }) {
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    this.draggedIcon.set({
      app,
      offset: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    });
  }

  onDesktopDragOver(event: DragEvent) {
    if (this.draggedIcon() || event.dataTransfer?.types.includes('application/webos-file-path')) {
      event.preventDefault();
    }
  }
  
  onDesktopDrop(event: DragEvent) {
    const dragInfo = this.draggedIcon();
    if (!dragInfo) return;
    event.preventDefault();

    const newPosition = {
      x: event.clientX - dragInfo.offset.x,
      y: event.clientY - dragInfo.offset.y,
    };

    newPosition.x = Math.round(newPosition.x / 10) * 10;
    newPosition.y = Math.round(newPosition.y / 10) * 10;

    this.apps.update(currentApps =>
      currentApps.map(app =>
        app.id === dragInfo.app.id ? { ...app, position: newPosition } : app
      )
    );
    this.draggedIcon.set(null);
  }
}