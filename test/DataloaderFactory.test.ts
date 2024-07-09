import { describe } from 'vitest'
import { type ExecutionContext } from '@nestjs/common'
import DataLoader from 'dataloader'
import { DataloaderFactory, type Aggregated } from '@strv/nestjs-dataloader'

class TestFactory extends DataloaderFactory<unknown, unknown> {
  load = async () => await Promise.resolve([])
  id = (key: unknown) => key
}

describe('DataloaderFactory', it => {
  it('is a class', t => {
    t.expect(typeof DataloaderFactory).toBe('function')
  })

  it('can be extended and constructed', t => {
    const factory = new TestFactory()
    t.expect(factory).toBeInstanceOf(TestFactory)
    t.expect(factory).toBeInstanceOf(DataloaderFactory)
  })
})


describe('.create()', it => {
  it('returns a DataLoader instance', t => {
    const factory = new TestFactory()
    const loader = factory.create({} as ExecutionContext)

    t.expect(loader).toBeInstanceOf(DataLoader)
  })

  it('connects the Dataloader.load() function to the Factory.load() function', async t => {
    const mapping: Record<string, string> = {
      a: 'A',
      b: 'B',
      c: 'C',
    }

    class Factory extends DataloaderFactory<string, { id: string, value: string | null }> {
      async load(ids: string[]) {
        t.expect(ids).toEqual(['a', 'b', 'c', 'd'])

        return await Promise.resolve(ids.map(id => ({ id, value: mapping[id] ?? null })))
      }

      id(item: { id: string }) {
        return item.id
      }
    }

    const loader = new Factory().create({} as ExecutionContext)
    const tasks = [
      loader.load('a'),
      loader.load('b'),
      loader.load('c'),
      loader.load('d'),
    ]
    const results = await Promise.all(tasks)

    t.expect(results).toEqual([
      { id: 'a', value: 'A' },
      { id: 'b', value: 'B' },
      { id: 'c', value: 'C' },
      { id: 'd', value: null },
    ])
  })
})

describe('.aggregateBy()', it => {
  it('groups items by a given key', t => {
    interface Item { itemId: number, value: string }
    type ItemInfo = Aggregated<Item['itemId'], Item>

    class Factory extends DataloaderFactory<number, ItemInfo> {
      load = async () => await Promise.resolve([])
      id = (item: ItemInfo) => item.id
    }
    const factory = new Factory()
    const items = [
      { itemId: 1, value: 'A' },
      { itemId: 2, value: 'B' },
      { itemId: 1, value: 'C' },
      { itemId: 3, value: 'D' },
      { itemId: 2, value: 'E' },
      { itemId: 1, value: 'F' },
    ]
    const aggregated = factory.aggregateBy(items, item => item.itemId)

    t.expect(aggregated).toEqual([
      { id: 1, values: [items[0], items[2], items[5]] },
      { id: 2, values: [items[1], items[4]] },
      { id: 3, values: [items[3]] },
    ])
  })
})
