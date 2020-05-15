import React, { DependencyList } from 'react'

export class UnreachableError extends Error {
  /* istanbul ignore next */ constructor(val: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
    console.error(val)
  }
}

export const getObjectKeys = <T extends string, K>(obj: { [key in T]?: K }): T[] =>
  Object.keys(obj).map((key) => key as T)

export const useUpdateEffect = (fn: Function, deps: DependencyList) => {
  const didMountRef = React.useRef(false)

  React.useEffect(() => {
    if (didMountRef.current) return fn()
    else didMountRef.current = true
  }, deps)
}

