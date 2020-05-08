import React from 'react'

import { FormContextProvider } from './context'
import Field from './Field'

const App = () => {
  const [values, setValues] = React.useReducer(
    (state: FormValues, changes: Partial<FormValues>) => ({
      ...state,
      ...changes,
    }),
    {
      stepName: 'First',
      firstName: 'petr',
      vipFlag: false,
    },
  )

  const setValue: SetValueFn<FormValues> = (name, value) => {
    setValues({ [name]: value })
  }

  const onClick = () => {
    if (values.stepName === 'First') {
      setValue('stepName', 'Second')
    } else {
      setValue('stepName', 'First')
    }
  }

  return (
    <FormContextProvider values={values} setValue={setValue}>
      {values.vipFlag === false && <Field name="firstName" />}
      <Field name="vipFlag" />

      <button type="button" onClick={onClick}>
        next
      </button>
    </FormContextProvider>
  )
}

export default App
