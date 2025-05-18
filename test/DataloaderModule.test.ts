import { describe } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { DataloaderModule } from '@strv/nestjs-dataloader'

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
})
