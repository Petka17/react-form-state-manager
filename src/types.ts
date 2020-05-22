import React from 'react'

export interface ProviderState<Values extends object, CalculatedValues> {
  cachedValues: { [key in keyof Values]?: Values[key] }
  errors: { [key in keyof Values]?: string }
  touched: { [key in keyof Values]?: true }
  visible: { [key in keyof Values]?: true }
  calculatedValues?: CalculatedValues
}

export interface FormContext<
  Values extends object,
  ExtraValues extends object | undefined,
  CalculatedValues extends object
> extends ProviderState<Values, CalculatedValues> {
  values: Values
  extraValues: ExtraValues
  calculatedValues?: CalculatedValues
  register: (name: keyof Values) => void
  unregister: (name: keyof Values) => void
  setFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  setCachedFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  commitFieldValue: <FieldName extends keyof Values>(name: FieldName) => void
}

export type FieldMetaInfo<FieldValue, Values, ExtraValues, CalculatedValues> = {
  validate?: (value: FieldValue, values?: Values & CalculatedValues, extraValues?: ExtraValues) => boolean | string
  effects?: {
    [key in keyof Values]?: (value: FieldValue) => Values[key]
  }
}

export interface FormProps<Values, ExtraValues, CalculatedValues> {
  children: React.ReactNode
  values: Values
  setValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  extraValues: ExtraValues
  calculate?: (values: Values, extraValues: ExtraValues) => CalculatedValues
}

export interface UseFieldProps<Values, FieldName extends keyof Values> {
  value: Values[FieldName]
  error?: string
  setValue: (value: Values[FieldName]) => void
  setCachedValue: (value: Values[FieldName]) => void
  commitValue: () => void
  isTouched: boolean
}
