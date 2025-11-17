import { Component, input, output, ChangeDetectionStrategy, ElementRef, viewChild, effect, untracked, signal, model, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import type { AppWindow, WindowState } from '../../models/app.model';

// Import all app components that can be dynamically rendered
import { NotepadComponent } from '../apps/notepad/notepad.component';
import { CalculatorComponent } from '../apps/calculator/calculator.component';
import { BrowserComponent } from '../apps/browser/browser.component';
import { ExplorerComponent } from '../apps/explorer/explorer.component';
import { TerminalComponent } from '../apps/terminal/terminal.component';
import { SettingsComponent } from '../apps/settings/settings.component';
import { PropertiesComponent } from '../apps/properties/properties.component';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  imports: [
    NgComponentOutlet,
    NotepadComponent,
    CalculatorComponent,
    BrowserComponent,
    ExplorerComponent,
    TerminalComponent,
    SettingsComponent,
    PropertiesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowComponent {
  window = input.required<AppWindow>();

  windowFocus = output<number>();
  windowStateChange = output<{ id: number; state: WindowState } & Partial<AppWindow>>();
  windowDrag = output<{ id: number; position: { x: number; y: number } }>();
  windowResize = output<{ id: number; size: { width: number; height: number } }>();
  windowUpdate = output<{ id: number; changes: Partial<AppWindow> }>();
  
  header = viewChild.required<ElementRef>('header');
  windowEl = viewChild.required<ElementRef>('windowEl');
  
  isDragging = signal(false);
  isResizing = signal(false);
  resizeDirection = signal('');
  
  private dragOffset = { x: 0, y: 0 };
  private initialSize = { width: 0, height: 0 };
  private initialPosition = { x: 0, y: 0 };
  private startMousePosition = { x: 0, y: 0 };
  
  private previousState = {
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 }
  };

  constructor() {
    effect(() => {
        const win = this.window();
        untracked(() => {
            if (win.state === 'maximized') {
                this.previousState = { position: win.position, size: win.size };
            }
        });
    });
  }

  onFocus() {
    this.windowFocus.emit(this.window().id);
  }

  onClose() {
    this.windowStateChange.emit({ id: this.window().id, state: 'closed' });
  }

  onMinimize() {
    this.windowStateChange.emit({ id: this.window().id, state: 'minimized' });
  }

  onMaximize() {
     if (this.window().state === 'maximized') {
        this.windowStateChange.emit({ id: this.window().id, state: 'normal' });
        this.windowDrag.emit({ id: this.window().id, position: this.previousState.position });
        this.windowResize.emit({ id: this.window().id, size: this.previousState.size });
     } else {
        this.windowStateChange.emit({ id: this.window().id, state: 'maximized' });
     }
  }

  onTitleChange(newTitle: string) {
    this.windowUpdate.emit({ id: this.window().id, changes: { title: newTitle } });
  }

  onDragStart(event: MouseEvent) {
    if (this.window().state === 'maximized') return;
    this.isDragging.set(true);
    const { x, y } = this.window().position;
    this.dragOffset = {
      x: event.clientX - x,
      y: event.clientY - y,
    };
    this.onFocus();
    document.addEventListener('mousemove', this.onDragging);
    document.addEventListener('mouseup', this.onDragEnd, { once: true });
  }

  onDragging = (event: MouseEvent) => {
    if (!this.isDragging()) return;
    event.preventDefault();
    const newPos = {
      x: event.clientX - this.dragOffset.x,
      y: event.clientY - this.dragOffset.y,
    };
    this.windowDrag.emit({ id: this.window().id, position: newPos });
  };
  
  onDragEnd = () => {
    this.isDragging.set(false);
    document.removeEventListener('mousemove', this.onDragging);
  };

  onResizeStart(event: MouseEvent, direction: string) {
      event.stopPropagation();
      if (this.window().state === 'maximized') return;
      
      this.isResizing.set(true);
      this.resizeDirection.set(direction);
      
      this.initialSize = { ...this.window().size };
      this.initialPosition = { ...this.window().position };
      this.startMousePosition = { x: event.clientX, y: event.clientY };
      
      this.onFocus();
      document.addEventListener('mousemove', this.onResizing);
      document.addEventListener('mouseup', this.onResizeEnd, { once: true });
  }

  onResizing = (event: MouseEvent) => {
      if (!this.isResizing()) return;
      event.preventDefault();
      
      const dx = event.clientX - this.startMousePosition.x;
      const dy = event.clientY - this.startMousePosition.y;

      let width = this.initialSize.width;
      let height = this.initialSize.height;
      let x = this.initialPosition.x;
      let y = this.initialPosition.y;

      if (this.resizeDirection().includes('r')) {
          width = this.initialSize.width + dx;
      }
      if (this.resizeDirection().includes('l')) {
          width = this.initialSize.width - dx;
          x = this.initialPosition.x + dx;
      }
      if (this.resizeDirection().includes('b')) {
          height = this.initialSize.height + dy;
      }
      if (this.resizeDirection().includes('t')) {
          height = this.initialSize.height - dy;
          y = this.initialPosition.y + dy;
      }

      const minWidth = 300;
      const minHeight = 200;

      if (width >= minWidth) {
          this.windowResize.emit({ id: this.window().id, size: { ...this.window().size, width } });
          if (this.resizeDirection().includes('l')) {
             this.windowDrag.emit({ id: this.window().id, position: { ...this.window().position, x } });
          }
      }

      if (height >= minHeight) {
          this.windowResize.emit({ id: this.window().id, size: { ...this.window().size, height } });
          if (this.resizeDirection().includes('t')) {
             this.windowDrag.emit({ id: this.window().id, position: { ...this.window().position, y } });
          }
      }
  };

  onResizeEnd = () => {
      this.isResizing.set(false);
      this.resizeDirection.set('');
      document.removeEventListener('mousemove', this.onResizing);
  };
}
