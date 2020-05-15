import React from 'react'

export interface ProviderState<Values extends object> {
  cachedValues: { [key in keyof Values]?: Values[key] }
  errors: { [key in keyof Values]?: string }
  touched: { [key in keyof Values]?: true }
  visible: { [key in keyof Values]?: true }
}

export interface FormContext<Values extends object> extends ProviderState<Values> {
  values: Values
  register: (name: keyof Values) => void
  unregister: (name: keyof Values) => void
  setFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  setCachedFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  commitFieldValue: <FieldName extends keyof Values>(name: FieldName) => void
}

export type FieldMetaInfo<FieldValue, Values> = {
  validate?: (value: FieldValue, values: Values) => boolean | string
}

export interface FormProps<Values> {
  children: React.ReactNode
  values: Values
  setValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
}

export interface UseFieldProps<Values, FieldName extends keyof Values> {
  value: Values[FieldName]
  error?: string
  setValue: (value: Values[FieldName]) => void
  setCachedValue: (value: Values[FieldName]) => void
  commitValue: () => void
  isTouched: boolean
}
