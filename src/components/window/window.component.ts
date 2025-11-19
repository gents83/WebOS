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
  standalone: true,
  template: `
@let win = window();
<div
  #windowEl
  (mousedown)="onFocus()"
  class="fixed flex flex-col bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200 ease-out"
  [class.transition-none]="isDragging() || isResizing()"
  [class.w-full]="win.state === 'maximized'"
  [class.h-full]="win.state === 'maximized'"
  [class.top-0]="win.state === 'maximized'"
  [class.left-0]="win.state === 'maximized'"
  [class.rounded-none]="win.state === 'maximized'"
  [style.left.px]="win.state !== 'maximized' ? win.position.x : null"
  [style.top.px]="win.state !== 'maximized' ? win.position.y : null"
  [style.width.px]="win.state !== 'maximized' ? win.size.width : null"
  [style.height.px]="win.state !== 'maximized' ? win.size.height : null"
  [style.zIndex]="win.zIndex"
>
  <!-- Resize Handles -->
  <div class="absolute top-0 left-0 w-2 h-2 cursor-nwse-resize" (mousedown)="onResizeStart($event, 'tl')"></div>
  <div class="absolute top-0 right-0 w-2 h-2 cursor-nesw-resize" (mousedown)="onResizeStart($event, 'tr')"></div>
  <div class="absolute bottom-0 left-0 w-2 h-2 cursor-nesw-resize" (mousedown)="onResizeStart($event, 'bl')"></div>
  <div class="absolute bottom-0 right-0 w-2 h-2 cursor-nwse-resize" (mousedown)="onResizeStart($event, 'br')"></div>
  <div class="absolute top-0 left-2 right-2 h-1 cursor-ns-resize" (mousedown)="onResizeStart($event, 't')"></div>
  <div class="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize" (mousedown)="onResizeStart($event, 'b')"></div>
  <div class="absolute top-2 bottom-2 left-0 w-1 cursor-ew-resize" (mousedown)="onResizeStart($event, 'l')"></div>
  <div class="absolute top-2 bottom-2 right-0 w-1 cursor-ew-resize" (mousedown)="onResizeStart($event, 'r')"></div>

  <!-- Header / Title Bar -->
  <header
    #header
    (mousedown)="onDragStart($event)"
    (dblclick)="onMaximize()"
    class="flex items-center justify-between pl-3 pr-1 h-10 bg-zinc-900/50 flex-shrink-0 cursor-move select-none"
  >
    <div class="flex items-center gap-2">
      <img [src]="win.icon" [alt]="win.title" class="h-4 w-4">
      <span class="text-sm font-light">{{ win.title }}</span>
    </div>
    <div class="flex items-center space-x-1">
      <button (click)="onMinimize()" class="h-8 w-10 flex items-center justify-center hover:bg-white/10 rounded">
         <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
      </button>
      <button (click)="onMaximize()" class="h-8 w-10 flex items-center justify-center hover:bg-white/10 rounded">
        @if (win.state === 'maximized') {
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15h6v6m-6-6l14-14m-6 0h6v6" /></svg>
        } @else {
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 3v18h18V3H3z" /></svg>
        }
      </button>
      <button (click)="onClose()" class="h-8 w-10 flex items-center justify-center hover:bg-red-500 rounded">
         <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-grow bg-zinc-800/90 overflow-auto">
    @switch (win.appId) {
      @case ('notepad') {
        <app-notepad 
          [launchData]="win.launchData"
          (titleChange)="onTitleChange($event)"
        ></app-notepad>
      }
      @case ('calculator') {
        <app-calculator></app-calculator>
      }
      @case ('browser') {
        <app-browser></app-browser>
      }
      @case ('explorer') {
        <app-explorer></app-explorer>
      }
      @case ('terminal') {
        <app-terminal></app-terminal>
      }
      @case ('settings') {
        <app-settings></app-settings>
      }
      @case ('properties') {
        <app-properties></app-properties>
      }
    }
  </main>
</div>`,
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
