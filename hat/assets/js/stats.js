import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'
import moment from 'moment'

import createStore from './redux/createStore'
import App from './apps/App'

import StatsContainer from './apps/Stats/StatsContainer'
import {loadReducer} from './redux/load'

export default function statsApp (appConfig, element, baseUrl) {
  /*
  This creates a default route using the parameters
  in the 'appConfig' object from django
  showing 'all' for the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06'],
    sources: ['all', 'pv', 'mobilebackup', 'historic'],
    locations: [{ 'ZS': 'Mosango' }]
  }
  */
  const dateFrom = moment().startOf('year').format('YYYY-MM-DD')
  const dateTo = moment().format('YYYY-MM-DD')

  const routes = [
    <Route
      path='charts(/location/:location)(/source/:source)(/date_from/:date_from)(/date_to/:date_to)'
      component={StatsContainer} />,
    <Redirect path='*' to={`charts/date_from/${dateFrom}/date_to/${dateTo}`} />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
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
    element
  )
}
