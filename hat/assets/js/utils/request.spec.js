/* global describe, it */
import assert from 'assert';
import nock from 'nock';
import request from './request';

describe('request', () => {
    it('should do a GET request', () => {
        nock('http://localhost')
            .get('/foo')
            .query({ bar: 11 })
            .reply(200, { ok: true });

        return request([
            ['get', '/foo'],
            ['query', { bar: 11 }],
        ]).then((body) => {
            assert(body.ok, 'GET request should return true');
        });
    });

    it('should do a POST request', () => {
        nock('http://localhost')
            .post('/foo', { foo: 'bar' })
            .reply(200, { ok: true });

        return request([
            ['post', '/foo'],
            ['send', { foo: 'bar' }],
        ]).then((body) => {
            assert(body.ok, 'POST request should return true');
        });
    });
});
