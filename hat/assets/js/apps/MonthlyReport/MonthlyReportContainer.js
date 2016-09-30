import React, { Component } from 'react'
import { connect } from 'react-redux'
import MonthlyReport, { createUrl } from './MonthlyReport'
import { push } from 'react-router-redux'
import { clone } from '../../utils'
import loadDatasets from '../../utils/loadDatasets'

/*
 * Handles state
 * and data loading
 * for the monthly report page
 */

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
export const urls = [
  {
    name: 'locations',
    url: '/api/datasets/list_locations/',
    mock: [{ 'ZS': 'Yasa-bonga' }]
  },
  {
    name: 'total',
    url: '/api/datasets/count_total/',
    mock: {'tested': 1401, 'female': 818, 'male': 583, 'registered': 1401}
  },
  {
    name: 'screening',
    url: '/api/datasets/count_screened/',
    mock: {'negative': 1330, 'total': 1401, 'missing_confirmation': 71, 'positive': 71}
  },
  {
    name: 'confirmation',
    url: '/api/datasets/count_confirmed/',
    mock: {'negative': 0, 'total': 0, 'positive': 0}
  },
  {
    name: 'meta',
    url: '/api/datasets/campaign_meta/',
    mock: {'enddate': '2016-08-29T10:58:42.807000Z', 'startdate': '2016-08-11T08:18:43.559000Z', 'az_visited': 1, 'villages_visited': 4}
  },
  {
    name: 'testedPerDay',
    url: '/api/datasets/tested_per_day/',
    mock: []
  }
]


export class MonthlyReportContainer extends Component {
  constructor (props) {
    super(props)
    this.currentParams = ''
  }

  loadData (params) {
    const {dispatch} = this.props
    const oldParams = clone(this.currentParams)
    this.currentParams = clone(params)

    const checkLocation = (results) => {
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
    loadDatasets(urls, params, oldParams, dispatch, checkLocation)
  }

  componentDidMount () {
    this.loadData(this.props.params)
  }

  componentWillReceiveProps (newProps) {
    this.loadData(newProps.params)
  }

  render () {
    return (
      <MonthlyReport params={this.props.params} />
    )
  }
}

export default connect(
  (state, ownProps) => ({})
)(MonthlyReportContainer)
