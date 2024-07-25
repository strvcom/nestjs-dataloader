import { describe } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { Injectable } from '@nestjs/common'
import { DataloaderFactory, DataloaderModule } from '@strv/nestjs-dataloader'

describe('DataloaderModule', it => {
  it('exists', t => {
    t.expect(DataloaderModule).toBeDefined()
  })

  it('.forRoot()', async t => {
    const module = Test.createTestingModule({ imports: [DataloaderModule.forRoot()] })
    const app = await module.compile()
    t.onTestFinished(async () => await app.close())

    t.expect(app).toBeInstanceOf(TestingModule)
  })

  it('.forRootAsync()', async t => {
    const module = Test.createTestingModule({
      imports: [DataloaderModule.forRootAsync({
        useFactory: () => ({}),
      })],
    })
    const app = await module.compile()
    t.onTestFinished(async () => await app.close())

    t.expect(app).toBeInstanceOf(TestingModule)
  })

  it('.forFeatre()', async t => {
    @Injectable()
    class SampleLoaderFactory extends DataloaderFactory<unknown, unknown> {
      load = async (keys: unknown[]) => await Promise.resolve(keys)
      id = (key: unknown) => key
    }

    const provider = DataloaderModule.forFeature([SampleLoaderFactory])
    const module = Test.createTestingModule({ imports: [
      DataloaderModule.forRoot(),
      provider,
    ] })
    const app = await module.compile()
    t.onTestFinished(async () => await app.close())

    t.expect(app).toBeInstanceOf(TestingModule)

    t.expect(provider).toBeDefined()
    t.expect(provider.module).toBe(DataloaderModule)
    t.expect(provider.providers).toEqual([SampleLoaderFactory])
    t.expect(provider.exports).toEqual([SampleLoaderFactory])
  })
})
