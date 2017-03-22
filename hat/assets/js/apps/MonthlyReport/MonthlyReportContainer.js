import React, { Component } from 'react'
import { connect } from 'react-redux'
import MonthlyReport from './MonthlyReport'
import { clone } from '../../utils'
import { fetchUrls, checkLocation } from '../../utils/fetchData'

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
    mock: ['Mosango', 'Yasa Bonga']
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
    mock: {'enddate': '2016-08-29T10:58:42.807000Z', 'startdate': '2016-08-11T08:18:43.559000Z', 'as_visited': 1, 'villages_visited': 4}
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
    // force the source to `mobile_backup`
    // (it makes no sense with historical or pv data)
    // to avoid fetching again because params changed include it in both sides, new and old.
    const source = 'mobile_backup'
    fetchUrls(urls, {...params, source}, {...oldParams, source}, dispatch, checkLocation)
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

export default connect()(MonthlyReportContainer)
