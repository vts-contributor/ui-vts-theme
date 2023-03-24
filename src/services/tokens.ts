import { InjectionToken } from "@angular/core";
import { VtsThemeConfig } from "./types";

export const VTS_THEME_CONFIG = new InjectionToken<VtsThemeConfig>(
    'Config for theme switcher'
)