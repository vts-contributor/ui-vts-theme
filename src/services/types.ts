export type VtsTheme = 'default' | 'dark'

export type VtsThemeItem = { theme: VtsTheme, url: string }

export type VtsThemeConfig = {
    themes: VtsThemeItem[],
    defaultTheme: VtsTheme
}