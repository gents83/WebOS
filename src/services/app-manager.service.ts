import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppManagerService {
  private openAppSource = new Subject<string>();
  openAppRequest$ = this.openAppSource.asObservable();

  private navigateToSectionSource = new Subject<string>();
  navigateToSection$ = this.navigateToSectionSource.asObservable();

  openApp(appId: string, section?: string) {
    this.openAppSource.next(appId);
    if (section) {
      this.navigateToSectionSource.next(section);
    }
  }
}
