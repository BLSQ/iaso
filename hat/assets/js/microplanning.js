import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import MicroplanningContainer from './apps/Microplanning/MicroplanningContainer'
import { microplanningReducer } from './apps/Microplanning/redux'
import { loadReducer } from './redux/load'

export default function microplanningApp (appConfig, element, baseUrl) {
  const routes = [
    <Route
      path='charts(/caseperiod/:caseperiod)(/screeningperiod/:screeningperiod)(/location/:location)'
      component={MicroplanningContainer} />,
    <Redirect path='*' to='charts/caseperiod/since-five-years/screeningperiod/since-last-year' />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    config: appConfig,
    highlight: {},
    microplanning: {}
  }, {
    config: (state = {}) => state,
    highlight: loadReducer,
    microplanning: microplanningReducer
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
