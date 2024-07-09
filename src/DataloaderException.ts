/** Exception thrown by the `@strv/nestjs-dataloader` module. */
class DataloaderException extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export {
  DataloaderException,
}
