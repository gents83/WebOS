import { Component, ChangeDetectionStrategy, signal, afterNextRender, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileIconComponent } from './file-icon.component';
import { FocusService } from '../../../services/focus.service';
import { CloudStorageService } from '../../../services/cloud-storage.service';
import { AppManagerService } from '../../../services/app-manager.service';
import { PropertiesService } from '../../../services/properties.service';
import { NetworkDriveService } from '../../../services/network-drive.service';
import { FileSystemService } from '../../../services/file-system.service';
import type { FileSystemItem, SearchResultItem, UndoableAction } from '../../../models/file-system.model';

@Component({
  selector: 'app-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileIconComponent, FormsModule],
  templateUrl: './explorer.component.html',
  styles: [`
    @keyframes fade-in-fast {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in-fast {
      animation: fade-in-fast 0.1s ease-out;
    }
  `]
})
export class ExplorerComponent {
  // All file system logic is now in FileSystemService
  private fileSystemService = inject(FileSystemService);
  private nextItemId = 0; // This should be moved to FileSystemService if we implement create/delete fully
  private focusService = inject(FocusService);
  private cloudStorageService = inject(CloudStorageService);
  private appManagerService = inject(AppManagerService);
  private propertiesService = inject(PropertiesService);
  private networkDriveService = inject(NetworkDriveService);
  
  // MOCK fileSystem for now until full refactor
  private fileSystem: Map<string, FileSystemItem[]>;

  currentPath = signal('C:/');
  currentItems = signal<FileSystemItem[]>([]);
  selectedItem = signal<FileSystemItem | null>(null);

  private staticSidebarSections = [
    {
      name: 'Favorites',
      items: [
        { name: 'Desktop', path: 'C:/Desktop', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>'},
        { name: 'Documents', path: 'C:/Documents', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>' },
        { name: 'Downloads', path: 'C:/Downloads', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' },
        { name: 'Pictures', path: 'C:/Pictures', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>' },
      ]
    },
    {
      name: 'Devices & Drives',
      items: [
        { name: 'OS (C:)', path: 'C:/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M4 6h16v12H4zm-2 12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-3H2v3zm18-9h-2v-2h2v2zm-4 0h-2v-2h2v2zM2 6v3h20V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2z"/></svg>' },
        { name: 'External Drive (E:)', path: 'E:/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 7v10H5V7h14m2-2H3v14h18V5zM8 11H6v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>' },
      ]
    },
    {
      name: 'Cloud Storage',
      items: [
        { name: 'Dropbox', path: 'dropbox:/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%230061ff" d="m6 9.15 6 3.85 6-3.85-6-3.85L6 9.15zM18 14.85l-6-3.85-6 3.85 6 3.85 6-3.85z"/><path fill="%23007ee5" d="m12 11.15 6 3.85v-5.15L12 6z"/><path fill="%230061ff" d="m6 14.85 6-3.85v5.15L6 20z"/><path fill="%233d9ae8" d="m6 9.15 6-3.85v5.15L6 14z"/><path fill="%23007ee5" d="m18 9.15-6 3.85v-5.15L18 4z"/><path fill="%233d9ae8" d="m12 18.7 6-3.85v-5.15L12 13.55zM6 14.85l6 3.85v-5.15L6 9.85z"/></svg>' },
        { name: 'Google Drive', path: 'gdrive:/', icon: 'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 28 28"><path fill="%234285F4" d="m19.25 19l4.63-8H28l-4.63 8h-4.12z"/><path fill="%2334A853" d="m9.34 28l4.63-8H9.75L5.12 28h4.22z"/><path fill="%23FBBC05" d="M5.12 9.25L0 18.25h9.33l4.25-9H5.12z"/></svg>' },
        { name: 'OneDrive', path: 'onedrive:/', icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 2048 2048"><path fill="%230078d4" d="M421 759q-11-21-32-32l-31-16q-21-11-47-11-37 0-63 26t-26 63q0 21 11 47l183 331 16 31q11 21 32 32l31 16q21 11 47 11 37 0 63-26t26-63q0-21-11-47l-183-331-16-31zm320 571q-21-11-47-11-37 0-63 26t-26 63q0 21 11 47l183 331 16 31q11 21 32 32l31 16q21 11 47 11 37 0 63-26t26-63q0-21-11-47l-183-331-16-31q-11-21-32-32l-31-16zm640-277q0-104-55-195t-148-148q-93-57-195-55t-195 55q-92 57-148 148t-55 195q0 103 55 195t148 148q93 57 195 55t195-55q92-57 148-148t55-195z"/></svg>' },
      ]
    }
  ];

  mountedDrives = this.networkDriveService.drives;

  sidebar = computed(() => {
    const drives = this.mountedDrives();
    const networkSection = {
      name: 'Network Locations',
      items: drives.map(drive => ({
        name: drive.name,
        path: drive.path,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1h-2v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
      }))
    };
    return drives.length > 0
      ? [...this.staticSidebarSections, networkSection]
      : this.staticSidebarSections;
  });
  
  contextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
    item: FileSystemItem | null;
  }>({ visible: false, x: 0, y: 0, item: null });
  
  sidebarContextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
    item: { name: string; path: string; } | null;
  }>({ visible: false, x: 0, y: 0, item: null });

  showMountDialog = signal(false);
  mountDriveName = signal('');
  mountDrivePath = signal('');

  renamingItem = signal<FileSystemItem | null>(null);
  
  draggingItem = signal<FileSystemItem | null>(null);
  dragOverItemId = signal<string | null>(null);
  dragOverSidebarPath = signal<string | null>(null);

  clipboardItem = signal<FileSystemItem | null>(null);
  clipboardSourcePath = signal<string | null>(null);
  clipboardAction = signal<'copy' | 'cut' | null>(null);
  
  actionHistory = this.fileSystemService.actionHistory;
  redoHistory = this.fileSystemService.redoHistory;
  
  searchTerm = signal('');
  searchResults = signal<SearchResultItem[]>([]);
  isSearching = computed(() => this.searchTerm().trim().length > 0);
  isCloudDrive = computed(() => {
    const path = this.currentPath();
    return path.startsWith('gdrive:/') || path.startsWith('dropbox:/') || path.startsWith('onedrive:/');
  });

  constructor() {
    // This is now just for the initial load. All mutations should go through the service.
    this.fileSystem = new Map(); // Keep a local copy for now, will be removed.
    this.navigateTo('C:/');
  }

  async navigateTo(path: string): Promise<void> {
    this.closeContextMenu();
    this.closeSidebarContextMenu();
    this.selectedItem.set(null);

    if (path.startsWith('gdrive:/') || path.startsWith('dropbox:/') || path.startsWith('onedrive:/')) {
        const provider = path.split(':/')[0] as 'gdrive' | 'dropbox' | 'onedrive';
        const serviceProvider = provider === 'gdrive' ? 'google' : provider;

        if (!this.cloudStorageService.getClientId(serviceProvider)) {
            alert(`Client ID for ${serviceProvider} is not configured. Opening Settings...`);
            this.appManagerService.openApp('settings', 'Cloud Storage');
            return;
        }

        let isConnected = this.cloudStorageService.isConnected(serviceProvider);
        if (!isConnected) {
            try {
                this.currentPath.set(path);
                this.currentItems.set([]);
                await this.cloudStorageService.login(serviceProvider);
                isConnected = true;
            } catch (error) {
                console.error(`Login failed for ${serviceProvider}`, error);
                if (this.currentPath() === path) this.navigateTo('C:/');
                return;
            }
        }

        if (isConnected) {
            const folderId = path.split(':/')[1] || (provider === 'gdrive' ? 'root' : '');
            try {
                this.currentPath.set(path);
                this.currentItems.set([]);
                const items = await this.cloudStorageService.getFiles(serviceProvider, folderId);
                this.currentItems.set(items as FileSystemItem[]);
            } catch (error) {
                console.error(`Failed to fetch files for ${serviceProvider}`, error);
            }
        }
    } else {
        this.currentPath.set(path);
        const items = this.fileSystemService.getDirectoryContents(path);
        this.currentItems.set(items);
        // This is the mock part that needs to be removed
        this.fileSystem.set(path, items);
    }
}


  onContextMenu(event: MouseEvent, item: FileSystemItem | null = null) {
    event.preventDefault();
    event.stopPropagation();
    this.renamingItem.set(null);
    this.selectedItem.set(item);
    this.closeSidebarContextMenu();
    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item: item
    });
  }

  closeContextMenu() {
    if(this.contextMenu().visible) {
      this.contextMenu.set({ ...this.contextMenu(), visible: false });
    }
  }

  onSidebarContextMenu(event: MouseEvent, item: { name: string, path: string }) {
    event.preventDefault();
    event.stopPropagation();
    this.closeContextMenu();
    this.sidebarContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item: item
    });
  }

  closeSidebarContextMenu() {
    if (this.sidebarContextMenu().visible) {
      this.sidebarContextMenu.set({ ...this.sidebarContextMenu(), visible: false });
    }
  }

  unmountDrive() {
    const driveToUnmount = this.sidebarContextMenu().item;
    if (!driveToUnmount) return;
    this.networkDriveService.unmountDrive(driveToUnmount.name);
    this.closeSidebarContextMenu();
  }

  openMountDialog() {
    this.closeContextMenu();
    this.showMountDialog.set(true);
  }

  onMountDrive() {
    const name = this.mountDriveName().trim();
    const path = this.mountDrivePath().trim();
    if (name && path) {
      if (this.networkDriveService.mountDrive(name, path)) {
        this.showMountDialog.set(false);
        this.mountDriveName.set('');
        this.mountDrivePath.set('');
      }
    }
  }

  selectItem(item: FileSystemItem, event: MouseEvent) {
    event.stopPropagation();
    this.selectedItem.set(item);
  }

  onBackgroundClick(event: MouseEvent) {
    if (event.currentTarget === event.target) {
      this.selectedItem.set(null);
    }
  }

  createNewItem(type: 'folder' | 'file') {
    // This should call fileSystemService.createItem(...)
  }

  deleteItem() {
    // This should call fileSystemService.deleteItem(...)
  }

  startRename(item: FileSystemItem | null = null) {
      const itemToRename = item || this.contextMenu().item;
      if (!itemToRename) return;
      this.closeContextMenu();
      this.renamingItem.set(itemToRename);
      
      afterNextRender(() => {
          const inputEl = document.querySelector(`input[data-item-id='${itemToRename.id}']`) as HTMLInputElement;
          if (inputEl) {
              inputEl.focus();
              inputEl.select();
          }
      });
  }

  finishRename(event: Event, item: FileSystemItem) {
    // This should call fileSystemService.renameItem(...)
    this.renamingItem.set(null);
  }

  cancelRename(event: Event, item: FileSystemItem) {
      const inputElement = event.target as HTMLInputElement;
      inputElement.value = item.name;
      this.renamingItem.set(null);
  }

  onDragStart(event: DragEvent, item: FileSystemItem): void {
    this.draggingItem.set(item);
    if (item.type === 'file') {
      const path = this.currentPath();
      const fullPath = path.endsWith('/') ? `${path}${item.name}` : `${path}/${item.name}`;
      event.dataTransfer?.setData('application/webos-file-path', fullPath);
    }
  }

  onDragEnd(): void {
    this.draggingItem.set(null);
    this.dragOverItemId.set(null);
    this.dragOverSidebarPath.set(null);
  }

  onDragOverItem(event: DragEvent, item: FileSystemItem): void {
    if (item.type === 'folder' && item.id !== this.draggingItem()?.id) {
      event.preventDefault();
      this.dragOverItemId.set(item.id);
    }
  }

  onDragLeaveItem(): void {
    this.dragOverItemId.set(null);
  }

  onDropOnItem(event: DragEvent, targetItem: FileSystemItem): void {
    event.preventDefault();
    if (!this.dragOverItemId() || targetItem.type !== 'folder') return;
    const draggedItem = this.draggingItem();
    if (!draggedItem || targetItem.id === draggedItem.id) return;
    
    const sourcePath = this.currentPath();
    const destPath = sourcePath.endsWith('/') ? `${sourcePath}${targetItem.name}` : `${sourcePath}/${targetItem.name}`;
    this.moveItem(draggedItem, sourcePath, destPath);
  }

  onDragOverSidebar(event: DragEvent, sidebarItem: { path: string }): void {
    if (sidebarItem.path !== this.currentPath()) {
      event.preventDefault();
      this.dragOverSidebarPath.set(sidebarItem.path);
    }
  }

  onDragLeaveSidebar(): void {
    this.dragOverSidebarPath.set(null);
  }

  onDropOnSidebar(event: DragEvent, sidebarItem: { path: string }): void {
    event.preventDefault();
    if (!this.dragOverSidebarPath()) return;
    const draggedItem = this.draggingItem();
    if (!draggedItem) return;

    this.moveItem(draggedItem, this.currentPath(), sidebarItem.path);
  }

  private moveItem(itemToMove: FileSystemItem, sourcePath: string, destPath: string, recordHistory = true): void {
    // This should call fileSystemService.moveItem(...)
  }
  
  cutItem() {
    const itemToCut = this.contextMenu().item;
    if (!itemToCut) return;
    this.clipboardItem.set(itemToCut);
    this.clipboardSourcePath.set(this.currentPath());
    this.clipboardAction.set('cut');
    this.closeContextMenu();
  }

  copyItem() {
    const itemToCopy = this.contextMenu().item;
    if (!itemToCopy) return;
    this.clipboardItem.set(itemToCopy);
    this.clipboardSourcePath.set(this.currentPath());
    this.clipboardAction.set('copy');
    this.closeContextMenu();
  }
  
  copySelectedItem() {
    const itemToCopy = this.selectedItem();
    if (!itemToCopy) return;
    this.clipboardItem.set(itemToCopy);
    this.clipboardSourcePath.set(this.currentPath());
    this.clipboardAction.set('copy');
    this.closeContextMenu();
  }

  cutSelectedItem() {
    const itemToCut = this.selectedItem();
    if (!itemToCut) return;
    this.clipboardItem.set(itemToCut);
    this.clipboardSourcePath.set(this.currentPath());
    this.clipboardAction.set('cut');
    this.closeContextMenu();
  }

  pasteItem() {
    // This should call fileSystemService.pasteItem(...)
  }
  
  pasteShortcut() {
    // This should call fileSystemService.createShortcut(...)
  }

  isCut(item: FileSystemItem): boolean {
    const cbItem = this.clipboardItem();
    if (!cbItem) return false;
    return this.clipboardAction() === 'cut' && cbItem.id === item.id;
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
    if (this.isSearching()) {
      this.performSearch();
    } else {
      this.searchResults.set([]);
    }
  }

  clearSearch() {
    this.searchTerm.set('');
    this.searchResults.set([]);
  }
  
  performSearch() {
    // This should call fileSystemService.search(...)
  }

  navigateToSearchResult(item: SearchResultItem) {
    this.navigateTo(item.path);
    this.clearSearch();
  }

  undoLastAction() {
    // this.fileSystemService.undo();
  }
  
  redoLastAction() {
    // this.fileSystemService.redo();
  }

  openProperties() {
    const item = this.contextMenu().item;
    if (!item) return;
    this.closeContextMenu();
    this.propertiesService.context.set({ item, path: this.currentPath() });
    this.appManagerService.openApp('properties');
  }

  createShortcut() {
    // This should call fileSystemService.createShortcut(...)
  }

  openFileLocation() {
    // ... logic remains similar
  }


  @HostListener('document:click')
  onDocumentClick() {
    this.closeContextMenu();
    this.closeSidebarContextMenu();
  }
  
  @HostListener('document:keydown.control.z', ['$event'])
  onUndo(event: KeyboardEvent) {
    if (this.focusService.activeAppId() !== 'explorer') return;
      event.preventDefault();
      this.undoLastAction();
  }

  @HostListener('document:keydown.control.y', ['$event'])
  onRedo(event: KeyboardEvent) {
    if (this.focusService.activeAppId() !== 'explorer') return;
      event.preventDefault();
      this.redoLastAction();
  }
  
  @HostListener('document:keydown.control.c', ['$event'])
  onCopyKey(event: KeyboardEvent) {
    if (this.focusService.activeAppId() === 'explorer' && this.selectedItem()) {
      event.preventDefault();
      this.copySelectedItem();
    }
  }

  @HostListener('document:keydown.control.x', ['$event'])
  onCutKey(event: KeyboardEvent) {
    if (this.focusService.activeAppId() === 'explorer' && this.selectedItem()) {
      event.preventDefault();
      this.cutSelectedItem();
    }
  }

  @HostListener('document:keydown.control.v', ['$event'])
  onPasteKey(event: KeyboardEvent) {
    if (this.focusService.activeAppId() === 'explorer' && this.clipboardItem()) {
      event.preventDefault();
      this.pasteItem();
    }
  }
}
