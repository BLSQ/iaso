import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import MonthlyReportContainer from './apps/MonthlyReport/MonthlyReportContainer'
import {loadReducer} from './redux/load'

// TODO: fix for testing
var appConfig = window.appConfig

// This creates a default route using the parameters
// in the 'appConfig' object from django
// showing 'all' for the last month
const defaultRoute = (config) => {
  var latestMonth = config.dates.slice(-1).pop()
  return `charts/date/${latestMonth}`
}

const routes = [
  <Route
    path='charts(/location/:location)(/source/:source)(/date/:date)'
    component={MonthlyReportContainer} />,
  <Redirect path='*' to={defaultRoute(appConfig)} />
]

let history = useRouterHistory(createHistory)({
  // This is the base url, the one we define
  // in hat.dashboard.urls
  // TODO: How to read this from Django?
  basename: '/dashboard/monthly-report/'
})

const store = createStore({
  config: appConfig,
  report: {}
}, {
  config: (state = {}) => state,
  report: loadReducer
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
  document.getElementById('app')
)
