import { type ExecutionContext } from '@nestjs/common'
import { type ModuleRef } from '@nestjs/core'
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql'
import type DataLoader from 'dataloader'
import { type Factory, type LifetimeKeyFn } from './types.js'
import { DataloaderException } from './DataloaderException.js'

/** @private */
const OPTIONS_TOKEN = Symbol('DataloaderModuleOptions')

/** @private */
interface StoreItem {
  /** ModuleRef is used by the `@Loader()` decorator to pull the Factory instance from Nest's DI container */
  moduleRef: ModuleRef
  /**
   * Dataloaders being constructed by a given Factory for this request. The value is the loader's *creation
   * promise* so that concurrent `@Loader()` resolutions memoise and share a single instance (see Loader.decorator).
   */
  dataloaders: Map<Factory, Promise<DataLoader<unknown, unknown>>>
}

/**
 * A weak map that tracks the requests and the dataloaders created for those requests
 * @private
 */
const store = new WeakMap<object, StoreItem>()

/**
 * Given Nestjs execution context, obtain something that is scoped to the lifetime of the current request and does not
 * change during request processing (same instance).
 * @private
 */
const lifetimeKey: LifetimeKeyFn = (context: ExecutionContext) => {
  const type = context.getType<GqlContextType>()

  switch (type) {
    case 'graphql': return GqlExecutionContext.create(context).getContext<{ req: object }>().req
    case 'http': return context.switchToHttp().getRequest<object>()
    // Support for other context types can be added later, we just did not need them yet.
    case 'ws':
    case 'rpc':
    default: throw new DataloaderException(`Unknown or unsupported context type: ${type}`)
  }
}

export {
  OPTIONS_TOKEN,
  store,
  lifetimeKey,
}
