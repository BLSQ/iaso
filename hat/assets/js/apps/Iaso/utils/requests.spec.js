import React, { useCallback } from 'react';
import { expect } from 'chai';
import nock from 'nock';

import sinon from 'sinon';
import { mockRequest, mockRequestError } from '../../../test/utils/requests';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
    restoreRequest,
} from '../libs/Api';
import { requestHandler } from './requests';

const URL = '/api/test';
const FAIL_URL = '/api/fail';
const BODY = { data: 'request' };
const FILE_DATA = {};
const DISPATCH = sinon.spy();
const ERROR_KEY_MESSAGE = 'error key  message';
const CONSOLE_ERROR = 'console error';
const RESPONSE = { data: 'result', status: 200, errors: null };
const API_ERROR_MESSAGE = 'Page not found';

const response = requestType => {
    if (requestType === 'delete' || requestType === 'restore') return true;
    return RESPONSE;
};

const cleanup = () => {
    nock.cleanAll();
    nock.abortPendingRequests();
    DISPATCH.resetHistory();
};

const sendFailingRequest = async requestMaker => {
    try {
        return await requestMaker(FAIL_URL);
    } catch (e) {
        return e;
    }
};

const makeRequest = (requestType, disableSnackBar) => async url => {
    switch (requestType) {
        case 'get':
            return requestHandler(DISPATCH)(getRequest)({
                requestParams: { url },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        case 'post':
            return requestHandler(DISPATCH)(postRequest)({
                requestParams: { url, body: BODY },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        case 'put':
            return requestHandler(DISPATCH)(putRequest)({
                requestParams: { url, body: BODY },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        case 'patch':
            return requestHandler(DISPATCH)(patchRequest)({
                requestParams: { url, body: BODY },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        case 'delete':
            return requestHandler(DISPATCH)(deleteRequest)({
                requestParams: { url },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        case 'restore':
            return requestHandler(DISPATCH)(restoreRequest)({
                requestParams: { url },
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                disableSuccessSnackBar: disableSnackBar,
            });
        default:
            throw new Error(
                "unknown request type. Should be: 'get', 'post','put','patch'or 'delete'",
            );
    }
};

const makePostRequestWithFileData = disableSnackBar => async url =>
    requestHandler(DISPATCH)(postRequest)({
        requestParams: { url, body: BODY, fileData: FILE_DATA },
        errorKeyMessage: ERROR_KEY_MESSAGE,
        consoleError: CONSOLE_ERROR,
        disableSuccessSnackBar: disableSnackBar,
    });

const testRequestOfType = requestType => () => {
    beforeEach(() => {
        cleanup();
    });
    describe('when request is successful', () => {
        beforeEach(() => {
            mockRequest(requestType, URL, [response(requestType)]);
        });
        it('returns response body', async () => {
            const result = await makeRequest(requestType)(URL);
            if (Array.isArray(result)) {
                expect(result[0]).to.deep.equal(response(requestType));
            } else {
                expect(result).to.deep.equal(response(requestType));
            }
        });
        it('displays bar', async () => {
            await makeRequest(requestType)(URL);
            expect(DISPATCH).to.have.been.calledOnce;
        });
        it('does not display bar if option is toggled off', async () => {
            await makeRequest(requestType, true)(URL);
            expect(DISPATCH).not.to.have.been.called;
        });
    });
    describe('when request fails', () => {
        beforeEach(() => {
            mockRequestError(requestType, FAIL_URL, API_ERROR_MESSAGE);
        });
        it('throws error', async () => {
            const error = await sendFailingRequest(makeRequest(requestType));
            expect(error.message).to.equal(API_ERROR_MESSAGE);
        });
        it('displays snack bar', async () => {
            await sendFailingRequest(makeRequest(requestType));
            expect(DISPATCH).to.have.been.calledOnce;
        });
    });
};

describe('getRequestHandler', testRequestOfType('get'));
describe('postRequestHandler', testRequestOfType('post'));
describe('putRequestHandler', testRequestOfType('put'));
describe('patchRequestHandler', testRequestOfType('patch'));
describe('deleteRequestHandler', testRequestOfType('delete'));
describe('restoreRequestHandler', testRequestOfType('restore'));
