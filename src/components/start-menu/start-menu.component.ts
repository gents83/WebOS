import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { App } from '../../models/app.model';

@Component({
  selector: 'app-start-menu',
  standalone: true,
  // Fix: Set ChangeDetectionStrategy to OnPush for better performance with signal-based components.
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-zinc-800/80 backdrop-blur-2xl rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
  <!-- Search Bar -->
  <div class="p-4 flex-shrink-0">
    <div class="relative">
      <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input 
        type="text" 
        placeholder="Type here to search" 
        class="w-full bg-zinc-700/80 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        [value]="searchTerm()"
        (input)="searchTerm.set($event.target.value)"
      />
    </div>
  </div>

  <!-- App List -->
  <div class="flex-grow p-4 pt-0 overflow-y-auto">
    <h2 class="text-lg font-semibold text-white mb-2">All Apps</h2>
    <div class="grid grid-cols-1 gap-1">
      @for (app of filteredApps(); track app.id) {
        <button (click)="onAppClick(app.id)" class="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-left w-full">
          <img [src]="app.icon" [alt]="app.name" class="w-6 h-6">
          <span class="text-sm text-white">{{ app.name }}</span>
        </button>
      }
    </div>
  </div>
</div>`,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translate(-50%, 20px) scale(0.98); }
      to { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
  `]
})
export class StartMenuComponent {
  apps = input.required<App[]>();
  launchApp = output<string>();
  
  searchTerm = signal('');

  filteredApps = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.apps();
    return this.apps().filter(app => app.name.toLowerCase().includes(term));
  });

  onAppClick(appId: string) {
    this.launchApp.emit(appId);
  }
}
