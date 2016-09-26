/* global fetch, Headers */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import MonthlyReport from './MonthlyReport'
import { LOAD, LOAD_SUCCESS, LOAD_ERROR } from '../../redux/load'

/*
 * Handles state
 * and data loading
 * for the monthly report page
 */

// This is where we configure the app data urls:
// the order is used in the success handler below
const urls = [
  '/api/datasets/list_locations',
  '/api/datasets/count_total',
  '/api/datasets/count_screened',
  '/api/datasets/count_confirmed',
  '/api/datasets/campaign_meta'
]

// Assume all the URls are gonna use the same filters
const setFilter = ({ date = '', location = '', source = '' }, url) => {
  return `${url}?date=${date}&location=${location}&source=${source}`
}

const fetchParams = {
  method: 'GET',
  headers: new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }),
  credentials: 'include'
}

// called with 'params' as context
function fetchAndParse (baseUrl) {
  const url = setFilter(this, baseUrl)
  return fetch(url, fetchParams)
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

    if (params.date !== this._currentFilters.date) {
      // We reset the location when the date changes
      params.location = ''
    }
    this._currentFilters = JSON.parse(JSON.stringify(params))

    Promise.all(urls.map(fetchAndParse, params))
      .then(([locations, total, screening, confirmation, meta]) => {
        // Collect all responses in one action
        dispatch({
          type: LOAD_SUCCESS,
          // destructure responses array into object here,
          // since its dependent on URL order above
          payload: { locations, total, screening, confirmation, meta }
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
