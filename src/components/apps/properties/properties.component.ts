import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';
import { FileIconComponent } from '../explorer/file-icon.component';
// Fix: Correct import path for FileSystemItem
import type { FileSystemItem } from '../../../models/file-system.model';

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileIconComponent]
})
export class PropertiesComponent {
  private propertiesService = inject(PropertiesService);
  
  context = this.propertiesService.context;
  
  itemType = computed(() => {
    const item = this.context()?.item;
    if (!item) return '';
    switch(item.type) {
      case 'folder': return 'File folder';
      case 'shortcut': return 'Shortcut (.lnk)';
      default:
        const ext = item.name.split('.').pop()?.toUpperCase();
        return ext ? `${ext} File` : 'File';
    }
  });

  fullPath = computed(() => {
    const ctx = this.context();
    if (!ctx) return '';
    return ctx.path.endsWith('/') ? `${ctx.path}${ctx.item.name}` : `${ctx.path}/${ctx.item.name}`;
  });
}
