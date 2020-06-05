import React from 'react'

import { useUpdateEffect } from './common'
import { useFormState } from './state'
import { FieldMetaInfo, FieldProps, FormContext, FormContextProps, isRenderFn } from './types'

export default <Values, ExtraValues, CalculatedValues>(
  fieldMetaInfo: { [key in keyof Values]: FieldMetaInfo<Values[key], Values, ExtraValues, CalculatedValues> },
): {
  FormContextProvider: React.FC<FormContextProps<Values, ExtraValues, CalculatedValues>>
  useField: <FieldName extends keyof Values>(name: FieldName) => FieldProps<Values[FieldName]>
  useFormContext: () => FormContext<Values, ExtraValues, CalculatedValues>
} => {
  const ContextFactory = React.createContext<FormContext<Values, ExtraValues, CalculatedValues> | null>(null)

  const Provider = ContextFactory.Provider

  const getError = (
    field: keyof Values,
    values: Values,
    cachedValues: { [key in keyof Values]?: Values[key] },
    calculatedValues?: CalculatedValues,
    extraValues?: ExtraValues,
  ) => {
    const validate = fieldMetaInfo[field].validate
    const error = validate
      ? validate(cachedValues[field] ?? values[field], { ...values, ...cachedValues, ...calculatedValues }, extraValues)
      : null

    return error
  }

  const FormContextProvider: React.FC<FormContextProps<Values, ExtraValues, CalculatedValues>> = ({
    children,
    values,
    setValue,
    extraValues,
    calculate,
    submitForm,
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
          const error = getError(field, values, state.cachedValues, state.calculatedValues, extraValues)
          return typeof error === 'string' ? { ...errors, [field]: error } : errors
        }, {})

      dispatch({ type: 'set_errors', errors })
    }, [values, state.visible, state.cachedValues, extraValues, state.calculatedValues])

    const setFieldValue = React.useCallback(
      <FieldName extends keyof Values>(field: FieldName, value: Values[FieldName], runEffects = true): void => {
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
      },
      [state.touched, state.cachedValues],
    )

    const setCachedFieldValue = <FieldName extends keyof Values>(field: FieldName, value: Values[FieldName]): void => {
      dispatch({ type: 'set_cached_value', field, value })
    }

    const commitFieldValue = React.useCallback(
      <FieldName extends keyof Values>(field: FieldName): void => {
        if (field in state.cachedValues) {
          const value = state.cachedValues[field] as Values[FieldName]
          setFieldValue(field, value)
        } else {
          dispatch({ type: 'touch_field', field })
        }
      },
      [state.touched, state.cachedValues],
    )

    const processSubmit = React.useCallback(
      (event: React.FormEvent) => {
        event.preventDefault()

        if (!submitForm) return

        Object.keys(state.cachedValues)
          .map((field) => field as keyof Values)
          .forEach(commitFieldValue)

        submitForm({ ...values, ...state.cachedValues })
      },
      [values, state.cachedValues],
    )

    // --- EFFECTS --- //

    useUpdateEffect(runValidations, [values, state.cachedValues, extraValues])

    // useUpdateEffect(() => {
    //   const timer = setTimeout(runValidations, 100)

    //   return () => {
    //     clearTimeout(timer)
    //   }
    // }, [values, state.cachedValues, extraValues])

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
      <form onSubmit={processSubmit}>
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
          {isRenderFn(children)
            ? children({
                values,
                calculatedValues: state.calculatedValues,
                extraValues,
                errors: state.errors,
                processSubmit,
              })
            : children}
        </Provider>
      </form>
    )
  }

  const useField = <FieldName extends keyof Values>(name: FieldName): FieldProps<Values[FieldName]> => {
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
