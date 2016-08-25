import { combineReducers, createStore as _createStore } from 'redux'
import { routerReducer } from 'react-router-redux'

export default (initialState = {}, reducers = {}) => {
  return _createStore(
    combineReducers(Object.assign({
      routing: routerReducer
    }, reducers)),
    initialState
  )
}
