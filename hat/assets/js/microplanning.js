import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import MicroplanningContainer from './apps/Microplanning/MicroplanningContainer'
import { selectionReducer, selectionInitialState } from './apps/Microplanning/selection'
import { loadReducer } from './redux/load'

export default function microplanningApp (appConfig, element, baseUrl) {
  const routes = [
    <Route
      path='charts(/datefrom/:datefrom)(/dateto/:dateto)(/caseyearfrom/:caseyearfrom)(/screeningyearto/:screeningyearto)(/location/:location)'
      component={MicroplanningContainer} />,
    <Redirect path='*' to='charts/caseyearfrom/5/screeningyearto/0' />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    config: appConfig,
    villages: {},
    selection: selectionInitialState
  }, {
    config: (state = {}) => state,
    villages: loadReducer,
    selection: selectionReducer
  }, [
    routerMiddleware(history)
  ])

  history = syncHistoryWithStore(
    history,
    store
  )

  ReactDOM.render(
    <App store={store}
      routes={routes}
      history={history} />,
    element
  )
}
