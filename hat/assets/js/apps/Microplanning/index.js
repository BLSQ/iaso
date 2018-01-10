import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from '../../redux/createStore'
import {loadReducer} from '../../redux/load'
import App from '../App'

import MicroplanningContainer from './MicroplanningContainer'
import { selectionReducer, selectionInitialState } from './redux/selection'
import { mapReducer, mapInitialState } from './redux/map'

export default function microplanningApp (element, baseUrl) {
  const currentYear = new Date().getFullYear()
  const caseyears = [ 0, 1, 2, 3, 4 ].map((i) => currentYear - i)
  const defaultPath = 'charts/caseyears/' + caseyears.join(',')
  const routes = [
    <Route
      path='charts(/caseyears/:caseyears)(/zs_id/:zs_id)(/planning_id/:planning_id)(/team/:team)'
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
