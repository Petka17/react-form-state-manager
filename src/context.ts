import createFormContext from './createFormContext'
//import { FormData } from './types'

const { FormContextProvider, useField } = createFormContext<FormValues>({
  stepName: {},
  firstName: { validate: (value) => value.length > 2 },
  vipFlag: {},
})

export { FormContextProvider, useField }
