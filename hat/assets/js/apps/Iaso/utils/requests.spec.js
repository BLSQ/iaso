import React, { useEffect, useState } from 'react';
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
import { requestHandler, useAPI } from './requests';

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

// credit https://stackoverflow.com/questions/51200626/using-a-settimeout-in-a-async-function
const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

const successfulRequest = async () => {
    await waitFor(100);
    return 'data';
};

const failedRequest = async () => {
    await waitFor(100);
    throw new Error('Hook request failed!');
};

const refValue = { current: true };

const spyRequest = sinon.spy(successfulRequest);
const spyFailedRequest = sinon.spy(failedRequest);

class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        // eslint-disable-next-line no-console
        console.log('BOUNDARY ERROR', error, errorInfo);
    }

    render() {
        return this.props.children;
    }
}

// eslint-disable-next-line react/prop-types
const Component = ({ preventTrigger, additionalDeps, request }) => {
    const [additionalDep, setAdditionalDep] = useState('additionalDep');
    const hookParams =
        preventTrigger || additionalDeps
            ? {
                  preventTrigger: preventTrigger || undefined,
                  additionalDependencies: additionalDeps
                      ? [additionalDep]
                      : undefined,
              }
            : undefined;
    const { data, isLoading, isError } = useAPI(request, hookParams);
    useEffect(() => {
        if (additionalDeps && additionalDep !== 'updatedDep') {
            setAdditionalDep('updatedDep');
        }
    }, [additionalDep]);
    return (
        <ErrorBoundary>
            <ul>
                <li id="data">{data}</li>
                <li id="loading">{isLoading ? 'Loading' : 'Not loading'}</li>
                <li id="error">{isError ? 'Error' : 'No error'}</li>
            </ul>
        </ErrorBoundary>
    );
};

let component;
let refStub;
describe('useAPI', () => {
    describe('default behaviour', () => {
        beforeEach(() => {
            spyRequest.resetHistory();
            component = mount(
                <Component
                    preventTrigger={undefined}
                    additionalDeps={undefined}
                    request={spyRequest}
                />,
            );
        });
        it('makes the request', async () => {
            expect(component.exists()).to.equal(true);
            expect(spyRequest).to.have.been.called;
        });
        it('returns data with correct error state', async () => {
            let dataTag = component.find('#data').at(0);
            let errorTag = component.find('#error').at(0);
            expect(dataTag.props().children).to.equal(null);
            expect(errorTag.props().children).to.equal('No error');
            await waitFor(150);
            component.update();
            dataTag = component.find('#data').at(0);
            errorTag = component.find('#error').at(0);
            expect(dataTag.props().children).to.equal('data');
            expect(errorTag.props().children).to.equal('No error');
        });
        it('returns correct loading state', async () => {
            let loadingTag = component.find('#loading').at(0);
            expect(loadingTag.props().children).to.equal('Loading');
            await waitFor(150);
            component.update();
            loadingTag = component.find('#loading').at(0);
            expect(loadingTag.props().children).to.equal('Not loading');
        });
    });
    describe('when preventTrigger is true', () => {
        before(() => {
            spyRequest.resetHistory();
            component = mount(
                <Component preventTrigger request={spyRequest} />,
            );
        });
        it('does not make the request', () => {
            expect(component.exists()).to.equal(true);
            expect(spyRequest).to.not.have.been.called;
        });
    });
    describe('when additional dependencies are defined', () => {
        before(() => {
            spyRequest.resetHistory();
            component = mount(
                <Component additionalDeps request={spyRequest} />,
            );
        });
        it('makes the request when additional dependencies update', () => {
            expect(component.exists()).to.equal(true);
            expect(spyRequest).to.have.been.calledTwice;
        });
    });
    describe('when request fails', () => {
        before(() => {
            spyRequest.resetHistory();
            component = mount(<Component request={spyFailedRequest} />);
        });
        it('returns correct error state', async () => {
            let dataTag = component.find('#data').at(0);
            let errorTag = component.find('#error').at(0);
            expect(dataTag.props().children).to.equal(null);
            expect(errorTag.props().children).to.equal('No error');
            await waitFor(150);
            component.update();
            dataTag = component.find('#data').at(0);
            errorTag = component.find('#error').at(0);
            expect(dataTag.props().children).to.equal(null);
            expect(errorTag.props().children).to.equal('Error');
        });
    });
    describe('when component unmounts', () => {
        before(() => {
            // useRef needs to be stubbed here, otherwise it will break other tests
            refStub = sinon.stub(React, 'useRef').returns(refValue);
            spyRequest.resetHistory();
            component = mount(<Component request={spyRequest} />);
        });
        it('stops updating its internal state', () => {
            component.unmount();
            expect(refValue.current).to.equal(false);
            refStub.restore();
        });
    });
});
