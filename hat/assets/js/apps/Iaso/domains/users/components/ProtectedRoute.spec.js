import { expect } from 'chai';
import React from 'react';
import nock from 'nock';
import { ErrorBoundary, theme } from 'bluesquare-components';
import { MuiThemeProvider } from '@material-ui/core';
import {
    renderWithMutableStore,
    mockedStore,
} from '../../../../../test/utils/redux';
import { mockRequest } from '../../../../../test/utils/requests';
import ProtectedRoute from './ProtectedRoute';
import { redirectTo as redirectToAction } from '../../../routing/actions';
import SidebarMenu from '../../app/components/SidebarMenuComponent';

let component;
let baseComponent;

const user = {
    id: 40,
    first_name: '',
    user_name: 'son',
    last_name: '',
    email: '',
    permissions: [],
    is_superuser: true,
    org_units: [],
    language: '',
};
const updatedUser = {
    id: 40,
    first_name: '',
    user_name: 'son',
    last_name: '',
    email: '',
    permissions: [],
    is_superuser: true,
    org_units: [],
    language: 'en',
};
const unauthorizedUser = {
    id: 40,
    first_name: '',
    user_name: 'son',
    last_name: '',
    email: '',
    permissions: ['iaso_users'],
    is_superuser: false,
    org_units: [],
    language: 'en',
};

const fakeGetItem = key => {
    if (key === 'iaso_locale') {
        return 'fr';
    }
    return '';
};

const localStorageStub = sinon
    .stub(localStorage, 'getItem')
    .callsFake(fakeGetItem);

const stubComponent = () => <div>I am a stub</div>;

const store = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: user },
});
const updatedStore = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: updatedUser },
});

const storeWithUnauthorizedUser = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: unauthorizedUser },
});

const storeWithNoUser = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: null },
});

const localStorageSpy = sinon.spy(localStorage, 'setItem');
const updatedDispatchSpy = sinon.spy(updatedStore, 'dispatch');
const unauthorizedDispatchSpy = sinon.spy(
    storeWithUnauthorizedUser,
    'dispatch',
);
const redirectSpy = sinon.spy(redirectToAction);
// const userHasPermissionSpy = sinon.spy(userHasPermission);
// const getFirstAllowedUrlSpy = sinon.spy(getFirstAllowedUrl);

// const getFirstAllowedUrlStub = sinon
//     .stub({ getFirstAllowedUrl }, 'getFirstAllowedUrl')
//     .returns(true);

// const userHasPermissionStub = sinon
//     .stub({ userHasPermission }, 'userHasPermission')
//     .returns(false);

const renderComponent = () => {
    baseComponent = (
        <ProtectedRoute
            component={stubComponent()}
            permission="permission"
            isRootUrl
        />
    );
    component = mount(
        renderWithMutableStore(
            <ErrorBoundary>
                <MuiThemeProvider theme={theme}>
                    {baseComponent}
                </MuiThemeProvider>
            </ErrorBoundary>,
            store,
        ),
    );
};

describe.only('ProtectedRoutes', () => {
    beforeEach(() => {
        localStorageSpy.resetHistory();
        updatedDispatchSpy.resetHistory();
        redirectSpy.resetHistory();
        // getFirstAllowedUrlStub.resetHistory();
        nock.cleanAll();
        nock.abortPendingRequests();
        mockRequest('get', '/api/profiles/me', user);
        renderComponent();
        component.update();
    });

    it('renders', () => {
        expect(component.exists()).to.equal(true);
    });
    it('uses the languages option in localstorage if it exists', () => {
        component.setProps({ store: updatedStore });
        component.update();
        // expect(updatedDispatchSpy).to.not.have.been.called;
        expect(localStorageSpy).to.not.have.been.called;
    });
    it('uses the language option from backend if none exist in localstorage', () => {
        localStorageStub.returns(null);
        component.setProps({ store: updatedStore });
        component.update();
        expect(updatedDispatchSpy).to.have.been.calledOnce;
        // expect 2 calls because localStorage is set again by action dispatched
        expect(localStorageSpy).to.have.been.calledTwice;
    });
    it('redirects unauthorized user to first authorized route', () => {
        // put a value in localStorage to prevent saving language option (which would trigger a second dispatch call)
        localStorageStub.returns('en');
        component.setProps({ store: storeWithUnauthorizedUser });
        component.update();
        // expect(userHasPermissionSpy).to.have.been.calledOnce;
        // expect(getFirstAllowedUrlSpy).to.have.been.calledOnce;
        // expect(redirectSpy).to.have.been.calledOnce;
        // Spying on dispatch as imported functions cannot be stubbed or spied on
        expect(unauthorizedDispatchSpy).to.have.been.calledOnce;
    });
    it('does not render anything if there is no user', () => {
        component.setProps({ store: storeWithNoUser });
        component.update();
        const element = component.find(SidebarMenu).at(0);
        expect(element.exists()).to.equal(false);
    });
});
