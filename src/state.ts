import React from 'react'

import { UnreachableError } from './common'
import { FormLocalState } from './types'

interface Register<FieldName> {
  type: 'register'
  field: FieldName
}

interface Unregister<FieldName> {
  type: 'unregister'
  field: FieldName
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

interface UpdateCalculatedValues<CalculatedValues> {
  type: 'update_calculated_values'
  values: CalculatedValues
}

type Action<Values, CalculatedValues> =
  | Register<keyof Values>
  | Unregister<keyof Values>
  | SetErrors<Values>
  | TouchField<keyof Values>
  | SetCachedValue<Values, keyof Values>
  | UnsetSachedValue<keyof Values>
  | UpdateCalculatedValues<CalculatedValues>

export const useFormState = <Values, ExtraValues, CalculatedValues>(
  values: Values,
  extraValues: ExtraValues,
  calculate?: (values: Values, extraValues: ExtraValues) => CalculatedValues,
) => {
  const initialProviderState: FormLocalState<Values, CalculatedValues> = {
    cachedValues: {},
    errors: {},
    touched: {},
    visible: {},
  }

  const reducer = (
    state: FormLocalState<Values, CalculatedValues>,
    action: Action<Values, CalculatedValues>,
  ): FormLocalState<Values, CalculatedValues> => {
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
      case 'update_calculated_values':
        return { ...state, calculatedValues: action.values }
      default:
        throw new UnreachableError(action, 'Not all actions checked')
    }
  }

  const reducerWithLog = (
    state: FormLocalState<Values, CalculatedValues>,
    action: Action<Values, CalculatedValues>,
  ): FormLocalState<Values, CalculatedValues> => {
    const newState = reducer(state, action)

    console.groupCollapsed(`action ${action.type}`)
    console.log('prev state', state)
    console.log('action', action)
    console.log('next state', newState)
    console.groupEnd()

    return newState
  }

  return React.useReducer(reducerWithLog, {
    ...initialProviderState,
    calculatedValues: calculate ? calculate(values, extraValues) : undefined,
  })
}
