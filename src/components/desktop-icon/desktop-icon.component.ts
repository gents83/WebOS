import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { App } from '../../models/app.model';

@Component({
  selector: 'app-desktop-icon',
  // Fix: Set ChangeDetectionStrategy to OnPush for better performance with signal-based components.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
@let appData = app();
<div
  draggable="true"
  (dragstart)="onDragStart($event)"
  (dblclick)="launch.emit(appData.id)"
  (dragover)="onDragOver($event)"
  (dragleave)="onDragLeave()"
  (drop)="onDrop($event)"
  class="absolute flex flex-col items-center justify-center w-24 h-24 p-2 rounded-lg hover:bg-white/10 cursor-pointer select-none text-center transition-colors"
  [class.bg-blue-500/30]="isDragOver()"
  [style.left.px]="appData.position?.x"
  [style.top.px]="appData.position?.y"
>
  <img [src]="appData.icon" [alt]="appData.name" class="w-10 h-10 mb-1 drop-shadow-lg">
  <span class="text-xs text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] truncate w-full">{{ appData.name }}</span>
</div>`,
})
export class DesktopIconComponent {
  app = input.required<App>();
  launch = output<string>();
  dragStart = output<{ event: DragEvent; app: App }>();
  launchWithFile = output<{ appId: string, filePath: string }>();

  isDragOver = signal(false);

  onDragStart(event: DragEvent) {
    this.dragStart.emit({ event, app: this.app() });
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer!.setDragImage(img, 0, 0);
  }

  onDragOver(event: DragEvent) {
    const isFileDrag = event.dataTransfer?.types.includes('application/webos-file-path');
    if (isFileDrag) {
      event.preventDefault();
      this.isDragOver.set(true);
    }
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const filePath = event.dataTransfer?.getData('application/webos-file-path');
    if (filePath) {
      this.launchWithFile.emit({ appId: this.app().id, filePath });
    }
  }
}
