import React from 'react';
import nock from 'nock';

import {
    mockGetRequestsList,
    mockPostRequest,
} from '../../../../../test/utils/requests';
import { renderWithStore } from '../../../../../test/utils/redux';
import { postRequest } from '../../../libs/Api';

const mock = require('mock-require');

mock('@material-ui/core/Dialog', ({ children }) => <>{children}</>);

const existingCredentials = {
    name: 'Goron',
    login: 'Daruk',
    url: '/api/divinebeast/vahnaboris',
};

const newCredentials = {
    name: 'Rito',
    login: 'Revali',
    url: '/api/divinebeast/vahmedoh',
    password: 'iamastoopidbird',
};

const SOURCE_ID = 1;

const requestWithDefaultCredentials = {
    url: '/api/dhis2ouimporter/',
    body: {
        source_id: SOURCE_ID,
        source_version_number: 1,
        force: false,
        continue_on_error: false,
        validate_status: false,
        dhis_url: existingCredentials.url,
        dhis_login: existingCredentials.login,
        dhis_name: existingCredentials.name,
        dhis_password: null,
    },
};

const requestWithNewCredentials = {
    url: '/api/dhis2ouimporter/',
    body: {
        source_id: SOURCE_ID,
        source_version_number: 2,
        force: false,
        continue_on_error: false,
        validate_status: false,
        dhis_url: newCredentials.url,
        dhis_login: newCredentials.login,
        dhis_name: newCredentials.name,
        dhis_password: newCredentials.password,
    },
};
const defautProps = {
    renderTrigger: () => {},
    titleMessage: { id: 'Title', defaultMessage: 'Title' },
    source_id: SOURCE_ID,
};

describe('AddTaskComponent', () => {
    describe('when it mounts', () => {
        it('mounts correctly', () => {});
        it('bumps the version number', () => {});
        it('displays the source name', () => {});
    });
    // pass credentials in props
    describe('when credentials exist', () => {
        before(() => {
            nock.cleanAll();
            nock.abortPendingRequests();
            mockPostRequest(requestWithDefaultCredentials);
            mockPostRequest(requestWithNewCredentials);
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
