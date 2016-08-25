import React, { Component } from 'react'
import Menu from './menu'

// This needs to be a full component for HMR
export default class Comp2 extends Component {
  render () {
    return (
      <div>
        I am the HMR updated component 2!
        <Menu />
      </div>
    )
  }
}
