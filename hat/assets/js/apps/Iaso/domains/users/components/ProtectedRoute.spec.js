import { expect } from 'chai';
import React from 'react';
import nock from 'nock';
import {
    renderWithMutableStore,
    mockedStore,
} from '../../../../../test/utils/redux';
import { mockRequest } from '../../../../../test/utils/requests';
import ProtectedRoute from './ProtectedRoute';

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

const stubComponent = () => <div>I am a stub</div>;

const store = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: user },
});
const updatedStore = mockedStore({
    app: { locale: { code: 'fr', label: 'Version française' } },
    users: { current: updatedUser },
});

const localStorageSpy = sinon.spy(localStorage, 'setItem');
const updatedDispatchSpy = sinon.spy(updatedStore, 'dispatch');

const renderComponent = () => {
    component = mount(
        renderWithMutableStore(
            <ProtectedRoute
                component={stubComponent()}
                permission="permission"
                isRootUrl
            />,
            store,
        ),
    );
};

describe.only('ProtectedRoutes', () => {
    beforeEach(() => {
        localStorageSpy.resetHistory();
        updatedDispatchSpy.resetHistory();
        nock.cleanAll();
        nock.abortPendingRequests();
        mockRequest('get', '/api/profiles/me', user);
        renderComponent();
        component.update();
    });
    before(() => {
        // getFromFRStorage = sinon.stub(localStorage, 'getItem');
        // .returns(getItem('fr'));
    });
    it('renders', () => {
        expect(component.exists()).to.equal(true);
    });
    // it('uses the languages option in localstorage if it exists', async () => {});
    it('uses the language option from backend if none exist in localstorage', () => {
        component.setProps({ store: updatedStore });
        component.update();
        expect(updatedDispatchSpy).to.have.been.calledOnce;
        // expcet 2 calls because localStorage is set again by action dispatched
        expect(localStorageSpy).to.have.been.calledTwice;
    });
    // it('uses the browser language as last resort', () => {});
});
