import React from 'react'

export type FieldMetaInfo<FieldValue, Values, ExtraValues, CalculatedValues> = {
  validate?: (value: FieldValue, values: Values & CalculatedValues, extraValues?: ExtraValues) => boolean | string
  effects?: {
    [key in keyof Values]?: (value: FieldValue) => Values[key]
  }
}

type RenderFn<Values, ExtraValues, CalculatedValues> = (props: {
  values: Values
  extraValues?: ExtraValues
  calculatedValues?: CalculatedValues
  processSubmit: (event: React.FormEvent) => void
  errors?: { [key in keyof Values]?: string }
}) => React.ReactNode

type ChildrenProp<Values, ExtraValues, CalculatedValues> =
  | React.ReactNode
  | RenderFn<Values, ExtraValues, CalculatedValues>

export const isRenderFn = <Values, ExtraValues, CalculatedValues>(
  fn: ChildrenProp<Values, ExtraValues, CalculatedValues>,
): fn is RenderFn<Values, ExtraValues, CalculatedValues> => typeof fn === 'function'

export interface FormContextProps<Values, ExtraValues, CalculatedValues> {
  children: React.ReactNode | RenderFn<Values, ExtraValues, CalculatedValues>
  values: Values
  setValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  extraValues?: ExtraValues
  submitForm?: (values: Values) => void
  calculate?: (values: Values, extraValues?: ExtraValues) => CalculatedValues
}

export interface FormLocalState<Values, CalculatedValues> {
  cachedValues: { [key in keyof Values]?: Values[key] }
  errors: { [key in keyof Values]?: string }
  touched: { [key in keyof Values]?: true }
  visible: { [key in keyof Values]?: true }
  calculatedValues?: CalculatedValues
}

export interface FormContext<Values, ExtraValues, CalculatedValues> extends FormLocalState<Values, CalculatedValues> {
  values: Values
  extraValues?: ExtraValues
  register: (name: keyof Values) => void
  unregister: (name: keyof Values) => void
  setFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  setCachedFieldValue: <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => void
  commitFieldValue: <FieldName extends keyof Values>(name: FieldName) => void
  processSubmit: (event: React.FormEvent) => void
}

export interface UseFieldProps<Values, FieldName extends keyof Values> {
  value: Values[FieldName]
  error?: string
  setValue: (value: Values[FieldName]) => void
  setCachedValue: (value: Values[FieldName]) => void
  commitValue: () => void
  isTouched: boolean
}
