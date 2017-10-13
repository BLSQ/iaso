import React, { Component } from 'react'
import { connect } from 'react-redux'
import MonthlyReport from './TeamsDevices'
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
    name: 'meta',
    url: '/api/datasets/campaign_meta/',
    mock: {'enddate': '2016-08-29T10:58:42.807000Z', 'startdate': '2016-08-11T08:18:43.559000Z', 'as_visited': 1, 'villages_visited': 4}
  },
  {
    name: 'device_status',
    url: '/api/datasets/device_status/'
  }
]

export class TeamsDevicesReportContainer extends Component {
  constructor (props) {
    super(props)
    this.currentParams = ''
  }

  loadData (params) {
    const {dispatch} = this.props
    const oldParams = clone(this.currentParams)
    this.currentParams = clone(params)
    // force the source to `mobile`
    // (includes `mobile_backup` and `mobile_sync`)
    // (it makes no sense with `historical` or `pv` data)
    const source = 'mobile'

    // to avoid fetching again because params changed include it in both sides, new and old.
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

export default connect()(TeamsDevicesReportContainer)
