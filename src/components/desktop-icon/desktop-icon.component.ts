import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import type { App } from '../../models/app.model';

@Component({
  selector: 'app-desktop-icon',
  templateUrl: './desktop-icon.component.html',
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
