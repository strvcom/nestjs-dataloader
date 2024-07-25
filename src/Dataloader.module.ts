import { type DynamicModule, Module } from '@nestjs/common'
import { type DataloaderModuleOptions, type Factory, type DataloaderOptions } from './types.js'
import { DataloaderCoreModule } from './DataloaderCore.module.js'

@Module({})
class DataloaderModule {
  static forRoot(options?: DataloaderOptions): DynamicModule {
    return {
      module: DataloaderModule,
      imports: [DataloaderCoreModule.forRoot(options)],
    }
  }

  static forRootAsync(options: DataloaderModuleOptions): DynamicModule {
    return {
      module: DataloaderModule,
      imports: [DataloaderCoreModule.forRootAsync(options)],
    }
  }

  static forFeature(loaders: Factory[]): DynamicModule {
    return {
      module: DataloaderModule,
      providers: loaders,
      exports: loaders,
    }
  }
}


export {
  DataloaderModule,
}
