import request from 'supertest'
import Dataloader from 'dataloader'
import { describe } from 'vitest'
import { Controller, Get, Injectable, Scope } from '@nestjs/common'
import { type NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { DataloaderModule, DataloaderFactory, type LoaderFrom, Loader } from '@strv/nestjs-dataloader'

describe('@Loader()', it => {
  it('injects the dataloader instance into the request handler', async t => {
    @Injectable()
    class SampleLoaderFactory extends DataloaderFactory<string, unknown> {
      load = async (keys: string[]) => await Promise.resolve(keys)
      id = (key: string) => key
    }

    @Controller()
    class TestController {
      @Get('/')
      handle(@Loader(SampleLoaderFactory) loader: LoaderFrom<SampleLoaderFactory>) {
        t.expect(loader).toBeInstanceOf(Dataloader)
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        DataloaderModule.forRoot(),
      ],
      providers: [
        SampleLoaderFactory,
      ],
      controllers: [TestController],
    }).compile()
    const app = await module.createNestApplication<NestExpressApplication>().init()
    t.onTestFinished(async () => await app.close())

    await request(app.getHttpServer()).get('/')
  })

  it('can inject other providers into the factory', async t => {
    @Injectable()
    class TestService {
      test() {
        return { text: 'Hello world' }
      }
    }

    @Injectable()
    class SampleLoaderFactory extends DataloaderFactory<unknown, unknown> {
      readonly #service: TestService
      constructor(service: TestService) {
        super()
        this.#service = service
      }

      load = async () => await Promise.resolve([this.#service.test()])
      id = () => 0
    }

    @Controller()
    class TestController {
      @Get('/')
      async handle(@Loader(SampleLoaderFactory) loader: LoaderFrom<SampleLoaderFactory>) {
        return await loader.load(0)
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        DataloaderModule.forRoot(),
      ],
      providers: [
        TestService,
        SampleLoaderFactory,
      ],
      controllers: [TestController],
    }).compile()
    const app = await module.createNestApplication<NestExpressApplication>().init()
    t.onTestFinished(async () => await app.close())

    const response = await request(app.getHttpServer()).get('/')

    t.expect(response.status).toBe(200)
    t.expect(response.body).toEqual({ text: 'Hello world' })
  })

  it('can inject request-scoped providers into the factory', async t => {
    @Injectable({ scope: Scope.REQUEST })
    class TestService {
      test() {
        return { text: 'Hello world' }
      }
    }

    @Injectable()
    class AnotherSampleLoaderFactory extends DataloaderFactory<unknown, unknown> {
      readonly #service: TestService
      constructor(service: TestService) {
        super()
        this.#service = service
      }

      load = async () => await Promise.resolve([this.#service.test()])
      id = () => 0
    }

    @Controller()
    class TestController {
      @Get('/')
      async handle(@Loader(AnotherSampleLoaderFactory) loader: LoaderFrom<AnotherSampleLoaderFactory>) {
        return await loader.load(0)
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        DataloaderModule.forRoot(),
      ],
      providers: [
        TestService,
        AnotherSampleLoaderFactory,
      ],
      controllers: [TestController],
    }).compile()

    const app = await module.createNestApplication<NestExpressApplication>().init()
    t.onTestFinished(async () => await app.close())

    const response = await request(app.getHttpServer()).get('/')

    t.expect(response.status).toBe(200)
    t.expect(response.body).toEqual({ text: 'Hello world' })
  })
  it('reuses a single dataloader across concurrent resolutions within one request', async t => {
    let created = 0
    const seen: Array<LoaderFrom<SampleLoaderFactory>> = []

    @Injectable()
    class SampleLoaderFactory extends DataloaderFactory<string, string> {
      load = async (keys: string[]) => await Promise.resolve(keys)
      id = (key: string) => key
      override create(context: Parameters<DataloaderFactory<string, string>['create']>[0]) {
        created += 1
        return super.create(context)
      }
    }

    @Controller()
    class TestController {
      @Get('/')
      handle(
        @Loader(SampleLoaderFactory) first: LoaderFrom<SampleLoaderFactory>,
        @Loader(SampleLoaderFactory) second: LoaderFrom<SampleLoaderFactory>,
      ) {
        seen.push(first, second)
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        DataloaderModule.forRoot(),
      ],
      providers: [
        SampleLoaderFactory,
      ],
      controllers: [TestController],
    }).compile()
    const app = await module.createNestApplication<NestExpressApplication>().init()
    t.onTestFinished(async () => await app.close())

    await request(app.getHttpServer()).get('/')

    // The @Loader() params resolve concurrently; both must receive the same
    // per-request instance, constructed exactly once.
    t.expect(created).toBe(1)
    t.expect(seen[0]).toBe(seen[1])
  })
})
