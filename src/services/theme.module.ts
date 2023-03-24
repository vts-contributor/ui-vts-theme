import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { VtsThemeStorageService } from './theme-storage.service';
import { VtsThemeService } from './theme.service';
import { VTS_THEME_CONFIG } from './tokens';
import { VtsThemeConfig } from './types';

@NgModule({})
export class VtsThemeModule { 
  static forRoot(config: VtsThemeConfig): ModuleWithProviders<VtsThemeModule> {
    return {
      ngModule: VtsThemeModule,
      providers: [
        {
          provide: VTS_THEME_CONFIG,
          useValue: config
        },
        VtsThemeStorageService,
        VtsThemeService,
        { 
          provide: APP_INITIALIZER, 
          useFactory: (_service: VtsThemeService) => () => {}, 
          deps: [VtsThemeService], 
          multi: true 
        }
      ]
    };
  }
}
