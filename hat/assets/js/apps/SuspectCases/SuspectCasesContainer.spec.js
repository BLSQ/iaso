/* global describe, it, beforeEach, afterEach */
import assert from 'assert'
import { renderWithStore } from '../../test/utils'
import React from 'react'
import {createStore} from 'redux'
import nock from 'nock'
import sinon from 'sinon'

import { urls, SuspectCasesContainer } from './SuspectCasesContainer'

const appConfig = {
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

/*
 * The SuspectCasesContainer is responsible for loading data
 * for the suspect cases table
 *
 * it has a few behaviors:
 * - load data when mounted
 * - make sure only filter params changing triggers a new data load
 * - emit success/fail events
 *
 */
describe('SuspectCasesContainer Loading Data', () => {
  let reduxStore
  let defaultProps
  let nockScope

  beforeEach(function () {
    defaultProps = {
      config: appConfig,
      suspects: {},
      params: { dateperiod: 'current-month' },
      dispatch: sinon.spy()
    }
    reduxStore = createStore((e) => e, {
      config: appConfig,
      suspects: {},
      download: {}
    })
    nockScope = createNockScope()
  })

  afterEach(function () {
    // always cleanup in case any nocks have been leftover
    nock.cleanAll()
  })

  it('loads data on initialization', () => {
    renderWithStore(
      reduxStore, <SuspectCasesContainer {...defaultProps} />
    )
    assert(nockScope.isDone(), 'The urls have been requested')
  })

  it('loads data when the filter params change', function () {
    const node = document.createElement('div')
    renderWithStore(
      reduxStore, <SuspectCasesContainer {...defaultProps} />, node
    )
    assert(nockScope.isDone(), 'The urls have been requested')

    // we restore the nocks to test if they will be called again
    nockScope = createNockScope()
    assert(nockScope.isDone() === false, 'The fresh nock scope is not done')

    const props2 = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        dateperiod: 'current-trimester'
      }
    }
    renderWithStore(
      reduxStore, <SuspectCasesContainer {...props2} />, node
    )

    assert(nockScope.isDone(), 'The urls have been requested a second time')
    nockScope = createNockScope()

    const props3 = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        dateperiod: 'current-trimester'
      }
    }
    renderWithStore(
      reduxStore, <SuspectCasesContainer {...props3} />, node
    )

    assert(nockScope.isDone() === false, 'The urls have not been requested again')
  })
})
