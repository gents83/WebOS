import { Component, ChangeDetectionStrategy, signal, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface TerminalLine {
  type: 'input' | 'output';
  text: string;
}

@Component({
  selector: 'app-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="h-full w-full bg-black text-green-400 font-mono p-2 text-sm" (click)="focusInput()">
      <div #outputContainer class="overflow-y-auto h-full" (scroll)="(0)">
        @for(line of lines(); track $index) {
          <div>
            @if (line.type === 'input') {
              <span class="text-blue-400">C:\\Users\\User> </span><span>{{ line.text }}</span>
            } @else {
              <span [innerHTML]="line.text"></span>
            }
          </div>
        }
        <div class="flex">
          <span class="text-blue-400">C:\\Users\\User> </span>
          <input 
            #inputEl
            type="text" 
            spellcheck="false"
            autocomplete="off"
            class="bg-transparent text-green-400 focus:outline-none flex-grow"
            [(ngModel)]="currentInput"
            (keydown.enter)="onCommand()"
          />
        </div>
      </div>
    </div>
  `
})
export class TerminalComponent {
  lines = signal<TerminalLine[]>([]);
  currentInput = '';
  
  inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  outputContainer = viewChild.required<ElementRef<HTMLDivElement>>('outputContainer');
  
  constructor() {
    this.lines.set([
      { type: 'output', text: 'Windows [Version 11.0.22631.3810]<br>(c) Microsoft Corporation. All rights reserved.<br><br>' }
    ]);
    afterNextRender(() => {
        this.focusInput();
    });
  }

  focusInput() {
    this.inputEl().nativeElement.focus();
  }
  
  onCommand() {
    const command = this.currentInput.trim();
    this.lines.update(l => [...l, { type: 'input', text: command }]);
    if (command) {
      this.executeCommand(command);
    }
    this.currentInput = '';
    this.scrollToBottom();
  }

  private executeCommand(command: string) {
    const parts = command.toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    let output = '';

    switch(cmd) {
      case 'help':
        output = `Available commands:<br>
          &nbsp;&nbsp;help&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Show this help message<br>
          &nbsp;&nbsp;clear&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear the terminal screen<br>
          &nbsp;&nbsp;date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Display the current date and time<br>
          &nbsp;&nbsp;echo&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Display a line of text<br>
          &nbsp;&nbsp;whoami&nbsp;&nbsp;&nbsp;&nbsp; Display the current user<br>
        `;
        break;
      case 'clear':
        this.lines.set([]);
        return;
      case 'date':
        output = new Date().toString();
        break;
      case 'echo':
        output = args.join(' ');
        break;
      case 'whoami':
        output = 'User';
        break;
      default:
        output = `'${cmd}' is not recognized as an internal or external command,<br>operable program or batch file.`;
    }
    this.lines.update(l => [...l, { type: 'output', text: output }]);
  }
  
  private scrollToBottom() {
      setTimeout(() => {
        try {
            this.outputContainer().nativeElement.scrollTop = this.outputContainer().nativeElement.scrollHeight;
        } catch {}
      }, 0);
  }
}
