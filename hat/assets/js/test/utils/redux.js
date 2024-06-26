import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { instancesInitialState } from '../../apps/Iaso/domains/instances/reducer';
import { orgUnitsInitialState } from '../../apps/Iaso/domains/orgUnits/reducer';

import { renderWithIntl } from './intl';

import { renderWithMuiTheme } from './muiTheme';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const getMockedStore = storeObject => mockStore(storeObject);

const initialState = {
    orgUnits: orgUnitsInitialState,
    instances: instancesInitialState,
};

export const renderWithStore = (component, state = null) => (
    <Provider store={getMockedStore({ ...initialState, ...state })}>
        {renderWithMuiTheme(renderWithIntl(component))}
    </Provider>
);

export const mockedStore = state =>
    getMockedStore({ ...initialState, ...state });

export const renderWithMutableStore = (component, store) => (
    <Provider store={store}>{renderWithIntl(component)}</Provider>
);
