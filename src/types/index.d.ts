interface FormValues {
  stepName: 'First' | 'Second'
  firstName: string
  vipFlag: boolean
}

type SetValueFn<Values extends object> = <FieldName extends keyof Values>(
  name: FieldName,
  value: Values[FieldName],
) => void
