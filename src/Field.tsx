import React from 'react'

import Checkbox from './Checkbox'
import { useField } from './context'
import Input from './Input'

interface Props {
  name: keyof FormValues
}

const Field: React.FC<Props> = ({ name }) => {
  const { value, error, setValue } = useField(name)

  return (
    <div>
      {typeof value === 'string' && <Input value={value} setValue={setValue} />}
      {typeof value !== 'string' && <Checkbox value={value} setValue={setValue} />}
      <p>{error}</p>
    </div>
  )
}

export default Field
