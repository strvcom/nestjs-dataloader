import {
  Injectable,
  Type,
  createParamDecorator,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql'
import type DataLoader from 'dataloader'
import { DataloaderFactory } from './DataloaderFactory.js'

/**
 * DataloaderFactory constructor type
 * @private
 */
type Factory = Type<DataloaderFactory<unknown, unknown>>

/**
 * A key that uniquely identifies a request. This is used to store the dataloaders in a WeakMap.
 * @private
 */
type RequestKey = object

/** @private */
interface InventoryItem {
  /** ModuleRef is used by the `@Loader()` decorator to pull the Factory instance from Nest's DI container */
  moduleRef: ModuleRef
  /** Dataloaders already constructed by a given Factory for this request. */
  dataloaders: Map<Factory, DataLoader<unknown, unknown>>
}

/**
 * A weak map that tracks the requests and the dataloaders created for those requests
 * @private
 */
const inventory = new WeakMap<RequestKey, InventoryItem>()

/**
 * Given Nestjs execution context, obtain something that is scoped to the lifetime of the current request and does not
 * change (same instance).
 * @private
 */
function ctxkey(context: ExecutionContext) {
  const type = context.getType<GqlContextType>()

  switch (type) {
    case 'graphql': return GqlExecutionContext.create(context).getContext<{ req: RequestKey }>().req
    case 'http': return context.switchToHttp().getRequest<RequestKey>()
    // Support for other request types can be added later, we just did not need them yet.
    default: throw new Error(`Unknown or unsupported context type: ${type}`)
  }
}

/**
 * Interceptor that keeps a weak reference to all requests in order for the `@Loader()` param decorator to manage
 * `DataLoader` instances.
 *
 * The purpose of this interceptor is two-fold:
 * - all dataloaders must be request-scoped, so we need to grab something that is scoped to the lifetime of the current
 *   request. Usually, this is the `req` object itself.
 * - we want to lazily construct instances of Dataloaders when they are needed, and for that we need to save the
 *   `moduleRef` instance in order to have access to Nest's dependency injection container from the `@Loader` decorator.
 */
@Injectable()
class DataloaderInterceptor implements NestInterceptor<unknown, unknown> {
  /** The Nest.js module that imports this interceptor, usually the root module */
  readonly #moduleRef: ModuleRef

  constructor(moduleRef: ModuleRef) {
    this.#moduleRef = moduleRef
  }

  intercept(context: ExecutionContext, next: CallHandler<unknown>) {
    inventory.set(ctxkey(context), {
      moduleRef: this.#moduleRef,
      dataloaders: new Map(),
    })

    return next.handle()
  }
}

/**
 * Load a `Dataloader` factory into the decorated parameter
 * The factory class must be an implementation of the `DataloaderFactory` abstract class.
 */
const Loader = createParamDecorator((Factory: Factory, context: ExecutionContext) => {
  const item = inventory.get(ctxkey(context))

  if (!item) {
    throw new Error('DataLoaderInterceptor not registered in this Nest.js application')
  }

  if (!item.dataloaders.has(Factory)) {
    // We don't have this dataloader created yet for this request, let's instantiate it and save it
    const factory = item.moduleRef.get(Factory, { strict: false })
    item.dataloaders.set(Factory, factory.create(context))
  }

  return item.dataloaders.get(Factory)
})

export {
  DataloaderInterceptor,
  Loader,
}
