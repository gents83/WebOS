import { App } from './models/app.model';
import { NotepadComponent } from './components/apps/notepad/notepad.component';
import { CalculatorComponent } from './components/apps/calculator/calculator.component';
import { BrowserComponent } from './components/apps/browser/browser.component';
import { ExplorerComponent } from './components/apps/explorer/explorer.component';
import { TerminalComponent } from './components/apps/terminal/terminal.component';
import { SettingsComponent } from './components/apps/settings/settings.component';
import { PropertiesComponent } from './components/apps/properties/properties.component';

export const APP_LIST: App[] = [
  { 
    id: 'explorer', 
    name: 'File Explorer', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFCA28"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.9-2-2-2h-8l-2-2z"></path></svg>', 
    component: ExplorerComponent,
    position: { x: 20, y: 20 }
  },
  { 
    id: 'browser', 
    name: 'Browser', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177.177a9 9 0 0 0-11.48-13.218M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>', 
    component: BrowserComponent,
    position: { x: 20, y: 120 }
  },
  { 
    id: 'notepad', 
    name: 'Notepad', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>', 
    component: NotepadComponent,
    position: { x: 20, y: 220 }
  },
  { 
    id: 'calculator', 
    name: 'Calculator', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4H7V7h10v2z"/></svg>', 
    component: CalculatorComponent,
    position: { x: 20, y: 320 }
  },
  { 
    id: 'terminal', 
    name: 'Terminal', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2342C558"><path d="m4 11 5 5-5 5L2.59 19.59 5.17 17 2.59 14.41 4 13m5-6-5-5 5-5L10.41 1.41 7.83 4l2.58 2.59L9 8m12 11h-8v-2h8v2z"/></svg>', 
    component: TerminalComponent,
    position: { x: 130, y: 20 }
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>', 
    component: SettingsComponent,
    position: { x: 130, y: 120 }
  },
  {
    id: 'properties',
    name: 'Properties',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>',
    component: PropertiesComponent,
    showInLauncher: false, // Hidden from desktop/start menu
  }
];