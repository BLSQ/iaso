import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'
import { Comp1, Comp2 } from './apps/testapp'

const routes = [
  <Route path='comp1' component={Comp1}/>,
  <Route path='comp2' component={Comp2}/>,
  <Redirect path='*' to='comp1' />
]

const store = createStore()
const history = useRouterHistory(createHistory)({
  // This is the base url, the one we define
  // in hat.dashboard.urls
  // TODO: How to read this from Django?
  basename: '/dashboard/testapp/'
})

ReactDOM.render(<App store={store} routes={routes} history={history} />, document.getElementById('app'))
