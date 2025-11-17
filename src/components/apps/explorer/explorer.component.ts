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
  template: `
<div class="h-full w-full flex bg-zinc-800 text-white" (click)="closeContextMenu(); closeSidebarContextMenu()">
  <!-- Sidebar -->
  <div class="w-56 flex-shrink-0 bg-zinc-900/50 p-2">
    @for(section of sidebar(); track section.name; let isFirst = $first) {
      <h3 
        class="text-sm font-semibold text-gray-400 px-2 mb-2"
        [class.mt-4]="!isFirst">
        {{ section.name }}
      </h3>
      <ul>
        @for(item of section.items; track item.name) {
          <li 
            (click)="navigateTo(item.path)"
            (contextmenu)="section.name === 'Network Locations' ? onSidebarContextMenu($event, item) : null"
            (dragover)="!isCloudDrive() ? onDragOverSidebar($event, item) : null"
            (dragleave)="!isCloudDrive() ? onDragLeaveSidebar() : null"
            (drop)="!isCloudDrive() ? onDropOnSidebar($event, item) : null"
            class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors duration-100"
            [class.bg-blue-600]="currentPath() === item.path && dragOverSidebarPath() !== item.path"
            [class.hover:bg-white/10]="currentPath() !== item.path"
            [class.bg-blue-600/40]="dragOverSidebarPath() === item.path"
          >
            <img [src]="item.icon" [alt]="item.name" class="w-5 h-5">
            <span>{{ item.name }}</span>
          </li>
        }
      </ul>
    }
  </div>

  <!-- Main Content -->
  <div class="flex-grow flex flex-col relative">
    <!-- Toolbar -->
    <div class="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/10 gap-4">
       <div class="flex items-center gap-4 flex-grow">
          <button 
             (click)="createNewItem('folder')"
             [disabled]="isSearching() || isCloudDrive()"
             class="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
             <svg class="w-4 h-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
             </svg>
             New Folder
          </button>
          <div class="text-sm text-gray-300 truncate flex-shrink min-w-0">Path: {{ currentPath() }}</div>
       </div>
       <div class="relative w-64 flex-shrink-0">
         <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
         </svg>
         <input 
           type="text"
           placeholder="Search"
           class="w-full bg-zinc-700 rounded-md pl-9 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           [value]="searchTerm()"
           (input)="onSearchChange($event.target.value)"
         />
         @if (isSearching()) {
           <button (click)="clearSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
             <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         }
       </div>
    </div>
    <!-- File List -->
    <div class="flex-grow overflow-auto p-4" (contextmenu)="!isSearching() && !isCloudDrive() ? onContextMenu($event) : null" (click)="onBackgroundClick($event)">
      @if (!isSearching()) {
        <table class="w-full text-left text-sm select-none">
          <thead>
            <tr class="border-b border-white/10">
              <th class="p-2 font-normal">Name</th>
              <th class="p-2 font-normal">Date modified</th>
              <th class="p-2 font-normal">Type</th>
              <th class="p-2 font-normal text-right">Size</th>
            </tr>
          </thead>
          <tbody>
            @for(item of currentItems(); track item.id) {
              <tr 
                  [draggable]="!isCloudDrive()"
                  (dragstart)="!isCloudDrive() ? onDragStart(item) : null"
                  (dragend)="!isCloudDrive() ? onDragEnd() : null"
                  (dragover)="!isCloudDrive() ? onDragOverItem($event, item) : null"
                  (dragleave)="!isCloudDrive() ? onDragLeaveItem() : null"
                  (drop)="!isCloudDrive() ? onDropOnItem($event, item) : null"
                  (click)="selectItem(item, $event)"
                  class="hover:bg-white/10 rounded transition-colors duration-100"
                  [class.opacity-40]="draggingItem()?.id === item.id"
                  [class.opacity-50]="isCut(item)"
                  [class.bg-blue-600/40]="dragOverItemId() === item.id"
                  [class.bg-blue-600/50]="selectedItem()?.id === item.id"
                  (contextmenu)="!isCloudDrive() ? onContextMenu($event, item) : null">
                <td class="p-2 flex items-center gap-2">
                  <app-file-icon [type]="item.type" [name]="item.name"></app-file-icon>
                  
                  @if (renamingItem() !== item) {
                    <span class="truncate">{{ item.name }}</span>
                  } @else {
                    <input 
                      type="text"
                      [value]="item.name"
                      [attr.data-item-id]="item.id"
                      class="bg-zinc-700 text-white px-1 py-0.5 rounded border border-blue-500 focus:outline-none w-full"
                      (blur)="finishRename($event, item)"
                      (keydown.enter)="finishRename($event, item)"
                      (keydown.escape)="cancelRename($event, item)"
                      (click)="$event.stopPropagation()"
                      (contextmenu)="$event.stopPropagation()"
                      (mousedown)="$event.stopPropagation()"
                    />
                  }
                </td>
                <td class="p-2 text-gray-400 truncate">{{ item.modified }}</td>
                <td class="p-2 text-gray-400 truncate">{{ item.type === 'folder' ? 'File folder' : item.type === 'shortcut' ? 'Shortcut' : 'File' }}</td>
                <td class="p-2 text-gray-400 text-right truncate">{{ item.size }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        @if (searchResults().length > 0) {
          <div class="text-sm text-gray-400 mb-2">Found {{ searchResults().length }} item(s) for "{{ searchTerm() }}" in {{ currentPath() }} and subdirectories.</div>
          <ul class="select-none">
            @for(item of searchResults(); track item.id) {
              <li (click)="navigateToSearchResult(item)" class="flex items-center gap-3 p-2 rounded hover:bg-white/10 cursor-pointer">
                <app-file-icon [type]="item.type" [name]="item.name"></app-file-icon>
                <div>
                  <div class="text-white">{{ item.name }}</div>
                  <div class="text-xs text-gray-500">{{ item.path }}</div>
                </div>
              </li>
            }
          </ul>
        } @else {
          <div class="text-center text-gray-500 pt-10">No results found for "{{ searchTerm() }}".</div>
        }
      }
    </div>
    
    <!-- Context Menu -->
    @if (contextMenu().visible) {
      <div 
        class="absolute bg-zinc-700 border border-white/10 rounded-md shadow-lg py-1.5 w-48 z-10 text-sm animate-fade-in-fast"
        [style.left.px]="contextMenu().x"
        [style.top.px]="contextMenu().y"
        (click)="$event.stopPropagation()"
        (contextmenu)="$event.preventDefault(); $event.stopPropagation();">
        <ul>
          @if (contextMenu().item; as item) {
            @if (item.type === 'shortcut') {
              <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer font-semibold" (click)="openFileLocation()">Open file location</li>
              <hr class="border-white/10 my-1">
            }
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="cutItem()">Cut</li>
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="copyItem()">Copy</li>
            <hr class="border-white/10 my-1">
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="deleteItem()">Delete</li>
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="startRename()">Rename</li>
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="createShortcut()">Create shortcut</li>
            <hr class="border-white/10 my-1">
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="openProperties()">Properties</li>
          } @else {
            @if (actionHistory().length > 0) {
              <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer flex justify-between items-center" (click)="undoLastAction()">
                <span>Undo</span>
                <span class="text-xs text-gray-400">Ctrl+Z</span>
              </li>
            }
            @if (redoHistory().length > 0) {
              <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer flex justify-between items-center" (click)="redoLastAction()">
                <span>Redo</span>
                <span class="text-xs text-gray-400">Ctrl+Y</span>
              </li>
            }
            @if (actionHistory().length > 0 || redoHistory().length > 0) {
              <hr class="border-white/10 my-1">
            }
            @if(clipboardItem()){
              <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="pasteItem()">Paste</li>
              <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="pasteShortcut()">Paste shortcut</li>
              <hr class="border-white/10 my-1">
            }
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="openMountDialog()">Mount network drive</li>
            <hr class="border-white/10 my-1">
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="createNewItem('folder')">New Folder</li>
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="createNewItem('file')">New File</li>
          }
        </ul>
      </div>
    }

    <!-- Sidebar Context Menu -->
    @if (sidebarContextMenu().visible) {
      <div 
        class="absolute bg-zinc-700 border border-white/10 rounded-md shadow-lg py-1.5 w-48 z-10 text-sm animate-fade-in-fast"
        [style.left.px]="sidebarContextMenu().x"
        [style.top.px]="sidebarContextMenu().y"
        (click)="$event.stopPropagation()"
        (contextmenu)="$event.preventDefault(); $event.stopPropagation();">
        <ul>
            <li class="px-3 py-1.5 hover:bg-blue-600 cursor-pointer" (click)="unmountDrive()">Unmount drive</li>
        </ul>
      </div>
    }

    <!-- Mount Drive Dialog -->
    @if (showMountDialog()) {
      <div class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center" (click)="showMountDialog.set(false)">
        <div class="bg-zinc-800 border border-white/10 rounded-lg shadow-2xl w-full max-w-sm p-6" (click)="$event.stopPropagation()">
          <h2 class="text-xl font-semibold mb-4">Mount Network Drive</h2>
          <div class="space-y-4">
            <div>
              <label for="driveName" class="block text-sm text-gray-300 mb-1">Drive Name</label>
              <input 
                id="driveName"
                type="text"
                placeholder="e.g., Media Server"
                class="w-full bg-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [ngModel]="mountDriveName()"
                (ngModelChange)="mountDriveName.set($event)"
                (keydown.enter)="onMountDrive()"
              />
            </div>
            <div>
              <label for="drivePath" class="block text-sm text-gray-300 mb-1">Path</label>
              <input 
                id="drivePath"
                type="text"
                placeholder="e.g., C:/Users/Shared"
                class="w-full bg-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [ngModel]="mountDrivePath()"
                (ngModelChange)="mountDrivePath.set($event)"
                (keydown.enter)="onMountDrive()"
              />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="showMountDialog.set(false)" class="px-4 py-1.5 bg-zinc-600 hover:bg-zinc-500 text-white rounded text-sm font-semibold">Cancel</button>
            <button (click)="onMountDrive()" [disabled]="!mountDriveName().trim() || !mountDrivePath().trim()" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold disabled:bg-zinc-600 disabled:cursor-not-allowed">Mount</button>
          </div>
        </div>
      </div>
    }
  </div>
</div>`,
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
