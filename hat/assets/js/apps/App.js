import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { Router } from 'react-router'

export default class App extends Component {
  render () {
    const { store, routes, history } = this.props
    return (
      <Provider store={store}>
        <Router
          routes={routes}
          history={history} />
      </Provider>
    )
  }
}
