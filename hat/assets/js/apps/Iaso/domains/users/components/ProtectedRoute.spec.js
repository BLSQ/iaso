import { expect } from 'chai';
import React from 'react';
import { renderWithStore } from '../../../../../test/utils/redux';
import ProtectedRoute from './ProtectedRoute';

let component;

// const getItem = returnValue => key => {
//     if (key === 'iaso_locale') {
//         return returnValue;
//     }
// };
// let getFromFRStorage;
// const getFromEmptyStorage = sinon
//     .stub(localStorage, 'getItem')
//     .returns(getItem(''));

// const getFromENStorage = sinon
//     .stub(localStorage, 'getItem')
//     .returns(getItem('en'));

// const setInStorage = sinon.spy(localStorage, 'setItem');

const stubComponent = () => <div>I am a stub</div>;

const renderComponent = () => {
    component = mount(
        renderWithStore(
            <ProtectedRoute
                component={stubComponent}
                permission="permission"
                isRootUrl
            />,
            { app: { locale: 'en' } },
        ),
    );
};

describe.only('ProtectedRoutes', () => {
    beforeEach(() => {
        renderComponent();
    });
    before(() => {
        // getFromFRStorage = sinon.stub(localStorage, 'getItem');
        // .returns(getItem('fr'));
    });
    it('renders', () => {
        expect(component.exists()).to.equal(true);
    });
    // it('uses the languages option in localstorage if it exists', async () => {});
    it('uses the language option from backend if none exist in localstorage', () => {});
    // it('uses the browser language as last resort', () => {});
});
