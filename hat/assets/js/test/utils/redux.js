import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { instancesInitialState } from '../../apps/Iaso/domains/instances/reducer';
import { orgUnitsInitialState } from '../../apps/Iaso/domains/orgUnits/reducer';
import { usersInitialState } from '../../apps/Iaso/domains/users/reducer';
import { routerInitialState } from '../../apps/Iaso/redux/routerReducer';
import { sidebarMenuInitialState } from '../../apps/Iaso/redux/sidebarMenuReducer';

import { renderWithIntl } from './intl';

import { renderWithMuiTheme } from './muiTheme';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const getMockedStore = storeObject => mockStore(storeObject);

const initialState = {
    sidebar: sidebarMenuInitialState,
    orgUnits: orgUnitsInitialState,
    instances: instancesInitialState,
    routerCustom: routerInitialState,
    users: usersInitialState,
    app: {
        locale: {
            code: 'en',
            label: 'English version',
        },
    },
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
