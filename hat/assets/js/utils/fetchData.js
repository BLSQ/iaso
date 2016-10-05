import request from './request'
import { deepEqual } from './index'
import { LOAD, LOAD_SUCCESS, LOAD_ERROR } from '../redux/load'
import { push } from 'react-router-redux'

export function createUrl (params) {
  let url = '/charts'
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value) {
      url += `/${key}/${value}`
    }
  })
  return url
}

export function checkLocation (params, results, dispatch) {
  // Check if we have data for the selected location,
  // if not, redirect
  const selectedLocation = params.location &&
        decodeURIComponent(params.location)
  const validLocation = results.locations.some((location) => {
    return location.ZS === selectedLocation
  })
  if (selectedLocation && !validLocation) {
    // No data for this location, redirect to national
    dispatch(push(createUrl({ ...params, location: '' })))
    return false
  }
  return true
}

export default function fetchData (urls, params, oldParams, dispatch, checkResults) {
  if (deepEqual(oldParams, params, true)) {
    return
  }

  dispatch({
    type: LOAD
  })

  const promises = urls.map((config) => {
    return request([
      ['get', config.url],
      ['set', 'accept', 'application/json'],
      ['query', params]
    ])
  })
  return Promise.all(promises)
    .then((results) => {
      // Create a payload object where the key is the name defined for
      // the url and the value is the response content.
      const payload = results.reduce((payload, result, i) => {
        payload[urls[i].name] = result
        return payload
      }, {})
      // Call `checkResults` which can abort and takeover here
      if (checkResults && !checkResults(params, payload, dispatch)) {
        return
      }
      // Collect all responses in one action
      dispatch({
        type: LOAD_SUCCESS,
        payload
      })
    })
    .catch((err) => {
      dispatch({
        type: LOAD_ERROR,
        payload: err
      })
    })
}
