/* global fetch, Headers */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import MonthlyReport, { createUrl } from './MonthlyReport'
import { LOAD, LOAD_SUCCESS, LOAD_ERROR } from '../../redux/load'
import { push } from 'react-router-redux'

/*
 * Handles state
 * and data loading
 * for the monthly report page
 */

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some mock data they expect
export const urls = {
  '/api/datasets/list_locations/': [{ 'ZS': 'Yasa-bonga' }],
  '/api/datasets/count_total/': {'tested': 1401, 'female': 818, 'male': 583, 'registered': 1401},
  '/api/datasets/count_screened/': {'negative': 1330, 'total': 1401, 'missing_confirmation': 71, 'positive': 71},
  '/api/datasets/count_confirmed/': {'negative': 0, 'total': 0, 'positive': 0},
  '/api/datasets/campaign_meta/': {'enddate': '2016-08-29T10:58:42.807000Z', 'startdate': '2016-08-11T08:18:43.559000Z', 'az_visited': 1, 'villages_visited': 4},
  '/api/datasets/tested_per_day/': []
}

// Assume all the URls are gonna use the same filters
const setFilter = ({ date = '', location = '', source = '' }, url) => {
  return `${url}?date=${date}&location=${location}&source=${source}`
}

// called with 'params' as context
function fetchAndParse (baseUrl) {
  const url = setFilter(this, baseUrl)
  return fetch(url, {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }),
    credentials: 'include'
  })
    .then((resp) => resp.json())
}

export class MonthlyReportContainer extends Component {
  constructor (props) {
    super(props)

    // this is not on state/props
    // since it's only a mechanism
    // to prevent extra calls
    this._currentFilters = ''
  }

  componentDidMount () {
    const {params, dispatch} = this.props
    this.loadData(params, dispatch)
  }

  loadData (params, dispatch) {
    if (JSON.stringify(this._currentFilters) === JSON.stringify(params)) {
      return
    }

    dispatch({
      type: LOAD
    })

    this._currentFilters = JSON.parse(JSON.stringify(params))

    Promise.all(Object.keys(urls).map(fetchAndParse, params))
      .then(([locations, total, screening, confirmation, meta, testedPerDay]) => {
        // Check if we have data for the selected location,
        // if not, redirect
        const selectedLocation = params.location &&
          decodeURIComponent(params.location)
        const validLocation = locations.filter((location) => {
          return location.ZS === selectedLocation
        })[0]

        if (selectedLocation && !validLocation) {
          // No data for this location, redirect to national
          return dispatch(push(createUrl({ ...params, location: '' })))
        }

        // Collect all responses in one action
        dispatch({
          type: LOAD_SUCCESS,
          // destructure responses array into object here,
          // since its dependent on URL order above
          payload: { locations, total, screening, confirmation, meta, testedPerDay }
        })
      })
      .catch((err) => {
        // reset currentfilters so we can retry loading
        dispatch({
          type: LOAD_ERROR,
          payload: err
        })
      })
  }

  componentWillReceiveProps (newProps) {
    this.loadData(newProps.params, newProps.dispatch)
  }

  render () {
    return (
      <MonthlyReport {...this.props} />
    )
  }
}

export default connect((state, ownProps) => ({
  config: state.config,
  report: state.report
}))(MonthlyReportContainer)
