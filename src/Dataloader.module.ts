import { DynamicModule, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { DataloaderInterceptor } from './Dataloader.interceptor.js'

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: DataloaderInterceptor },
  ],
})
class DataloaderModule {
  static forRoot(): DynamicModule {
    return {
      module: DataloaderModule,
    }
  }
}

export {
  DataloaderModule,
}
