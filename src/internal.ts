import { type ExecutionContext, type Type } from '@nestjs/common'
import { type ModuleRef } from '@nestjs/core'
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql'
import type DataLoader from 'dataloader'
import { type DataloaderFactory } from './DataloaderFactory.js'

/**
 * DataloaderFactory constructor type
 * @private
 */
type Factory = Type<DataloaderFactory<unknown, unknown>>

/** @private */
interface StoreItem {
  /** ModuleRef is used by the `@Loader()` decorator to pull the Factory instance from Nest's DI container */
  moduleRef: ModuleRef
  /** Dataloaders already constructed by a given Factory for this request. */
  dataloaders: Map<Factory, DataLoader<unknown, unknown>>
}

/**
 * A weak map that tracks the requests and the dataloaders created for those requests
 * @private
 */
const store = new WeakMap<object, StoreItem>()

/**
 * Given Nestjs execution context, obtain something that is scoped to the lifetime of the current request and does not
 * change (same instance).
 * @private
 */
function ctxkey(context: ExecutionContext) {
  const type = context.getType<GqlContextType>()

  switch (type) {
    case 'graphql': return GqlExecutionContext.create(context).getContext<{ req: object }>().req
    case 'http': return context.switchToHttp().getRequest<object>()
    // Support for other request types can be added later, we just did not need them yet.
    default: throw new Error(`Unknown or unsupported context type: ${type}`)
  }
}

export {
  store,
  Factory,
  ctxkey,
}
