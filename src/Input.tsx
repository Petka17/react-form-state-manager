import React from 'react'

interface Props {
  value: string
  setValue: (value: string) => void
}

const Input: React.FC<Props> = ({ value, setValue }) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return <input type="text" value={value} onChange={onChange} />
}

export default Input
