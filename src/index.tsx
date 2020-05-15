import React from 'react'

import { FieldMetaInfo, FormContext, FormProps, ProviderState } from './types'

export class UnreachableError extends Error {
  /* istanbul ignore next */ constructor(val: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
    console.error(val)
  }
}

interface Register<FieldName> {
  type: 'register'
  field: FieldName
  error: string | null
}

interface Unregister<FieldName> {
  type: 'unregister'
  field: FieldName
}

type Action<Values> = Register<keyof Values> | Unregister<keyof Values>

export default <Values extends object>(
  fieldMetaInfo: { [key in keyof Values]: FieldMetaInfo<Values[key], Values> },
) => {
  const ContextFactory = React.createContext<FormContext<Values> | null>(null)

  const Provider = ContextFactory.Provider

  const initialProviderState: ProviderState<Values> = { touched: {}, errors: {}, visible: {}, cachedValues: {} }

  const reducer = (state: ProviderState<Values>, action: Action<Values>): ProviderState<Values> => {
    switch (action.type) {
      case 'register':
        return { ...state, visible: { ...state.visible, [action.field]: true } }
      case 'unregister': {
        const { ...visible } = state.visible
        const { ...errors } = state.errors
        delete visible[action.field]
        delete errors[action.field]
        return { ...state, visible, errors }
      }
      default:
        throw new UnreachableError(action, 'Not all actions checked')
    }
  }

  const FormContextProvider: React.FC<FormProps<Values>> = ({ children, values, setValue }) => {
    const [state, dispatch] = React.useReducer(reducer, initialProviderState)

    const register = React.useCallback((field: keyof Values) => {
      const validate = fieldMetaInfo[field].validate
      const error = validate ? validate(values[field], values) : null

      dispatch({ type: 'register', field, error: typeof error === 'string' ? error : null })
    }, [])

    const context = {
      ...state,
      values,
      setValue,
      register,
      unregister: (field: keyof Values) => {
        dispatch({ type: 'unregister', field })
        return
      },
    }

    return <Provider value={context}>{children}</Provider>
  }

  const useField = <FieldName extends keyof Values>(
    name: FieldName,
  ): { value: Values[FieldName]; error?: string; setValue: (value: Values[FieldName]) => void } => {
    const context = React.useContext(ContextFactory)

    if (!context) throw new Error("Couldn't find website context provider")

    React.useEffect(() => {
      context.register(name)

      return () => {
        context.unregister(name)
      }
    }, [])

    const setValue = (value: Values[FieldName]) => {
      context.setValue(name, value)
    }

    return {
      value: context.values[name],
      error: context.errors[name],
      setValue,
    }
  }

  return { FormContextProvider, useField }
}
