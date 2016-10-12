import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import SuspectCasesContainer from './apps/SuspectCases/SuspectCasesContainer'
import { loadReducer } from './redux/load'
import { downloadReducer } from './redux/download'

export default function suspectCasesApp (appConfig, element, baseUrl) {
  const routes = [
    <Route
      path='charts(/location/:location)(/source/:source)(/dateperiod/:dateperiod)(/offset/:offset)'
      component={SuspectCasesContainer} />,
    <Redirect path='*' to='charts/dateperiod/current-month' />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    config: appConfig,
    suspects: {},
    download: {}
  }, {
    config: (state = {}) => state,
    suspects: loadReducer,
    download: downloadReducer
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
