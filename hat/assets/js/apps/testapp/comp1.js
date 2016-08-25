import React, { Component } from 'react'
import Menu from './menu'

// This needs to be a full component for HMR
export default class Comp1 extends Component {
  render () {
    return (
      <div>
        I am the HMR updated component 1!
        <Menu />
      </div>
    )
  }
}
