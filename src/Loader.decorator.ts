import { createParamDecorator, Scope, type ExecutionContext } from '@nestjs/common'
import { ContextIdFactory } from '@nestjs/core'
import { lifetimeKey, store } from './internal.js'
import { type Factory, type LifetimeKeyFn } from './types.js'
import { DataloaderException } from './DataloaderException.js'

/**
 * Create a custom `Loader()` decorator that uses your own implementation of the `LifetimeKeyFn` function. This is
 * useful if the default implementation does not work for your use case (ie. gRPC requests, Websockets, custom GraphQL
 * drivers etc.)
 */
function createLoaderDecorator(lifetime: LifetimeKeyFn) {
  return createParamDecorator(async (Factory: Factory, context: ExecutionContext) => {
    const item = store.get(lifetime(context))

    if (!item) {
      throw new DataloaderException('DataloaderModule not available in this Nest.js application')
    }

    if (!item.dataloaders.has(Factory)) {
      const { scope } = item.moduleRef.introspect(Factory)

      const factory = await (async () => {
        switch (scope) {
          case Scope.DEFAULT: return item.moduleRef.get(Factory, { strict: false })
          case Scope.TRANSIENT:
          case Scope.REQUEST:
          default: return await item.moduleRef
            .resolve(Factory, ContextIdFactory.getByRequest(lifetime(context)), { strict: false })
        }
      })()

      item.dataloaders.set(Factory, factory.create(context))
    }

    return item.dataloaders.get(Factory)
  })
}

/**
 * Inject a `Dataloader` factory into the decorated parameter
 * The factory class must be an implementation of the `DataloaderFactory` abstract class.
 */
const Loader = createLoaderDecorator(lifetimeKey)

export {
  Loader,
  createLoaderDecorator,
}
