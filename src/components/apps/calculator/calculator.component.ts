import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full flex flex-col bg-zinc-800 p-2 text-white select-none">
      <div class="display flex-grow flex items-end justify-end p-4 bg-zinc-900 rounded-md mb-2">
        <span class="text-5xl font-light">{{ display() }}</span>
      </div>
      <div class="buttons grid grid-cols-4 gap-2">
        @for (btn of buttons; track btn) {
          <button
            (click)="onButtonClick(btn)"
            class="h-16 rounded text-2xl"
            [class.bg-zinc-700]="isSpecial(btn)"
            [class.hover:bg-zinc-600]="isSpecial(btn)"
            [class.bg-orange-500]="isOperator(btn)"
            [class.hover:bg-orange-400]="isOperator(btn)"
            [class.bg-zinc-600]="!isSpecial(btn) && !isOperator(btn)"
            [class.hover:bg-zinc-500]="!isSpecial(btn) && !isOperator(btn)"
            [class.col-span-2]="btn === '0'"
          >
            {{ btn }}
          </button>
        }
      </div>
    </div>
  `
})
export class CalculatorComponent {
  display = signal('0');
  private currentVal = '';
  private operator: string | null = null;
  private firstOperand: number | null = null;
  private waitingForSecondOperand = false;

  buttons = [
    'C', '±', '%', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '='
  ];
  
  isOperator(btn: string): boolean {
    return ['/', '*', '-', '+', '='].includes(btn);
  }

  isSpecial(btn: string): boolean {
    return ['C', '±', '%'].includes(btn);
  }

  onButtonClick(btn: string): void {
    if (!isNaN(Number(btn)) || btn === '.') {
      this.handleNumber(btn);
    } else if (this.isOperator(btn)) {
      this.handleOperator(btn);
    } else {
      this.handleSpecial(btn);
    }
  }

  private handleNumber(num: string) {
    if (this.waitingForSecondOperand) {
      this.currentVal = num;
      this.waitingForSecondOperand = false;
    } else {
      this.currentVal = this.currentVal === '0' && num !== '.' ? num : this.currentVal + num;
    }
    this.display.set(this.currentVal);
  }
  
  private handleOperator(op: string) {
    const inputValue = parseFloat(this.currentVal);

    if (this.operator && this.waitingForSecondOperand)  {
        this.operator = op;
        return;
    }

    if (this.firstOperand === null) {
        this.firstOperand = inputValue;
    } else if (this.operator) {
        const result = this.calculate(this.firstOperand, inputValue, this.operator);
        this.display.set(String(result));
        this.firstOperand = result;
    }

    this.waitingForSecondOperand = true;
    this.operator = op === '=' ? null : op;
    this.currentVal = this.display();
  }
  
  private handleSpecial(btn: string) {
      switch(btn) {
          case 'C':
              this.reset();
              break;
          case '±':
              this.currentVal = String(parseFloat(this.currentVal) * -1);
              this.display.set(this.currentVal);
              break;
          case '%':
              this.currentVal = String(parseFloat(this.currentVal) / 100);
              this.display.set(this.currentVal);
              break;
      }
  }

  private calculate(a: number, b: number, op: string): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  }

  private reset(): void {
    this.display.set('0');
    this.currentVal = '0';
    this.operator = null;
    this.firstOperand = null;
    this.waitingForSecondOperand = false;
  }
}
