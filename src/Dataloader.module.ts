import { type DynamicModule, Module } from '@nestjs/common'
import { type DataloaderModuleOptions, type DataloaderOptions } from './types.js'
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
}


export {
  DataloaderModule,
}
