import { combineReducers, createStore as _createStore, compose } from 'redux'
import { routerReducer } from 'react-router-redux'
import { Router, hashHistory } from 'react-router'

export default (initialState = {}, reducers = {}) => {
  return _createStore(
    combineReducers(Object.assign({
      routing: routerReducer,
    }, reducers)),
    initialState
  )
}
