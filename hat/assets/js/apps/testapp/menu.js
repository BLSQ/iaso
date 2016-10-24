import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Link } from 'react-router'

export default () => {
  return (
    <ul>
      <li><Link to='comp1'><FormattedMessage id='testapp.menu.comp1' defaultMessage='Check component 1' /></Link></li>
      <li><Link to='comp2'><FormattedMessage id='testapp.menu.comp2' defaultMessage='Check component 2' /></Link></li>
    </ul>
  )
}
