import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { ctxkey, store } from './internal.js'

/**
 * Interceptor that keeps a weak reference to all requests in order for the `@Loader()` param decorator to manage
 * `DataLoader` instances.
 *
 * The purpose of this interceptor is two-fold:
 * - all dataloaders must be request-scoped, so we need to grab something that is scoped to the lifetime of the current
 *   request. Usually, this is the `req` object itself.
 * - we want to lazily construct instances of Dataloaders when they are needed, and for that we need to save the
 *   `moduleRef` instance in order to have access to Nest's dependency injection container from the `@Loader` decorator.
 *
 * @private
 */
@Injectable()
class DataloaderInterceptor implements NestInterceptor<unknown, unknown> {
  /** The Nest.js module that imports this interceptor, usually the root module */
  readonly #moduleRef: ModuleRef

  constructor(moduleRef: ModuleRef) {
    this.#moduleRef = moduleRef
  }

  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    store.set(ctxkey(context), {
      moduleRef: this.#moduleRef,
      dataloaders: new Map(),
    })

    return next.handle()
  }
}

export {
  DataloaderInterceptor,
}
