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
import { push } from 'react-router-redux'
import { createUrl } from '../../utils/fetchData'
import Locator from './Locator'
import { villageFiltersActions, villageFiltersInitialState } from './redux/villageFilters'
import { caseActions } from './redux/case'
const request = require('superagent')

// This is where we configure the app data urls:
// the order is used in the success handler below
// the value for each key is some url, name and mock data.
// The name is used as the key in the results payload.
export const urls = []

class LocatorContainer extends Component {

  componentDidMount() {
    this.fetchProvinces()
    this.fetchCases()
  }

  render() {
    let villageFilters = this.props.villageFilters;
    if (!villageFilters)
      villageFilters = {}
    return (
      <Locator villageFilters={villageFilters} kase={this.props.kase}
        selectProvince={provinceId => this.selectProvince(provinceId)}
        selectZone={zoneId => this.selectZone(zoneId)}
        selectArea={areaId => this.selectArea(areaId)}
        selectVillage={villageId => this.selectVillage(villageId)}
        saveVillage={(kase_id, villageObj) => this.saveVillage(kase_id, villageObj)} />
    )
  }

  /*###########requests###########*/
  fetchProvinces() {
    const { dispatch } = this.props
    return request
      .get(`/api/provinces/`)
      .then(result => {
        dispatch(villageFiltersActions.loadProvinces(result.body))
      })
      .catch((err) => {
        console.error('Error when fetching provinces', err)
      })
  }



  selectProvince(provinceId) {
    const { dispatch } = this.props
    if (provinceId) {
      return request
        .get(`/api/zs/?province_id=${provinceId}`)
        .then(result => {
          let payload = { zones: result.body, provinceId }
          dispatch(villageFiltersActions.loadZones(payload))
        })
        .catch((err) => {
          console.error('Error when fetching zones', err)
        })
    }
  }

  selectZone(zoneId) {
    const { dispatch } = this.props
    if (zoneId) {
      return request
        .get(`/api/as/?zs_id=${zoneId}`)
        .then(result => {
          let payload = { areas: result.body, zoneId }
          dispatch(villageFiltersActions.loadAreas(payload))
        })
        .catch((err) => {
          console.error('Error when fetching areas', err)
        })
    }
  }

  selectArea(areaId) {
    const { dispatch } = this.props
    if (areaId) {
      return request
        .get(`/api/villages/?as_list=true&as_id=${areaId}`)
        .then(result => {
          let payload = { villages: result.body, areaId }
          dispatch(villageFiltersActions.loadVillages(payload))
        })
        .catch((err) => {
          console.error('Error when fetching areas', err)
        })
    }
  }

  selectVillage(villageId) {
    const { dispatch } = this.props
    dispatch(villageFiltersActions.selectVillage(villageId))
  }

  saveVillage(kase_id, villageObj) {
    const { dispatch } = this.props
    return request
      .patch(`/api/cases/${kase_id}/`)
      .set('Content-Type', 'application/json')
      .send(villageObj)
      .then(result => {
        dispatch(villageFiltersActions.resetFilters())
        this.fetchProvinces()
        this.fetchCases()
      })
      .catch((err) => {
        console.error('Error when saving village', err)
      })
  }

  fetchCases() {
    const { dispatch } = this.props
    return request
      .get(`/api/cases/`)
      .query({located: false})
      .then(result => {
        dispatch(caseActions.setCase(result.body[0]))
      })
      .catch((err) => {
        console.error('Error when fetching areas', err)
      })
  }

  /*##############################*/
}

export default connect()(LocatorContainer)
