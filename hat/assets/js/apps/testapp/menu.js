import React from 'react'
import { Link } from 'react-router'

export default () => {
  return (
    <ul>
      <li><Link to='comp1'>Check component 1</Link></li>
      <li><Link to='comp2'>Check component 2</Link></li>
    </ul>
  )
}
