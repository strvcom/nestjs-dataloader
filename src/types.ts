import { type ExecutionContext } from '@nestjs/common'

/**
 * Given an execution context, extract a value out of it that is
 * - scoped to the lifetime of the current request
 * - does not change during request processing (same instance or can pass a strict equality check)
 * - is unique to the current request
 *
 * Dataloaders (and their caches) will be tied to the lifetime of this key.
 */
type LifetimeKeyFn = (context: ExecutionContext) => object

/** Dataloader module options */
interface DataloaderOptions {
  /**
   * Customise what the module uses to link dataloader lifetimes to the lifetime of a pending request.
   *
   * ⚠️ If you define a custom function here then you can no longer use the provided `@Loader` decorator. Instead, you
   * must define your own decorator using `createLoaderDecorator` function and provide it with this same `lifetime`
   * implementation.
   */
  lifetime?: LifetimeKeyFn
}

export {
  LifetimeKeyFn,
  DataloaderOptions,
}
