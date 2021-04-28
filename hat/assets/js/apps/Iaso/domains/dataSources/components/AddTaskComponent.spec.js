import React from 'react';
import nock from 'nock';

import { mockGetRequestsList } from '../../../../../test/utils/requests';
import { renderWithStore } from '../../../../../test/utils/redux';

const mock = require('mock-require');

mock('@material-ui/core/Dialog', ({ children }) => <>{children}</>);

const existingCredentials = {
    name: 'Goron',
    login: 'Daruk',
    url: '/api/divinebeast/vahnaboris',
};

describe('AddTaskComponent', () => {
    describe('when credentials exist', () => {
        before(() => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockGetRequestsList(requests);
        });
        it('uses existing credentials by default', () => {});
        it('displays necessary fields when unselecting defaults', () => {});
        it("displays existing credentials in the form's fields", () => {});
    });
    describe("when credentials don't exist", () => {
        it('displays necessary fields', () => {});
        it('does not offer option to use existing credentials', () => {});
    });
    describe('when user fills in custom credentials', () => {
        it('does not allow submitting if a field is empty', () => {});
    });
    describe("when user clicks 'Launch'", () => {
        it('submits the form', () => {});
        it('closes the modal', () => {});
        it('displays snack bar', () => {});
    });
    describe("when user clicks 'Launch and go to task", () => {
        it('submits the form', () => {});
        it('closes the modal', () => {});
        it('displays snack bar', () => {});
        it('redirects to tasks page', () => {});
    });
    describe("when user clicks 'Cancel'", () => {
        it('resets all field values', () => {});
    });
    describe('when the API return an error', () => {
        it('closes the modal', () => {});
        it('displays an error snack bar', () => {});
    });
});
