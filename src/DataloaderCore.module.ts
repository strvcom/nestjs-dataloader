import { type DynamicModule, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { DataloaderInterceptor } from './Dataloader.interceptor.js'
import { OPTIONS_TOKEN } from './internal.js'
import { type DataloaderModuleOptions, type DataloaderOptions } from './types.js'

/** @private */
@Module({})
class DataloaderCoreModule {
  static forRoot(options?: DataloaderOptions): DynamicModule {
    return this.forRootAsync({ useFactory: () => options ?? {} })
  }

  static forRootAsync(options: DataloaderModuleOptions): DynamicModule {
    return {
      module: DataloaderCoreModule,
      imports: options.imports ?? [],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: DataloaderInterceptor },
        { provide: OPTIONS_TOKEN, inject: options.inject ?? [], useFactory: options.useFactory },
      ],
    }
  }
}

export {
  DataloaderCoreModule,
}
