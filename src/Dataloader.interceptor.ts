import * as assert from 'node:assert/strict'
import {
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { lifetimeKey, OPTIONS_TOKEN, store } from './internal.js'
import { type DataloaderOptions } from './types.js'

/** @private */
type Options = DataloaderOptions & Required<Pick<DataloaderOptions, 'lifetime'>>

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
  readonly #options: Options

  constructor(moduleRef: ModuleRef, @Inject(OPTIONS_TOKEN) options?: DataloaderOptions) {
    this.#moduleRef = moduleRef
    this.#options = {
      lifetime: lifetimeKey,
      ...options,
    }

    assert.ok(this.#options.lifetime, '`lifetime` must be set')
    assert.equal(typeof this.#options.lifetime, 'function', '`lifetime` must be a function')
  }

  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    store.set(this.#options.lifetime(context), {
      moduleRef: this.#moduleRef,
      dataloaders: new Map(),
    })

    return next.handle()
  }
}

export {
  DataloaderInterceptor,
}
