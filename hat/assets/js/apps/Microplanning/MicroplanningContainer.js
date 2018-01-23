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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { clone } from '../../utils';
import { fetchUrls, fetchUrl } from '../../utils/fetchData';
import { push } from 'react-router-redux';
import { createUrl } from '../../utils/fetchData';
import Microplanning from './Microplanning';
import { selectionActions } from './redux/selection';

const request = require('superagent');

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
export const urls = [
  {
    name: 'villagesMap',
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
    url: '/api/zs/',
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
    name: 'coordinations',
    url: '/api/coordinations/',
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
    url: '/api/as/',
    mock: [
      1,
      "Kinzamba Ii"
    ]
  },
  {
    name: 'plannings',
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
  },
  {
    name: 'teams',
    url: '/api/teams/',
    mock: [
      [
        2,
        "qsdf"
      ],
      [
        1,
        "team 1"
      ]
    ]
  }
]

export class MicroplanningContainer extends Component {
  constructor(props) {
    super(props)
    this.currentParams = ''
  }

  updateUrlForCoordination(params) {
    request
      .get(`/api/coordinations/`)
      .query(params)
      .then(result => {
        if (result.body[0].zs.length > 0) {
          let tempParams = clone(params);
          result.body[0].zs.map(
            zs => {
              if (typeof tempParams.zs_id === 'undefined') {
                tempParams.zs_id = `${zs.id}`;
              } else {
                tempParams.zs_id += `,${zs.id}`;
              }
            }
          );
          const { dispatch } = this.props;
          dispatch(push(createUrl(tempParams)));
        } else {
          loadFullData(params);
        }
      })
      .catch((err) => {
        console.error('Error when fetching coordinations details');
      });
  }

  loadFullData(params) {
    const { dispatch } = this.props;
    const oldParams = clone(this.currentParams);
    this.currentParams = clone(params);
    fetchUrls(urls, params, oldParams, dispatch);
    request
      .get(`/api/assignations/`)
      .query(params)
      .then((result) => {
        if (result.body.length > 0) {
          dispatch(selectionActions.selectItems(result.body));
        }
      })
      .catch((err) => {
        console.error('Error when fetching villages details');
      });
  }

  componentDidMount() {

    if (this.props.params.coordination_id && !this.props.params.zs_id) {
      this.updateUrlForCoordination(this.props.params);
    } else {
      this.loadFullData(this.props.params);
    }
  }

  componentWillReceiveProps(newProps) {
    this.loadFullData(newProps.params);
  }

  render() {
    return (
      <Microplanning params={this.props.params} />
    )
  }
}

export default connect()(MicroplanningContainer)
