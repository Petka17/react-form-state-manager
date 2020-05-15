import React, { DependencyList } from 'react'

export const useUpdateEffect = (fn: Function, deps: DependencyList) => {
  const didMountRef = React.useRef(false)

  React.useEffect(() => {
    if (didMountRef.current) return fn()
    else didMountRef.current = true
  }, deps)
}
