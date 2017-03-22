import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import MicroplanningContainer from './apps/Microplanning/MicroplanningContainer'
import { selectionReducer, selectionInitialState } from './apps/Microplanning/redux/selection'
import { mapReducer, mapInitialState } from './apps/Microplanning/redux/map'
import { loadReducer } from './redux/load'

export default function microplanningApp (element, baseUrl) {
  const currentYear = new Date().getFullYear()
  const caseyears = [ 0, 1, 2, 3, 4 ].map((i) => currentYear - i)
  const defaultPath = 'charts/caseyears/' + caseyears.join(',')
  const routes = [
    <Route
      path='charts(/date_from/:date_from)(/date_to/:date_to)(/caseyears/:caseyears)(/location/:location)'
      component={MicroplanningContainer} />,
    <Redirect path='*' to={defaultPath} />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    config: {},
    load: {},
    selection: selectionInitialState,
    map: mapInitialState
  }, {
    config: (state = {}) => state,
    load: loadReducer,
    selection: selectionReducer,
    map: mapReducer
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
