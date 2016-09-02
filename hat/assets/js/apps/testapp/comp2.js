import React, { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import Menu from './menu'

// This needs to be a full component for HMR
export default class Comp2 extends Component {
  render () {
    return (
      <div>
        <FormattedMessage
          id='example.comp2.text'
          defaultMessage='I am the HMR updated component 2!' />
        <Menu />
      </div>
    )
  }
}
