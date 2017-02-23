import request from './request'
import { deepEqual } from './index'
import { LOAD, LOAD_SUCCESS, LOAD_ERROR } from '../redux/load'
import { push } from 'react-router-redux'

export function createUrl (params) {
  // Create a url from an params object
  // e.g.: `{foo: 11, bar: 22} => '/foo/11/bar/22'`
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
    // No data for this location, redirect to all
    dispatch(push(createUrl({ ...params, location: '' })))
    return false
  }
  return true
}

export function getFromCookie (name) {
  // https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
  if (document.cookie && document.cookie !== '') {
    let cookies = document.cookie.split(';')
    for (var i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim()
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1))
      }
    }
  }
}

export function fetchUrls (urls, params, oldParams, dispatch, checkResults) {
  if (deepEqual(oldParams, params, true)) {
    return
  }

  dispatch({
    type: LOAD
  })

  const promises = urls.map((config) => {
    const ps = {...config.defaultParams, ...params}
    return request([
      ['get', config.url],
      ['set', 'accept', 'application/json'],
      ['query', ps]
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
