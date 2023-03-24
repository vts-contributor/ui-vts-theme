import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VtsThemeStorageService } from './theme-storage.service';
import { VTS_THEME_CONFIG } from './tokens';
import { VtsTheme, VtsThemeConfig, VtsThemeItem } from './types';

export const THEME_KEY = 'vts-theme'

@Injectable()
export class VtsThemeService implements OnDestroy {
  readonly theme$ = new BehaviorSubject<VtsTheme | null>(null)
  readonly allTheme$ = new BehaviorSubject<VtsThemeItem[]>([])
 
  private _theme: VtsTheme | null = null
  set theme(value: VtsTheme | null) {
    this._theme = value
    this.theme$.next(this._theme)
  }
  get theme() {
    return this._theme
  }

  private _allTheme: VtsThemeItem[] = []
  set allTheme(value: VtsThemeItem[]) {
    this._allTheme = value
    this.allTheme$.next(this._allTheme)
  }
  get allTheme() {
    return this._allTheme
  }

  constructor(
    @Inject(VTS_THEME_CONFIG) private config: VtsThemeConfig,
    @Inject(DOCUMENT) private document: Document, 
    private storage: VtsThemeStorageService) {
    this.init()
  }

  ngOnDestroy(): void {
    this.theme$.complete()
    this.allTheme$.complete()
  }

  setTheme(theme: VtsTheme) {
    if (this.allTheme.filter(i => i.theme === theme).length) {
      this._theme = theme
      this.loadTheme()
    } else {
      throw new Error(`Unable to find theme ${theme}!`)
    }
  }

  loadTheme() {
    if (!this.document)
      return
    const url = this._allTheme.filter(i => i.theme === this._theme)?.[0]?.url
    if (!url)
      throw new Error(`Unable to find theme ${this._theme}!`)
    const script = this.document.createElement('link');
    script.type = 'text/css';
    script.rel = 'stylesheet';
    script.id = `vts-theme-${this._theme}`;
    script.href = `${url}`;
    script.onload = () => {
      // Emit new theme loaded
      this.theme = this._theme
      this.storage.setObject(THEME_KEY, this._theme)
      this.document.body.setAttribute('vts-theme', this._theme!)
      this._allTheme.map(i => i.theme).filter(i => i !== this._theme).forEach((i) => {
        const dom = this.document.getElementById(`vts-theme-${i}`)
        if (dom)
          dom.remove()
      })
    };
    this.document.body.append(script)
  }

  init() {
    const valid: string[] = []
    const themes: VtsThemeItem[] = this.config.themes.filter(i => {
      if (valid.includes(i.theme))
        return false
      if (!!i.url) {
        valid.push(i.theme)
        return true
      }
      return false
    })
    if (!themes.length)
      throw new Error("No theme provided or invalid data was provided!")
    this.allTheme = themes
    const cache = this.storage.getObject<VtsTheme>(THEME_KEY)
    this._theme = themes.some(i => i.theme === cache) ? cache : (this.config.defaultTheme || themes[0].theme)
    this.loadTheme()
  }
}
