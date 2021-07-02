import { expect } from 'chai';
import React from 'react';
import nock from 'nock';
import { ErrorBoundary, theme } from 'bluesquare-components';
import { MuiThemeProvider } from '@material-ui/core';
import { shallow } from 'enzyme';
import {
    renderWithMutableStore,
    mockedStore,
} from '../../../../../test/utils/redux';
import { mockRequest } from '../../../../../test/utils/requests';
import ProtectedRoute from './ProtectedRoute';
import { redirectTo as redirectToAction } from '../../../routing/actions';
import SidebarMenu from '../../app/components/SidebarMenuComponent';

let component;

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
    ...user,
    language: 'en',
};
const unauthorizedUser = {
    ...user,
    permissions: ['iaso_users'],
    is_superuser: false,
    language: 'en',
};

const makeMockedStore = value =>
    mockedStore({
        app: { locale: { code: 'fr', label: 'Version française' } },
        users: { current: value },
    });

const store = makeMockedStore(user);

const updatedStore = makeMockedStore(updatedUser);

const storeWithUnauthorizedUser = makeMockedStore(unauthorizedUser);

const storeWithNoUser = makeMockedStore(null);

const localStorageSpy = sinon.spy(localStorage, 'setItem');

const updatedDispatchSpy = sinon.spy(updatedStore, 'dispatch');

const unauthorizedDispatchSpy = sinon.spy(
    storeWithUnauthorizedUser,
    'dispatch',
);
const redirectSpy = sinon.spy(redirectToAction);

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

const renderComponent = () => {
    component = shallow(
        renderWithMutableStore(
            <ErrorBoundary>
                <MuiThemeProvider theme={theme}>
                    <ProtectedRoute
                        component={stubComponent()}
                        permission="permission"
                        isRootUrl
                        location={{ location: 'here' }}
                    />
                </MuiThemeProvider>
            </ErrorBoundary>,
            store,
        ),
    );
};

describe('ProtectedRoutes', () => {
    beforeEach(() => {
        localStorageSpy.resetHistory();
        updatedDispatchSpy.resetHistory();
        unauthorizedDispatchSpy.resetHistory();
        redirectSpy.resetHistory();
        nock.cleanAll();
        nock.abortPendingRequests();
        mockRequest('get', '/api/profiles/me', user);
        renderComponent();
        component.update();
    });

    it('renders', () => {
        expect(component.exists()).to.equal(true);
    });
    it('uses the languages option in localstorage if it exists', async () => {
        // updating store to trigger componentDidUpdate
        component.setProps({ store: updatedStore });
        await component.update();
        expect(localStorageSpy).to.not.have.been.called;
    });
    // Passes when not run as part of the test suite
    it.skip('uses the language option from backend if none exist in localstorage', async () => {
        localStorageStub.returns(null);
        component.setProps({ store: updatedStore });
        await component.update();
        expect(updatedDispatchSpy).to.have.been.calledOnce;
        // expect 2 calls because localStorage is set again by action dispatched
        expect(localStorageSpy).to.have.been.calledTwice;
    });
    // Passes when not run as part of the test suite
    it.skip('redirects unauthorized user to first authorized route', async () => {
        // put a value in localStorage to prevent saving language option (which would trigger a second dispatch call)
        localStorageStub.returns('en');
        component.setProps({ store: storeWithUnauthorizedUser });
        await component.update();

        // Spying on dispatch as imported functions cannot be stubbed or spied on
        expect(unauthorizedDispatchSpy).to.have.been.calledOnce;
    });
    it('does not render anything if there is no user', async () => {
        component.setProps({ store: storeWithNoUser });
        await component.update();
        const element = component.find(SidebarMenu).at(0);
        expect(element.exists()).to.equal(false);
    });
});
