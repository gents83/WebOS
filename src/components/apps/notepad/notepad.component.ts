import { Component, ChangeDetectionStrategy, signal, inject, input, effect, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { CommonModule } from '@angular/common';
import { FileSystemService } from '../../../services/file-system.service';

@Component({
  selector: 'app-notepad',
  template: `
<div class="h-full w-full flex flex-col bg-zinc-900 text-white">
  <textarea 
    class="flex-grow w-full p-4 bg-transparent text-white font-mono focus:outline-none resize-none"
    placeholder="Start typing..."
    [value]="content()"
    (input)="content.set($event.target.value)">
  </textarea>
  
  @if (isAiConfigured) {
    <div class="flex-shrink-0 p-2 border-t border-white/10 flex items-center gap-2 bg-zinc-800">
      <input 
        type="text" 
        placeholder="Ask AI to edit, summarize, or continue..."
        class="flex-grow bg-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        [value]="aiPrompt()"
        (input)="aiPrompt.set($event.target.value)"
        (keydown.enter)="onAskAi()"
        [disabled]="isLoading()"
      />
      <button 
        (click)="onAskAi()" 
        [disabled]="isLoading() || !aiPrompt()"
        class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center w-28">
        @if (isLoading()) {
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Thinking...</span>
        } @else {
          <span>Ask AI</span>
        }
      </button>
    </div>
  } @else {
    <div class="flex-shrink-0 p-2 border-t border-white/10 text-center text-xs text-yellow-400 bg-zinc-800">
      AI features disabled. Set API_KEY to enable Gemini.
    </div>
  }
</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule]
})
export class NotepadComponent {
  private geminiService = inject(GeminiService);
  private fileSystemService = inject(FileSystemService);

  launchData = input<{ filePath: string } | undefined>();
  titleChange = output<string>();
  
  content = signal('');
  aiPrompt = signal('');
  isLoading = signal(false);
  isAiConfigured = this.geminiService.isConfigured();
  filePath = signal<string | null>(null);

  constructor() {
    effect(() => {
      const data = this.launchData();
      if (data?.filePath) {
        const fileContent = this.fileSystemService.getFileContent(data.filePath);
        if (fileContent !== undefined) {
            this.content.set(fileContent);
            this.filePath.set(data.filePath);
            const fileName = data.filePath.split('/').pop() || 'Untitled';
            this.titleChange.emit(`${fileName} - Notepad`);
        }
      }
    });
  }

  async onAskAi() {
    if (!this.aiPrompt() || this.isLoading()) return;
    this.isLoading.set(true);

    const fullPrompt = `The user is editing text in a notepad. Here is the current content:\n\n---\n${this.content()}\n---\n\nNow, apply this instruction: ${this.aiPrompt()}`;
    
    try {
      const response = await this.geminiService.generateText(fullPrompt);
      this.content.set(response);
    } catch (e: any) {
      this.content.update(c => c + `\n\n[AI Error: ${e.message}]`);
    } finally {
      this.isLoading.set(false);
      this.aiPrompt.set('');
    }
  }
}
