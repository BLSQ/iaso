import request from './request'
import { deepEqual } from './index'
import { LOAD, LOAD_SUCCESS, LOAD_ERROR } from '../redux/load'

export default function loadDatasets (urls, params, oldParams, dispatch, checkResults) {
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
      if (!checkResults(payload)) {
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
