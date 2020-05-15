import React from 'react'

import { UnreachableError } from './common'
import { FieldMetaInfo, FormContext, FormProps, ProviderState, UseFieldProps } from './types'

interface Register<FieldName> {
  type: 'register'
  field: FieldName
}

interface Unregister<FieldName> {
  type: 'unregister'
  field: FieldName
}

interface SetError<FieldName> {
  type: 'set_error'
  field: FieldName
  error: string
}

interface SetErrors<Values> {
  type: 'set_errors'
  errors: { [key in keyof Values]?: string }
}

interface TouchField<FieldName> {
  type: 'touch_field'
  field: FieldName
}

interface SetCachedValue<Values, FieldName extends keyof Values> {
  type: 'set_cached_value'
  field: FieldName
  value: Values[FieldName]
}

interface UnsetSachedValue<FieldName> {
  type: 'unset_cached_value'
  field: FieldName
}

type Action<Values> =
  | Register<keyof Values>
  | Unregister<keyof Values>
  | SetError<keyof Values>
  | SetErrors<Values>
  | TouchField<keyof Values>
  | SetCachedValue<Values, keyof Values>
  | UnsetSachedValue<keyof Values>

export default <Values extends object>(
  fieldMetaInfo: { [key in keyof Values]: FieldMetaInfo<Values[key], Values> },
) => {
  const ContextFactory = React.createContext<FormContext<Values> | null>(null)

  const Provider = ContextFactory.Provider

  const initialProviderState: ProviderState<Values> = { touched: {}, errors: {}, visible: {}, cachedValues: {} }

  const reducer = (state: ProviderState<Values>, action: Action<Values>): ProviderState<Values> => {
    switch (action.type) {
      case 'register': {
        return { ...state, visible: { ...state.visible, [action.field]: true } }
      }
      case 'unregister': {
        const visible = { ...state.visible }
        const errors = { ...state.errors }
        delete visible[action.field]
        delete errors[action.field]
        return { ...state, visible, errors }
      }
      case 'set_error':
        return { ...state, errors: { ...state.errors, [action.field]: action.error } }
      case 'set_errors':
        return { ...state, errors: action.errors }
      case 'touch_field':
        return { ...state, touched: { ...state.touched, [action.field]: true } }
      case 'set_cached_value':
        return { ...state, cachedValues: { ...state.cachedValues, [action.field]: action.value } }
      case 'unset_cached_value': {
        const cachedValues = { ...state.cachedValues }
        delete cachedValues[action.field]
        return { ...state, cachedValues }
      }
      default:
        throw new UnreachableError(action, 'Not all actions checked')
    }
  }

  const reducerWithLog = (state: ProviderState<Values>, action: Action<Values>): ProviderState<Values> => {
    const newState = reducer(state, action)

    console.groupCollapsed(`action ${action.type}`)
    console.log('prev state', state)
    console.log('action', action)
    console.log('next state', newState)
    console.groupEnd()

    return newState
  }

  const getError = <FieldName extends keyof Values>(
    field: FieldName,
    values: Values,
    cachedValues: { [key in keyof Values]?: Values[key] },
  ) => {
    const validate = fieldMetaInfo[field].validate
    const error = validate ? validate(cachedValues[field] ?? values[field], { ...values, ...cachedValues }) : null

    console.log('calucate error for field', field, values, cachedValues, error)
    return error
  }

  const FormContextProvider: React.FC<FormProps<Values>> = ({ children, values, setValue }) => {
    const [state, dispatch] = React.useReducer(reducerWithLog, initialProviderState)

    const runValidations = React.useCallback(
      (
        values: Values,
        visible: { [key in keyof Values]?: true },
        cachedValues: { [key in keyof Values]?: Values[key] },
      ) => {
        const errors = Object.keys(visible)
          .map((field) => field as keyof Values)
          .reduce((errors: { [key in keyof Values]?: string }, field) => {
            const error = getError(field, values, cachedValues)

            return typeof error === 'string' ? { ...errors, [field]: error } : errors
          }, {})

        dispatch({ type: 'set_errors', errors })
      },
      [values, state.visible, state.cachedValues],
    )

    const register = React.useCallback(
      (field: keyof Values) => {
        console.log('register field', field)
        dispatch({ type: 'register', field })
      },
      [values],
    )

    const unregister = (field: keyof Values) => {
      dispatch({ type: 'unregister', field })
      return
    }

    const setFieldValue = React.useCallback(
      <FieldName extends keyof Values>(field: FieldName, value: Values[FieldName]): void => {
        setValue(field, value)

        if (!state.touched[field]) {
          dispatch({ type: 'touch_field', field })
        }

        if (state.cachedValues[field]) {
          dispatch({ type: 'unset_cached_value', field })
        }
      },
      [values, state.visible, state.cachedValues, state.touched],
    )

    const setCachedFieldValue = React.useCallback(
      <FieldName extends keyof Values>(field: FieldName, value: Values[FieldName]): void => {
        dispatch({ type: 'set_cached_value', field, value })
        runValidations(values, state.visible, { ...state.cachedValues, [field]: value })
      },
      [values, state.visible, state.cachedValues],
    )

    const commitFieldValue = <FieldName extends keyof Values>(field: FieldName): void => {
      if (field in state.cachedValues) {
        const value = state.cachedValues[field] as Values[FieldName]
        setFieldValue(field, value)
        dispatch({ type: 'unset_cached_value', field })
      }

      dispatch({ type: 'touch_field', field })
    }

    const context = {
      ...state,
      values,
      register,
      unregister,
      setFieldValue,
      setCachedFieldValue,
      commitFieldValue,
    }

    React.useEffect(() => {
      console.log('run validations on changed values', values, state.visible, state.cachedValues)
      runValidations(values, state.visible, state.cachedValues)
    }, [values, state.visible, state.cachedValues])

    return <Provider value={context}>{children}</Provider>
  }

  const useField = <FieldName extends keyof Values>(name: FieldName): UseFieldProps<Values, FieldName> => {
    const context = React.useContext(ContextFactory)

    if (!context) throw new Error("Couldn't find website context provider")

    React.useEffect(() => {
      context.register(name)

      return () => {
        context.unregister(name)
      }
    }, [])

    const setValue = (value: Values[FieldName]) => {
      context.setFieldValue(name, value)
    }

    const setCachedValue = (value: Values[FieldName]) => {
      context.setCachedFieldValue(name, value)
    }

    const commitValue = () => {
      context.commitFieldValue(name)
    }

    return {
      value: context.cachedValues[name] ?? context.values[name],
      error: context.errors[name],
      isTouched: context.touched[name] === true,
      setValue,
      setCachedValue,
      commitValue,
    }
  }

  const useFormContext = () => {
    const context = React.useContext(ContextFactory)

    if (!context) throw new Error("Couldn't find website context provider")

    return context
  }

  return { FormContextProvider, useField, useFormContext }
}
