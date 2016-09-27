/* global describe, it, beforeEach, afterEach */
import assert from 'assert'
import { renderWithDOMNode } from '../../test/utils'
import fetchMock from 'fetch-mock'
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

const checkAction = (calls, ACTION) => {
  let call = calls.filter((args) => {
    return args[0] && args[0].type === ACTION
  })[0]

  return call && call[0]
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
  let oldHeaders = global.Headers
  let defaultProps
  beforeEach(() => {
    global.Headers = (h) => h

    Object.keys(urls).forEach((url) => {
      fetchMock.get(new RegExp(`^${url}`), urls[url])
    })

    defaultProps = {
      config: appConfig,
      report: {},
      params: { date: appConfig.dates[1] },
      dispatch: sinon.spy()
    }
  })

  afterEach(() => {
    global.Headers = oldHeaders
    fetchMock.restore()
  })

  it('loads data on initialization', () => {
    const node = document.createElement('div')
    renderWithDOMNode(MonthlyReportContainer, defaultProps, node)

    Object.keys(urls).forEach((url) => {
      assert(fetchMock.called(new RegExp('^' + url)), `called ${url}`)
    })
  })

  it('loads data when it filter params changes', function () {
    const node = document.createElement('div')
    renderWithDOMNode(MonthlyReportContainer, defaultProps, node)

    // rendering same component in same node triggers prop change
    // http://stackoverflow.com/questions/30614454/how-to-test-a-prop-update-on-react-component
    renderWithDOMNode(
      MonthlyReportContainer,
      {
        ...defaultProps,
        params: {
          ...defaultProps.params,
          date: appConfig.dates[2]
        }
      },
      node
    )

    Object.keys(urls).forEach((url) => {
      assert.equal(
        fetchMock.calls(new RegExp('^' + url)).length,
        2,
        `called ${url} once more on receiving props`
      )
    })

    renderWithDOMNode(
      MonthlyReportContainer,
      {
        ...defaultProps,
        params: {
          ...defaultProps.params,
          date: appConfig.dates[2]
        }
      },
      node
    )

    Object.keys(urls).forEach((url) => {
      assert.equal(
        fetchMock.calls(new RegExp('^' + url)).length,
        2,
        `no additional calls when params are the same`
      )
    })
  })

  it('does not redirect on "national"', (done) => {
    const node = document.createElement('div')
    renderWithDOMNode(MonthlyReportContainer, {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: '' // national
      }
    }, node)

    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(!redirect, 'no redirect call was made')

      let success = checkSuccess(defaultProps.dispatch.args)
      assert(success, 'success event dispatched')
      done()
    }, 200)
  })

  it('redirects to "national (location: \'\')" if location is not included in the selected date range', (done) => {
    const node = document.createElement('div')
    renderWithDOMNode(MonthlyReportContainer, {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: 'Unknown Location'
      }
    }, node)

    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(redirect, 'a redirect call was made')
      done()
    }, 200)
  })

  it('does not redirect if location is included in the selected date range', (done) => {
    const node = document.createElement('div')
    renderWithDOMNode(MonthlyReportContainer, {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        location: 'Yasa-bonga' // in mock data
      }
    }, node)

    setTimeout(function () {
      let redirect = checkRedirect(defaultProps.dispatch.args)
      assert(!redirect, 'no redirect call was made')

      let success = checkSuccess(defaultProps.dispatch.args)
      assert(success, 'success event dispatched')
      done()
    }, 200)
  })
})
