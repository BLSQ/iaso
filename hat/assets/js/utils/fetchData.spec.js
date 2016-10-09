/* global describe, it, beforeEach, afterEach */
import assert from 'assert'
import nock from 'nock'
import {createUrl, fetchTaskResult, fetchUrls} from './fetchData'
import { DOWNLOAD, DOWNLOAD_SUCCESS } from '../redux/download'
import { LOAD, LOAD_SUCCESS } from '../redux/load'

function createNockScope (urls) {
  const ns = nock('http://localhost')
  urls.forEach((config) => {
    ns.get(new RegExp(`^${config.url}`)).reply(200, config.mock)
  })
  return ns
}

describe('createUrl', () => {
  it('should create an url', () => {
    const url = createUrl({
      foo: 11,
      bar: 12,
      baz: 'hello'
    })
    assert(url === '/charts/foo/11/bar/12/baz/hello')
  })
})

describe('fetchTaskResult', () => {
  it('should fetch a task result', () => {
    let actions = {}
    const dispatch = (action) => {
      actions[action.type] = action.payload || true
    }

    const ns = nock('http://localhost')
          .post('/api/tasks')
          .reply(200, {url: '/api/tasks/1'})
          .get('/api/tasks/1')
          .reply(200, {url: '/api/tasks/1'})
          .get('/api/tasks/1')
          .reply(200, {done: true, result_url: 'http://localhost/api/taskresults/1'})

    return fetchTaskResult('/api/tasks', {type: 'test'}, dispatch)
      .then(() => {
        assert(actions[DOWNLOAD], 'Download action has been called')
        assert(actions[DOWNLOAD_SUCCESS] === 'http://localhost/api/taskresults/1',
               'Success action has been called')
        assert(ns.isDone(), 'The urls have been requested')
      })
  })
})

describe('fetchUrls', () => {
  const urls = [
    {name: 'foo', url: '/api/foo', mock: {foo: true}},
    {name: 'bar', url: '/api/bar', mock: {bar: true}}
  ]
  const params = {test: true}
  const oldParams = {test: false}
  let nockScope = null

  let actions = null
  const dispatch = (action) => {
    actions[action.type] = action.payload || true
  }

  beforeEach(() => {
    nockScope = createNockScope(urls)
    actions = {}
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('should fetch urls', () => {
    return fetchUrls(urls, params, oldParams, dispatch)
      .then(() => {
        assert(actions[LOAD], 'Load action has been called')
        assert(actions[LOAD_SUCCESS], 'Success action has been called')
        assert(nockScope.isDone(), 'The urls have been requested')
      })
  })

  it('should not fetch urls when params did not change', () => {
    const promise = fetchUrls(urls, params, params, dispatch)
    assert(promise == null, 'No load promise should have been created')
  })

  it('should abort when checking the result', () => {
    return fetchUrls(urls, params, oldParams, dispatch, () => false)
      .then(() => {
        assert(actions[LOAD], 'Load action has been called')
        assert(!actions[LOAD_SUCCESS], 'Success action has been not called')
        assert(nockScope.isDone(), 'The urls have been requested')
      })
  })
})
