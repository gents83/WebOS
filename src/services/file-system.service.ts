import { Injectable, signal } from '@angular/core';
import { FileSystemItem, UndoableAction } from '../models/file-system.model';

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  private fileSystem: Map<string, FileSystemItem[]>;
  private nextItemId = 0;

  actionHistory = signal<UndoableAction[]>([]);
  redoHistory = signal<UndoableAction[]>([]);

  constructor() {
    this.fileSystem = new Map<string, FileSystemItem[]>([
      ['C:/', [
        { id: (this.nextItemId++).toString(), name: 'Desktop', type: 'folder', modified: '7/21/2024 09:00 AM' },
        { id: (this.nextItemId++).toString(), name: 'Documents', type: 'folder', modified: '7/20/2024 10:00 AM' },
        { id: (this.nextItemId++).toString(), name: 'Downloads', type: 'folder', modified: '7/20/2024 11:30 AM' },
        { id: (this.nextItemId++).toString(), name: 'Pictures', type: 'folder', modified: '7/19/2024 05:20 PM' },
        { id: (this.nextItemId++).toString(), name: 'Windows', type: 'folder', modified: '6/1/2024 08:00 AM' },
        { id: (this.nextItemId++).toString(), name: 'system.dll', type: 'file', size: '2.1 MB', modified: '6/1/2024 09:00 AM' }
      ]],
      ['C:/Desktop', []],
      ['C:/Documents', [
        { id: (this.nextItemId++).toString(), name: 'report.docx', type: 'file', size: '128 KB', modified: '7/20/2024 10:05 AM' },
        { id: (this.nextItemId++).toString(), name: 'presentation.pptx', type: 'file', size: '4.5 MB', modified: '7/18/2024 02:45 PM' },
        { id: (this.nextItemId++).toString(), name: 'readme.txt', type: 'file', size: '1 KB', modified: '7/21/2024 01:15 PM', content: 'This is a test file for the WebOS project.\n\nYou can drag this file onto the Notepad icon to open it.' },
      ]],
      ['C:/Downloads', [
        { id: (this.nextItemId++).toString(), name: 'installer.exe', type: 'file', size: '15.2 MB', modified: '7/20/2024 11:31 AM' },
      ]],
      ['C:/Pictures', [
        { id: (this.nextItemId++).toString(), name: 'vacation.jpg', type: 'file', size: '3.8 MB', modified: '7/19/2024 05:22 PM' },
      ]],
      ['C:/Windows', [
          { id: (this.nextItemId++).toString(), name: 'System32', type: 'folder', modified: '6/1/2024 08:00 AM' },
      ]],
      ['E:/', [
          { id: (this.nextItemId++).toString(), name: 'Backup-2024', type: 'folder', modified: '7/15/2024 01:00 PM' },
          { id: (this.nextItemId++).toString(), name: 'project-files.zip', type: 'file', size: '256 MB', modified: '7/14/2024 03:00 PM' },
      ]],
    ]);
  }
  
  getDirectoryContents(path: string): FileSystemItem[] {
      if (!this.fileSystem.has(path)) {
          this.fileSystem.set(path, []);
      }
      return this.fileSystem.get(path)!;
  }

  getItem(fullPath: string): FileSystemItem | undefined {
    const lastSlash = fullPath.lastIndexOf('/');
    if (lastSlash === -1) return undefined;

    let dirPath = fullPath.substring(0, lastSlash);
    if (dirPath.endsWith(':')) dirPath += '/';
    if (!dirPath) dirPath = '/';

    const itemName = fullPath.substring(lastSlash + 1);

    const dirContents = this.getDirectoryContents(dirPath);
    return dirContents.find(item => item.name === itemName);
  }

  getFileContent(fullPath: string): string | undefined {
      const item = this.getItem(fullPath);
      return item?.content;
  }

  // Add more file system manipulation methods here (create, delete, rename, move)
  // These would be moved from ExplorerComponent and adapted to use this service's state.
}
