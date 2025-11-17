import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusService {
  activeAppId = signal<string | null>(null);
}
