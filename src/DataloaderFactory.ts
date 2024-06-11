import { type ExecutionContext } from '@nestjs/common'
import DataLoader from 'dataloader'

/**
 * This class provides the building blocks to implement a Nest.js-compatible GraphQL DataLoader factory
 *
 * It takes care of several challenges:
 *
 * - ability to use Nest.js dependency injection together with `DataLoader`
 * - ordering the results according to the order of the IDs as requested by `DataLoader`
 */
abstract class DataloaderFactory<ID, Value, CacheID = ID> {
  /**
   * Create a new instance of this DataLoader for the current request
   * @private You should not call this method directly; instead, it should be called by the interceptor
   */
  create(context: ExecutionContext) {
    return new DataLoader<ID, Value | null, CacheID>(async ids =>
      await this.#load(ids, context))
  }

  /**
   * Aggregate results by a key in the items
   *
   * This is especially useful when resolving one-to-many relationships. Dataloader requires that you return one item
   * per given ID, so if you need to return multiple items per ID you need to aggregate those items into a single
   * object, with the actual values stored in an array in that object.
   *
   * To aggregate, call this function in your `.load()` implementation and return the results.
   */
  aggregateBy<TItem>(items: TItem[], identify: (value: TItem) => ID): Array<Aggregated<ID, TItem>> {
    const map = new Map<ID, TItem[]>()

    for (const item of items) {
      const id = identify(item)
      const aggregated = map.get(id) ?? []
      map.set(id, aggregated)
      aggregated.push(item)
    }

    return [...map.entries()].map(([id, values]) => ({ id, values }))
  }

  /**
   * Load the items, order them by the ID order and return them back
   * @private
   */
  async #load(ids: readonly ID[], context: ExecutionContext) {
    const results = await this.load([...ids], context)
    const locations = results.map(item => this.id(item))

    return ids.map(id => {
      // Note: if no results for a given id are found, position will be -1
      const position = locations.indexOf(id)
      return results[position] ?? this.onNotFound?.(id) ?? null
    })
  }

  /**
   * When an item of the specified ID is not found, use this method to specify if the resulting value should be `null`
   * or a specific instance of Error.
   */
  abstract onNotFound?(id: ID): null | Error

  /**
   * Load the items with the specified IDs
   *
   * Your implementation of this Factory must provide this method to load the items with the specified IDs.
   * You should not call this method directly; instead, it will be called by the DataloaderFactory instance.
   */
  abstract load(ids: ID[], context: ExecutionContext): Promise<Value[]>
  /**
   * Get the ID value of the entity
   *
   * Use this method in your Factory implementation to get the ID value of the entity. This is necessary because the
   * underlying DataloaderFactory instance does not know which field corresponds to the requested ID value.
   *
   * You should not call this method directly; instead, it will be called by the DataloaderFactory instance.
   */
  abstract id(entity: Value): ID
}

/** Type extractor to get to the underlying Dataloader type that the factory creates */
type LoaderFrom<TFactory extends DataloaderFactory<unknown, unknown>> = ReturnType<TFactory['create']>

/**
 * Aggregated represents a result that aggregates values based on a specific ID property of values. Very useful to work
 * with one-to-many relationships in Dataloaders because Dataloader requires that you return exactly one item per given
 * ID.
 */
interface Aggregated<ID, Value> {
  id: ID
  values: Value[]
}

export {
  DataloaderFactory,
  LoaderFrom,
  Aggregated,
}
