import React, { Component } from 'react'

// The root component needs to be
// 1. in a separate file
// 2. extend the Component interface
// for HMR to work!
export default class Import extends Component {
  render () {
    return (
      <div className='js_import_app' />
    )
  }
}
