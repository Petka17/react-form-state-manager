import React from 'react'

interface Props {
  value: boolean
  setValue: (value: boolean) => void
}

const Checkbox: React.FC<Props> = ({ value, setValue }) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.checked)
  }

  return <input type="checkbox" checked={value} onChange={onChange} />
}

export default Checkbox
