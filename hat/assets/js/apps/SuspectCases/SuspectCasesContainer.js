import React, { Component } from 'react'
import { connect } from 'react-redux'
import SuspectCases from './SuspectCases'
import { clone } from '../../utils'
import { fetchUrls, checkLocation } from '../../utils/fetchData'

/*
 * Handles state
 * and data loading
 * for the suspect cases page
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
    name: 'cases',
    url: '/api/cases/',
    defaultParams: {'only_suspects': true},
    mock: {
      count: 4,
      limit: 2,
      offset: 0,
      next: 'http://localhost/foo',
      previous: null,
      results: [
        {document_id: '1', date: '2016-01-01'},
        {document_id: '2', date: '2016-01-02'},
        {document_id: '3', date: '2016-01-03'},
        {document_id: '4', date: '2016-01-04'}
      ]
    }
  }
]

export class SuspectCasesContainer extends Component {
  constructor (props) {
    super(props)
    this.currentParams = ''
  }

  loadData (params) {
    const {dispatch} = this.props
    const oldParams = clone(this.currentParams)
    this.currentParams = clone(params)
    fetchUrls(urls, params, oldParams, dispatch, checkLocation)
  }

  componentDidMount () {
    this.loadData(this.props.params)
  }

  componentWillReceiveProps (newProps) {
    this.loadData(newProps.params)
  }

  render () {
    return (
      <SuspectCases params={this.props.params} />
    )
  }
}

export default connect()(SuspectCasesContainer)
