import { Injectable } from '@angular/core';

@Injectable()
export class VtsThemeStorageService {
  setBool(key: string, value: boolean) {
    localStorage.setItem(key, String(value));
  }

  getBool(key: string): boolean {
    return localStorage.getItem(key) === 'true';
  }

  setObject<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getObject<T>(key: string): T {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  }
}
