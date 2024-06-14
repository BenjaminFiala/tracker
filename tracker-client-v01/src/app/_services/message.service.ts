import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages: string[] = [];
  constructor() {
    this.messages = JSON.parse(sessionStorage.getItem('messages') || '[]');
  }
  add(message: string) {
    this.messages.push(message);
    sessionStorage.setItem('messages', JSON.stringify(this.messages));
  }
  clear() {
    this.messages = [];
    sessionStorage.removeItem('messages');
  }
}
