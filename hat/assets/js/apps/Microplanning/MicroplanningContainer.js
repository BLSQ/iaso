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
    name: 'villagesWithConfirmedCases',
    url: '/api/datasets/confirmed_by_location/',
    mock: [{
      'area': 'Muwanda-koso',
      'confirmedCases': 1,
      'lastConfirmedCase': '2016-06-27T13:29:03.141000Z',
      'lastScreeningDate': '2016-06-12T09:20:48.654000Z',
      'screenedPeople': 201,
      'village': 'Polongo',
      'zone': 'Mosango'
    }, {
      'area': 'Fula',
      'confirmedCases': 2,
      'lastConfirmedCase': '2016-08-21T12:27:17.420000Z',
      'lastScreeningDate': '2016-08-21T12:27:17.420000Z',
      'screenedPeople': 211,
      'village': 'Kikonzi-mf',
      'zone': 'Yasa-bonga'
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
