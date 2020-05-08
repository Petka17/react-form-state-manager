interface Values {
  firstName: string
  vipFlag: boolean
}

const fn = <FieldName extends keyof Values>(name: FieldName, value: Values[FieldName]) => {
  return { [name]: value }
}

fn('firstName', 'test')

export default fn
