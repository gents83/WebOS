import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-browser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="h-full w-full flex flex-col bg-zinc-900 text-white">
      <div class="flex-shrink-0 p-2 border-b border-white/10 flex items-center gap-2 bg-zinc-800">
        <button (click)="goBack()" class="p-1 rounded hover:bg-white/10 disabled:opacity-50" [disabled]="!canGoBack()"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
        <button (click)="goForward()" class="p-1 rounded hover:bg-white/10 disabled:opacity-50" [disabled]="!canGoForward()"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>
        <button (click)="reload()" class="p-1 rounded hover:bg-white/10"><svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0 0v4.992m0 0h-4.992" /></svg></button>
        <div class="flex-grow relative">
          <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search or enter address"
            class="w-full bg-zinc-700 rounded-full px-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            [value]="urlInput()"
            (input)="urlInput.set($event.target.value)"
            (keydown.enter)="navigateToUrl()"
          />
        </div>
      </div>
      <div class="flex-grow bg-white">
        @if (safeUrl()) {
          <iframe [src]="safeUrl()" class="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"></iframe>
        } @else {
          <div class="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-100">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-blue-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
               <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 011-1h.5a1.5 1.5 0 000-3H6a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
             </svg>
            <h2 class="text-2xl font-semibold">Browser</h2>
            <p class="text-zinc-600">Enter a URL to start browsing</p>
          </div>
        }
      </div>
    </div>
  `
})
export class BrowserComponent {
  urlInput = signal('https://www.google.com/webhp?igu=1');
  safeUrl = signal<SafeResourceUrl | null>(null);
  
  private history: string[] = [];
  private historyIndex = -1;

  constructor(private sanitizer: DomSanitizer) {
    this.navigateToUrl();
  }

  navigateToUrl(): void {
    let url = this.urlInput().trim();
    if (!url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if(url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.urlInput.set(url);

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(url);
    this.historyIndex++;
  }

  goBack(): void {
    if (this.canGoBack()) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      this.urlInput.set(url);
    }
  }

  goForward(): void {
    if (this.canGoForward()) {
      this.historyIndex++;
      const url = this.history[this.historyIndex];
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      this.urlInput.set(url);
    }
  }

  reload(): void {
    const currentUrl = this.safeUrl();
    if (currentUrl) {
        this.safeUrl.set(null);
        setTimeout(() => this.safeUrl.set(currentUrl), 0);
    }
  }

  canGoBack = () => this.historyIndex > 0;
  canGoForward = () => this.historyIndex < this.history.length - 1;
}