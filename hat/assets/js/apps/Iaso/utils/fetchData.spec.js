/* global describe, it, beforeEach, afterEach */
import assert from 'assert';
import nock from 'nock';
import { createUrl, fetchUrls } from './fetchData';
import { LOAD, LOAD_SUCCESS } from '../redux/load';

function createNockScope(urls) {
    const ns = nock('http://localhost');
    urls.forEach(config => {
        ns.get(new RegExp(`^${config.url}`)).reply(200, config.mock);
    });
    return ns;
}

describe('createUrl', () => {
    it('should create an url', () => {
        const url = createUrl({
            foo: 11,
            bar: 12,
            baz: 'hello',
        });
        assert(url === '/charts/foo/11/bar/12/baz/hello');
    });
});

describe('fetchUrls', () => {
    const urls = [
        { name: 'foo', url: '/api/foo', mock: { foo: true } },
        { name: 'bar', url: '/api/bar', mock: { bar: true } },
    ];
    const params = { test: true };
    const oldParams = { test: false };
    let nockScope = null;

    let actions = null;
    const dispatch = action => {
        actions[action.type] = action.payload || true;
    };

    beforeEach(() => {
        nockScope = createNockScope(urls);
        actions = {};
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should fetch urls', () =>
        fetchUrls(urls, params, oldParams, dispatch).then(() => {
            assert(actions[LOAD], 'Load action has been called');
            assert(actions[LOAD_SUCCESS], 'Success action has been called');
            assert(nockScope.isDone(), 'The urls have been requested');
        }));

    it('should abort when checking the result', () =>
        fetchUrls(urls, params, oldParams, dispatch, () => false).then(() => {
            assert(actions[LOAD], 'Load action has been called');
            assert(
                !actions[LOAD_SUCCESS],
                'Success action has been not called',
            );
            assert(nockScope.isDone(), 'The urls have been requested');
        }));
});
