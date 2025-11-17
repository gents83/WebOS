import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { App } from '../../models/app.model';

@Component({
  selector: 'app-start-menu',
  templateUrl: './start-menu.component.html',
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
