import React from 'react'
import ReactDOM from 'react-dom'
import { Route, useRouterHistory } from 'react-router'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import Playground from './apps/playground/playground'

const routes = [
  <Route path='/' component={Playground} />
]

const store = createStore()
const history = useRouterHistory(createHistory)({
  // This is the base url, the one we define
  // in hat.dashboard.urls
  // TODO: How to read this from Django?
  basename: '/playground/'
})

ReactDOM.render(<App store={store} routes={routes} history={history} />, document.getElementById('app'))
