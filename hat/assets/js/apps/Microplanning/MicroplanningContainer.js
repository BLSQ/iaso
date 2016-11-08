import React, { Component } from 'react'
import { connect } from 'react-redux'
import Microplanning from './Microplanning'
import { clone } from '../../utils'
import { fetchUrls } from '../../utils/fetchData'

/*
 * Handles state
 * and data loading
 * for the Microplanning page
 *
 * TODO: This is very similar to the MonthlyReportContainer.
 *       We might want refactor to both be the same Component.
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
    name: 'confirmation',
    url: '/api/datasets/count_confirmed/',
    mock: { 'negative': 0, 'total': 0, 'positive': 0 }
  },
  {
    name: 'confirmedByLocation',
    url: '/api/datasets/confirmed_by_location/',
    mock: [{
      'province': 'Bandundu',
      'ZS': 'Yasa-bonga',
      'AZ': 'Kimbwayamu',
      'village': 'Kintulu',
      'confirmed_cases': 2,
      'last_confirmed_case': '2016-06-03T00:00:00.000Z'
    }]
  }
]

export class MicroplanningContainer extends Component {
  constructor (props) {
    super(props)
    this.currentParams = ''
  }

  loadData (params) {
    const {dispatch} = this.props
    const oldParams = clone(this.currentParams)
    this.currentParams = clone(params)
    fetchUrls(urls, params, oldParams, dispatch)
  }

  componentDidMount () {
    this.loadData(this.props.params)
  }

  componentWillReceiveProps (newProps) {
    this.loadData(newProps.params)
  }

  render () {
    return (
      <Microplanning params={this.props.params} />
    )
  }
}

export default connect()(MicroplanningContainer)
