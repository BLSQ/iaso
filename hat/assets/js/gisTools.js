import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import GisToolsContainer from './apps/GisTools/GisToolsContainer'
import { loadReducer } from './redux/load'

export default function gisToolsApp (appConfig, element, baseUrl) {
  const routes = [
    <Route
      path='charts(/location/:location)(/source/:source)(/dateperiod/:dateperiod)(/offset/:offset)'
      component={GisToolsContainer} />,
    <Redirect path='*' to='charts/dateperiod/current-month' />
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
