import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { ctxkey, store, type Factory } from './internal.js'

/**
 * Load a `Dataloader` factory into the decorated parameter
 * The factory class must be an implementation of the `DataloaderFactory` abstract class.
 */
const Loader = createParamDecorator((Factory: Factory, context: ExecutionContext) => {
  const item = store.get(ctxkey(context))

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
  Loader,
}
