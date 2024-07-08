import { describe } from 'vitest'
import { type ExecutionContext } from '@nestjs/common'
import DataLoader from 'dataloader'
import { DataloaderFactory } from '@strv/nestjs-dataloader'

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
  it('returns a DataLoader', t => {
    const factory = new TestFactory()
    const loader = factory.create({} as ExecutionContext)

    t.expect(loader).toBeInstanceOf(DataLoader)
  })
})
