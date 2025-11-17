import { Injectable, signal, computed } from '@angular/core';
import type { App } from '../models/app.model';

@Injectable({ providedIn: 'root' })
export class AppStateService {
    apps = signal<App[]>([]);
    
    launchableApps = computed(() => this.apps().filter(app => app.showInLauncher !== false));
}
