<div align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <br />
  <h1><code>@strv/nestjs-dataloader</code></h1>

  [![Continuous Integration][badge-ci]][workflow-ci]

  > [Dataloader][dataloader-home] support for [Nest.js][nestjs-home] like it was always meant to be.<br />Built with ❤️ at [STRV](https://www.strv.com)
</div>

## Description

This Nest.js module provides tight integration with Dataloader and makes creating and using Dataloaders feel like it's part of the core Nest.js ecosystem. Original inspiration for this project came from [krislefeber/nestjs-dataloader](https://github.com/krislefeber/nestjs-dataloader) - thank you for your work! 🍻 We decided to do a full rewrite to support latest Nest.js version and make some improvements to authoring the dataloader factories and to add some extra functionality on top.

## Installation

- ⚠️ This package only provides ES Modules entrypoints. This means you can only import it from another ES Module, or you have to use Node.js v22.13 which brings support for loading ES modules from CommonJS using `require(esm)`.
- If your program uses TypeScript and you compile your codebase to CommonJS module syntax you will need to use at least TypeScript v5.8 which implements support for such setup: [TypeScript docs](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/#support-for-require()-of-ecmascript-modules-in---module-nodenext).
- This package is written in TypeScript which means your IDE will be able to provide you with type information as you work with this package. 💪
- Tested against Nest.js v10 and v11.
- Requires Node.js v22.13.

```sh
npm install @strv/nestjs-dataloader
```

## Usage

The core principle is that you work with Dataloaders by defining a Factory class that is responsible for creating those Dataloader instances. The Factory class is part of Nest's dependency injection which means it can use other injectable providers to produce results.

### Register the module

In your app, or root module, register the Dataloader module. You only need to do this once in your Nest.js application.

```ts
// app.module.ts
import { Module } from '@nestjs/common'
import { DataloaderModule } from '@strv/nestjs-dataloader'

@Module({
  imports: [
    // There is also `.forRootAsync()` to use a factory to provide options for the module.
    DataloaderModule.forRoot(),
  ],
})
class AppModule {}

export {
  AppModule,
}
```

### Define a factory

A Factory is responsible for creating new instances of Dataloader. Each factory creates only one type of Dataloader so for each relation you will need to define a Factory. You define a Factory by subclassing the provided `DataloaderFactory` and implemneting `load()` and `id()` methods on it, at minimum.

> Each Factory can be considered global in the Nest.js dependency graph, you do not need to import the module that provides the Factory in order to use it elsewhere in your application. You do need, however, to export the Factory from the hosting Nest.js module in order to use it in a different module.

```ts
// AuthorBooksLoader.factory.ts
import { Injectable, type ExecutionContext } from '@nestjs/common'
import { DataloaderFactory, type Aggregated, type LoaderFrom } from '@strv/nestjs-dataloader'
import { BooksService } from './books.service.js'

/** A fictional entity that we will try to resolve for a given author ID. */
interface Book {
  itemId: string
  authorId: string
  title: string
}

/** This is the ID type that the consumers of this Dataloader will use to request data */
type AuthorId = number
/**
 * This is the type that will be returned from the Dataloader.
 * `Aggregated` is a helper type that makes it easy to resolve one-to-many relations with a Dataloader.
 */
type AuthorBooksInfo = Aggregated<AuthorId, Book>
/**
 * This is the correctly typed Dataloader instance that this Factory will create.
 * Use this type in your resolvers.
 */
type AuthorBooksLoader = LoaderFrom<AuthorBooksLoaderFactory>

@Injectable()
class AuthorBooksLoaderFactory extends DataloaderFactory<AuthorId, AuthorBooksInfo> {
  readonly #books: BooksService

  /** Since the Factory class is part of Nest's DI you can inject other components here. */
  constructor(books: BooksService) {
    super()
    this.#books = books
  }

  /** Here you resolve the given IDs into the actual entities. */
  async load(ids: AuthorId[], context: ExecutionContext) {
    const results: Book[] = await this.#books.findBooksByAuthorIds(ids)
    // Now that we have our books for the given authors, let's use a helper method on the Factory to aggregate
    // the books by their author. This makes it very easy to work with one-to-many relations.
    // This kind of aggregation is necessary because Dataloader only allows you to return one item per given ID.
    // So we aggregate the books into objects where the `id` field is the requested author ID and the `values`
    // array contains all the books found for that author.
    //
    // When resolving a one-to-one relation (ie. book -> author) you can simply return the results here instead of
    // calling `.aggregateBy()`.
    return this.aggregateBy(results, book => book.authorId)
  }

  /**
   * This method is used to help the DataloaderFactory with correctly ordering the results. Dataloader expects
   * to receive the results in exactly the same order as the IDs you were given. In order to do this, the Factory
   * needs to know the ID value of each resolved entity. The Factory cannot do this without your help because
   * the ID value might be stored in a field called `itemId`, `authorId`, etc. and it's not always going
   * to be a nice `id` field.
   */
  id(entity: AuthorBooksInfo) {
    return entity.id
  }
}

export {
  AuthorBooksLoaderFactory,
  AuthorBooksLoader,
}
```

### Register the factory

Each Dataloader factory you create must be added to your Nest.js module as a provider. Optionally, if you need to use this factory also in other modules you must export the factory from the module as well.

```ts
// authors.module.ts
import { Module } from '@nestjs/common'
import { DataloaderModule } from '@strv/nestjs-dataloader'
import { BooksService } from './books.service.js'
import { AuthorBooksLoaderFactory } from './AuthorBooksLoader.factory.js'

@Module({
  providers: [
    BooksService,
    AuthorBooksLoaderFactory
  ],
  // If you need to use this dataloader in a different Nest.js module, export it
  exports: [
    AuthorBooksLoaderFactory,
  ],
})
class AuthorsModule {}
```

### Inject a Dataloader

Now that we have a Dataloader factory defined and available in the DI container, it's time to put it to some use! To obtain a Dataloader instance in a resolver, you can use the provided `@Loader()` parameter decorator in your GraphQL resolvers.

> 💡 It's possible to use the `@Loader()` parameter decorator also in REST controllers although the benefits of using Dataloaders in REST APIs are not that tangible as in GraphQL. However, if your app provides both GraphQL and REST interfaces this might be a good way to share some logic between the two.

A new Dataloader instance will be produced for each incoming request and Dataloader by default caches the results it returns for the duration of that request. This is important to remember when troubleshooting data inconsistencies in responses after an update has been made to a previously-fetched record.

```ts
// author.resolver.ts
import { Resolver, ResolveField } from '@nestjs/graphql'
import { Loader } from '@strv/nestjs-dataloader'
import { AuthorBooksLoaderFactory, type AuthorBooksLoader } from './AuthorBooksLoader.factory.js'
import { Author } from './author.entity.js'

@Resolver(Author)
class AuthorResolver {
  @ResolveField()
  async books(@Parent() author: Author, @Loader(AuthorBooksLoaderFactory) books: AuthorBooksLoader) {
    // result is of type `AuthorBooksInfo | null` that we defined in the Factory file.
    const result = await books.load(author.id)
    // Perform any post-processing or data conversion if needed.
    return result?.values ?? []
  }
}
```

## License

See [LICENSE](LICENSE) for more information.

[badge-ci]: https://github.com/strvcom/nestjs-dataloader/actions/workflows/ci.yaml/badge.svg
[workflow-ci]: https://github.com/strvcom/nestjs-dataloader/actions/workflows/ci.yaml
[nestjs-home]: https://nestjs.com
[dataloader-home]: https://github.com/graphql/dataloader
