import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import Menu from './menu'

// This needs to be a full component for HMR
export default class Comp1 extends Component {
  render () {
    return (
      <div>
        <FormattedMessage
          id='example.comp1.text'
          defaultMessage='I am the HMR updated component 1!' />
        <Menu />
      </div>
    )
  }
}
