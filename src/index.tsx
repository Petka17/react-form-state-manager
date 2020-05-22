import React from 'react'

import { useUpdateEffect } from './common'
import { useFormState } from './state'
import { FieldMetaInfo, FormContext, FormContextProps, UseFieldProps } from './types'

export default <Values, ExtraValues, CalculatedValues>(
  fieldMetaInfo: { [key in keyof Values]: FieldMetaInfo<Values[key], Values, ExtraValues, CalculatedValues> },
) => {
  const ContextFactory = React.createContext<FormContext<Values, ExtraValues, CalculatedValues> | null>(null)

  const Provider = ContextFactory.Provider

  const getError = (
    field: keyof Values,
    values: Values,
    cachedValues: { [key in keyof Values]?: Values[key] },
    extraValues: ExtraValues,
    calculatedValues?: CalculatedValues,
  ) => {
    const validate = fieldMetaInfo[field].validate
    const error = validate
      ? validate(cachedValues[field] ?? values[field], { ...values, ...cachedValues, ...calculatedValues }, extraValues)
      : null

    console.log('calucate error for field', field, values, cachedValues, error)

    return error
  }

  const FormContextProvider: React.FC<FormContextProps<Values, ExtraValues, CalculatedValues>> = ({
    children,
    values,
    setValue,
    extraValues,
    calculate,
  }) => {
    // --- LOCAL STATE --- //

    const [state, dispatch] = useFormState(values, extraValues, calculate)

    // --- CALLBACKS --- //

    const register = (field: keyof Values) => {
      dispatch({ type: 'register', field })
    }

    const unregister = (field: keyof Values) => {
      dispatch({ type: 'unregister', field })
    }

    const runValidations = React.useCallback(() => {
      const errors = Object.keys(state.visible)
        .map((field) => field as keyof Values)
        .reduce((errors: { [key in keyof Values]?: string }, field) => {
          const error = getError(field, values, state.cachedValues, extraValues, state.calculatedValues)
          return typeof error === 'string' ? { ...errors, [field]: error } : errors
        }, {})

      dispatch({ type: 'set_errors', errors })
    }, [values, state.visible, state.cachedValues, extraValues, state.calculatedValues])

    const setFieldValue = <FieldName extends keyof Values>(
      field: FieldName,
      value: Values[FieldName],
      runEffects = true,
    ): void => {
      setValue(field, value)

      if (!state.touched[field]) dispatch({ type: 'touch_field', field })

      if (state.cachedValues[field]) dispatch({ type: 'unset_cached_value', field })

      if (!runEffects) return

      const effects = fieldMetaInfo[field].effects

      if (effects) {
        Object.keys(effects)
          .map((field) => field as keyof Values)
          .forEach((effectedField) => {
            const effect = effects[effectedField]
            if (effect) {
              const effectedValue = effect(value)
              setFieldValue(effectedField, effectedValue, false)
            }
          })
      }
    }

    const setCachedFieldValue = <FieldName extends keyof Values>(field: FieldName, value: Values[FieldName]): void => {
      dispatch({ type: 'set_cached_value', field, value })
    }

    const commitFieldValue = <FieldName extends keyof Values>(field: FieldName): void => {
      if (field in state.cachedValues) {
        const value = state.cachedValues[field] as Values[FieldName]
        setFieldValue(field, value)
        dispatch({ type: 'unset_cached_value', field })
      }

      dispatch({ type: 'touch_field', field })
    }

    // --- EFFECTS --- //

    useUpdateEffect(runValidations, [values, state.cachedValues, extraValues])

    React.useEffect(() => {
      if (calculate) {
        dispatch({ type: 'update_calculated_values', values: calculate(values, extraValues) })
      }
    }, [values, extraValues])

    React.useEffect(() => {
      const timer = setTimeout(runValidations, 100)

      return () => {
        clearTimeout(timer)
      }
    }, [state.visible])

    // --- RENDERING --- //

    return (
      <Provider
        value={{
          ...state,
          values,
          extraValues,
          calculatedValues: state.calculatedValues,
          register,
          unregister,
          setFieldValue,
          setCachedFieldValue,
          commitFieldValue,
        }}
      >
        {children}
      </Provider>
    )
  }

  const useField = <FieldName extends keyof Values>(name: FieldName): UseFieldProps<Values, FieldName> => {
    const context = React.useContext(ContextFactory)

    if (!context) throw new Error("Couldn't find context provider")

    const setValue = (value: Values[FieldName]) => {
      context.setFieldValue(name, value)
    }

    const setCachedValue = (value: Values[FieldName]) => {
      context.setCachedFieldValue(name, value)
    }

    const commitValue = () => {
      context.commitFieldValue(name)
    }

    React.useEffect(() => {
      context.register(name)

      return () => {
        context.unregister(name)
      }
    }, [])

    return {
      value: context.cachedValues[name] ?? context.values[name],
      error: context.errors[name],
      isTouched: context.touched[name] === true,
      setValue,
      setCachedValue,
      commitValue,
    }
  }

  const useFormContext = (): FormContext<Values, ExtraValues, CalculatedValues> => {
    const context = React.useContext(ContextFactory)

    if (!context) throw new Error("Couldn't find website provider")

    return context
  }

  return { FormContextProvider, useField, useFormContext }
}
