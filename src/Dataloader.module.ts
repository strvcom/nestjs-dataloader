import { DynamicModule, type FactoryProvider, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { DataloaderInterceptor } from './Dataloader.interceptor.js'
import { OPTIONS_TOKEN } from './internal.js'
import { type DataloaderOptions } from './types.js'

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DataloaderInterceptor },
  ],
})
class DataloaderModule {
  static forRoot(options?: DataloaderOptions): DynamicModule {
    return {
      module: DataloaderModule,
      providers: [{
        provide: OPTIONS_TOKEN,
        useValue: options,
      }],
    }
  }

  static forRootAsync(options: DataloaderModuleOptions): DynamicModule {
    return {
      module: DataloaderModule,
      imports: options.imports ?? [],
      providers: [{
        provide: OPTIONS_TOKEN,
        inject: options.inject ?? [],
        useFactory: options.useFactory,
      }],
    }
  }
}

/** Dataloader module options for async configuration */
type DataloaderModuleOptions = Omit<FactoryProvider<DataloaderOptions>, 'provide'> & Pick<DynamicModule, 'imports'>


export {
  DataloaderModule,
  DataloaderModuleOptions,
}
