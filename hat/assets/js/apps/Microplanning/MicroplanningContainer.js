/*
 * The MicroplanningContainer is responsible for loading data
 * for the micro-planning
 *
 * It has a few behaviors:
 * - load data when mounted
 * - make sure only filter params changing triggers a new data load
 * - emit success/fail events
 *
 * Handles state and data loading for the Microplanning page
 */

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { clone } from '../../utils'
import { fetchUrls } from '../../utils/fetchData'
import Microplanning from './Microplanning'

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
export const urls = [
  {
    name: 'villages',
    url: ' /api/villages/',
    mock: [{
      'AS': 'Muwanda-koso',
      'confirmedCases': 1,
      'lastConfirmedCase': '2016-06-27T13:29:03.141000Z',
      'village': 'Polongo',
      'ZS': 'Mosango'
    }, {
      'AS': 'Fula',
      'confirmedCases': 2,
      'lastConfirmedCase': '2016-08-21T12:27:17.420000Z',
      'village': 'Kikonzi-mf',
      'ZS': 'Yasa Bonga'
    }]
  },
  {
    name: 'locations',
    url: '/api/datasets/health_zones/',
    mock: [
      [
        1,
        "Mosango"
      ],
      [
        2,
        "Yasa-bonga"
      ]
    ]
  },
  {
    name: 'areas',
    url: '/api/datasets/health_areas/',
    mock: [
      1,
      "Kinzamba Ii"
    ]
  },
  {
    name: 'plannings',
    id: 'planning_id',
    url: '/api/plannings/',
    mock: [
      {
          "name": "planning 2",
          "id": 2
      },
      {
          "name": "Test",
          "id": 1
      }
    ]
  }
]

export class MicroplanningContainer extends Component {
  constructor(props) {
    super(props)
    this.currentParams = ''
  }

  loadData(params) {
    const { dispatch } = this.props
    const oldParams = clone(this.currentParams)
    this.currentParams = clone(params)
    fetchUrls(urls, params, oldParams, dispatch)
  }

  componentDidMount() {
    this.loadData(this.props.params)
  }

  componentWillReceiveProps(newProps) {
    this.loadData(newProps.params)
  }

  render() {
    return (
      <Microplanning params={this.props.params} />
    )
  }
}

export default connect()(MicroplanningContainer)
