/* global describe, it, beforeEach, afterEach */
import assert from 'assert'
import { renderWithStore } from '../../test/utils'
import React from 'react'
import {createStore} from 'redux'
import nock from 'nock'
import sinon from 'sinon'
import { CALL_HISTORY_METHOD } from 'react-router-redux'
import { LOAD_SUCCESS } from '../../redux/load'

import { urls, MonthlyReportContainer } from './MonthlyReportContainer'

const appConfig = {
  'locations': [
    { 'ZS': 'Mosango' },
    { 'ZS': 'Yasa-bonga' }
  ],
  'dates': [
    '2016-03',
    '2016-04',
    '2016-05',
    '2016-06',
    '2016-07',
    '2016-08'
  ],
  'sources': [
    'mobile_backup'
  ]
}

// create a single nock scope chaining all requests
function createNockScope () {
  const ns = nock('http://localhost')
  urls.forEach((config) => {
    ns.get(new RegExp(`^${config.url}`)).reply(200, config.mock)
  })
  return ns
}

const checkAction = (calls, actionType) => {
  return calls.some((args) => {
    return args[0] && args[0].type === actionType
  })
}

// Look for redirects in the dispatch spy calls
const checkRedirect = (calls) => checkAction(calls, CALL_HISTORY_METHOD)

// Look for LOAD_SUCCESS in the dispatch calls
const checkSuccess = (calls) => checkAction(calls, LOAD_SUCCESS)

/*
 * The MonthlyReportContainer is responsible for loading data
 * for the monthly report
 *
 * it has a few behaviors:
 * - load data when mounted
 * - make sure only filter params changing triggers a new data load
 * - emit success/fail events
 * - redirect the page to 'national' if data is not available for a location
 *
 */
describe('MonthlyReportContainer Loading Data', () => {
  let reduxStore
  let defaultProps
  let nockScope

  beforeEach(function () {
    defaultProps = {
      config: appConfig,
      report: {},
      params: { date: appConfig.dates[1] },
      dispatch: sinon.spy()
    }
    reduxStore = createStore((e) => e, {
      config: appConfig,
      report: {}
    })
    nockScope = createNockScope()
  })

  afterEach(function () {
    // always cleanup in case any nocks have been leftover
    nock.cleanAll()
  })

  it('loads data on initialization', () => {
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...defaultProps} />
    )
    assert(nockScope.isDone(), 'The urls have been requested')
  })

  it('loads data when the filter params change', function () {
    const node = document.createElement('div')
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...defaultProps} />, node
    )
    assert(nockScope.isDone(), 'The urls have been requested')

    // we restore the nocks to test if they will be called again
    nockScope = createNockScope()
    assert(nockScope.isDone() === false, 'The fresh nock scope is not done')

    const props2 = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        date: appConfig.dates[2]
      }
    }
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...props2} />, node
    )

    assert(nockScope.isDone(), 'The urls have been requested a second time')
    nockScope = createNockScope()

    const props3 = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        date: appConfig.dates[2]
      }
    }
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...props3} />, node
    )

    assert(nockScope.isDone() === false, 'The urls have not been requested again')
  })

  it('does not redirect on "national"', (done) => {
    const props = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: '' // national
      }
    }
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...props} />
    )
    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(!redirect, 'no redirect call was made')

      let success = checkSuccess(defaultProps.dispatch.args)
      assert(success, 'success event dispatched')
      done()
    }, 200)
  })

  it('redirects to "national (location: \'\')" if location is not included in the selected date range', (done) => {
    const props = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: 'Unknown Location'
      }
    }
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...props} />
    )
    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(redirect, 'a redirect call was made')
      done()
    }, 200)
  })

  it('does not redirect if location is included in the selected date range', (done) => {
    const props = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: 'Yasa-bonga' // in mock data
      }
    }
    renderWithStore(
      reduxStore, <MonthlyReportContainer {...props} />
    )
    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(!redirect, 'no redirect call was made')

      let success = checkSuccess(defaultProps.dispatch.args)
      assert(success, 'success event dispatched')
      done()
    }, 200)
  })
})
