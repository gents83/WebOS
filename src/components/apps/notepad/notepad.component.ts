import { Component, ChangeDetectionStrategy, signal, inject, input, effect, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { CommonModule } from '@angular/common';
import { FileSystemService } from '../../../services/file-system.service';

@Component({
  selector: 'app-notepad',
  templateUrl: './notepad.component.html',
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
