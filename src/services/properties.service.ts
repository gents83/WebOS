import { Injectable, signal } from '@angular/core';
// Fix: Correct import path for FileSystemItem
import type { FileSystemItem } from '../models/file-system.model';

export interface PropertiesContext {
  item: FileSystemItem;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  context = signal<PropertiesContext | null>(null);
}
