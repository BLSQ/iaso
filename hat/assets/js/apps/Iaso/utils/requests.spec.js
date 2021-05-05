import { expect } from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import { mockRequest, mockRequestError } from '../../../test/utils/requests';
import {
    deleteRequestHandler,
    getRequestHandler,
    patchRequestHandler,
    postRequestHandler,
    putRequestHandler,
    restoreRequestHandler,
} from './requests';

const URL = '/api/test';
const FAIL_URL = '/api/fail';
// TODO regroup constant parameters to allow use of spread and save space
const dispatch = sinon.spy();
const ERROR_KEY_MESSAGE = 'error key  message';
const CONSOLE_ERROR = 'console error';
const RESPONSE = { data: 'result', status: 200, errors: null };
const BODY = { data: 'request' };
const FILE_DATA = {};
const API_ERROR_MESSAGE = 'Page not found';

const response = requestType => {
    if (requestType === 'delete' || requestType === 'restore') return true;
    return RESPONSE;
};

const cleanup = () => {
    nock.cleanAll();
    nock.abortPendingRequests();
    dispatch.resetHistory();
};

const sendFailingRequest = async requestMaker => {
    try {
        return await requestMaker(FAIL_URL);
    } catch (e) {
        return e;
    }
};

// TODO type requestType
const makeRequest = requestType => async url => {
    switch (requestType) {
        case 'get':
            return getRequestHandler({
                url,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        case 'post':
            return postRequestHandler({
                url,
                body: BODY,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        case 'put':
            return putRequestHandler({
                url,
                body: BODY,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        case 'patch':
            return patchRequestHandler({
                url,
                body: BODY,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        case 'delete':
            return deleteRequestHandler({
                url,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        case 'restore':
            return restoreRequestHandler({
                url,
                errorKeyMessage: ERROR_KEY_MESSAGE,
                consoleError: CONSOLE_ERROR,
                dispatch,
            });
        default:
            throw new Error(
                "unknown request type. Should be: 'get', 'post','put','patch'or 'delete'",
            );
    }
};

const makePostRequestWithFileData = async url =>
    postRequestHandler({
        url,
        body: BODY,
        errorKeyMessage: ERROR_KEY_MESSAGE,
        consoleError: CONSOLE_ERROR,
        fileData: FILE_DATA,
        dispatch,
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
            // TODO make request generator
            await makeRequest(requestType)(URL);
            expect(dispatch).to.have.been.called;
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
            expect(dispatch).to.have.been.called;
        });
    });
};

describe.only('getRequestHandler', testRequestOfType('get'));
describe.only('postRequestHandler', testRequestOfType('post'));
describe.only('putRequestHandler', testRequestOfType('put'));
describe.only('patchRequestHandler', testRequestOfType('patch'));
describe.only('deleteRequestHandler', testRequestOfType('delete'));
describe.only('restoreRequestHandler', testRequestOfType('restore'));
