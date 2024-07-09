import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { lifetimeKey, store, type Factory } from './internal.js'
import { type LifetimeKeyFn } from './types.js'
import { DataloaderException } from './DataloaderException.js'

/**
 * Create a custom `Loader()` decorator that uses your own implementation of the `LifetimeKeyFn` function. This is
 * useful if the default implementation does not work for your use case (ie. gRPC requests, Websockets, custom GraphQL
 * drivers etc.)
 */
function createLoaderDecorator(lifetime: LifetimeKeyFn) {
  return createParamDecorator((Factory: Factory, context: ExecutionContext) => {
    const item = store.get(lifetime(context))

    if (!item) {
      throw new DataloaderException('DataloaderModule not available in this Nest.js application')
    }

    if (!item.dataloaders.has(Factory)) {
    // We don't have this dataloader created yet for this request, let's instantiate it and save it
      const factory = item.moduleRef.get(Factory, { strict: false })
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
