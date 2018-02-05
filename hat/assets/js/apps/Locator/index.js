import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Redirect, useRouterHistory } from 'react-router'
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux'
import { createHistory } from 'history'

import createStore from '../../redux/createStore'
import App from '../App'

import LocatorContainer from './LocatorContainer'
import {villageFiltersReducer, villageFiltersInitialState }from './redux/villageFilters'
import {caseReducer }from './redux/case'


export default function locator (appConfig, element, baseUrl) {
  const defaultPath = 'locator'
  const routes = [
    <Route
      path={defaultPath}
      component={LocatorContainer} />,
    <Redirect path='*' to={defaultPath} />
  ]

  let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
    basename: baseUrl
  })

  const store = createStore({
    kase: {},
    villageFilters: villageFiltersInitialState
  }, {
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
