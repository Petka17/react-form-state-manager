export class UnreachableError extends Error {
  /* istanbul ignore next */ constructor(val: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
    console.error(val)
  }
}

export const getObjectKeys = <T extends string, K>(obj: { [key in T]?: K }): T[] =>
  Object.keys(obj).map((key) => key as T)

