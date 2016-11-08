import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import MicroplanningContainer from './apps/Microplanning/MicroplanningContainer'
import { loadReducer } from './redux/load'

export default function microplanningApp (appConfig, element, baseUrl) {
  const routes = [
    <Route
      path='charts(/dateperiod/:dateperiod)'
      component={MicroplanningContainer} />,
    <Redirect path='*' to='charts/dateperiod/since-last-year' />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    config: appConfig,
    geoData: {}
  }, {
    config: (state = {}) => state,
    geoData: loadReducer
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
