import { Type } from '@angular/core';

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'closed';

export interface App {
  id: string;
  name: string;
  icon: string;
  component: Type<any>;
  position?: { x: number, y: number };
  showInLauncher?: boolean;
}

export interface AppWindow {
  id: number;
  appId: string;
  title: string;
  icon: string;
  component: Type<any>;
  // Fix: Allow 'closed' state to match WindowState type and fix comparison error.
  state: 'normal' | 'maximized' | 'minimized' | 'closed';
  prevStateBeforeMinimize?: 'normal' | 'maximized';
  position: { x: number, y: number };
  size: { width: number, height: number };
  zIndex: number;
  launchData?: { filePath: string };
}
