import React from 'react'
import ReactDOM from 'react-dom'
import { Route, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from '../../redux/createStore'
import {loadReducer} from '../../redux/load'
import App from '../App'

import LocatorContainer from './LocatorContainer'
import {villageFiltersReducer, villageFiltersInitialState }from './redux/villageFilters'
import {caseReducer }from './redux/case'


export default function locator (appConfig, element, baseUrl) {
  const defaultPath = '/'
  const routes = [
    <Route
      path={defaultPath}
      component={LocatorContainer} />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    kase: {},
    load: {},
    villageFilters: villageFiltersInitialState
  }, {
    load: loadReducer,
    kase : caseReducer,
    villageFilters: villageFiltersReducer
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
