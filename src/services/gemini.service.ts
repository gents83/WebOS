
import { Injectable, inject } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey = process.env.API_KEY;

  constructor() {
    if(this.apiKey) {
      this.ai = new GoogleGenAI({apiKey: this.apiKey});
    } else {
      console.warn('Gemini API key not found. AI features will be disabled.');
    }
  }

  isConfigured(): boolean {
    return !!this.ai;
  }
  
  async generateText(prompt: string): Promise<string> {
    if (!this.ai) {
      return Promise.resolve("AI is not configured. Please set the API_KEY environment variable.");
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return Promise.resolve(`Error: Could not generate text. ${error.message}`);
    }
  }
}
