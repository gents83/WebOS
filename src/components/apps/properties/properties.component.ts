import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';
import { FileIconComponent } from '../explorer/file-icon.component';
// Fix: Correct import path for FileSystemItem
import type { FileSystemItem } from '../../../models/file-system.model';

@Component({
  selector: 'app-properties',
  template: `
<div class="h-full w-full bg-zinc-800 text-white p-4 text-sm select-none">
  @if (context(); as ctx) {
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center gap-4 pb-4 border-b border-white/10">
        <app-file-icon [type]="ctx.item.type" [name]="ctx.item.name"></app-file-icon>
        <h1 class="text-lg font-semibold truncate">{{ ctx.item.name }}</h1>
      </div>

      <!-- Properties List -->
      <div class="py-4 space-y-3 flex-grow overflow-y-auto">
        <div class="grid grid-cols-3 gap-2">
          <span class="text-gray-400">Type of file:</span>
          <span class="col-span-2 truncate">{{ itemType() }}</span>
        </div>
        @if (ctx.item.type === 'shortcut' && ctx.item.targetPath) {
           <div class="grid grid-cols-3 gap-2">
            <span class="text-gray-400">Target:</span>
            <span class="col-span-2 truncate" [title]="ctx.item.targetPath">{{ ctx.item.targetPath }}</span>
          </div>
        }
        <div class="grid grid-cols-3 gap-2">
          <span class="text-gray-400">Location:</span>
          <span class="col-span-2 truncate" [title]="ctx.path">{{ ctx.path }}</span>
        </div>
        @if (ctx.item.size) {
           <div class="grid grid-cols-3 gap-2">
            <span class="text-gray-400">Size:</span>
            <span class="col-span-2">{{ ctx.item.size }}</span>
          </div>
        }
        <hr class="border-white/10 !my-4">
        <div class="grid grid-cols-3 gap-2">
          <span class="text-gray-400">Modified:</span>
          <span class="col-span-2">{{ ctx.item.modified }}</span>
        </div>
      </div>
      
       <!-- Footer -->
       <div class="flex justify-end pt-4 border-t border-white/10">
         <button class="px-6 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500">OK</button>
       </div>
    </div>
  } @else {
    <div class="flex items-center justify-center h-full text-gray-500">
      No item selected.
    </div>
  }
</div>`,
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
