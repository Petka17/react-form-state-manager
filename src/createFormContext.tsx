import React from 'react'

interface ProviderState<Values extends object> {
  cachedValues: { [key in keyof Values]?: Values[key] }
  errors: { [key in keyof Values]?: string }
  touched: { [key in keyof Values]?: true }
  visible: { [key in keyof Values]?: true }
}

interface FormContext<Values extends object> extends ProviderState<Values> {
  values: Values
  setValue: <Field extends keyof Values>(name: Field, value: Values[Field]) => void
  register: (name: keyof Values) => void
  unregister: (name: keyof Values) => void
}

type FieldMetaInfo<FieldValue, Values> = {
  validate?: (value: FieldValue, values: Values) => boolean | string
}

interface FormProps<Values> {
  children: React.ReactNode
  values: Values
  setValue: <Field extends keyof Values>(name: Field, value: Values[Field]) => void
}

interface Register<FieldName> {
  type: 'register'
  field: FieldName
}

interface Unregister<FieldName> {
  type: 'unregister'
  field: FieldName
}

export class UnreachableError extends Error {
  /* istanbul ignore next */ constructor(val: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
    console.error(val)
  }
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

    const context = {
      ...state,
      values,
      setValue,
      register: (field: keyof Values) => {
        dispatch({ type: 'register', field })
      },
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
