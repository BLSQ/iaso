import React from 'react';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Link } from 'react-router';
import { LinkProvider } from 'bluesquare-components';

import { orgUnitsInitialState } from '../../apps/Iaso/domains/orgUnits/reducer';
import { instancesInitialState } from '../../apps/Iaso/domains/instances/reducer';
import { mappingsInitialState } from '../../apps/Iaso/domains/mappings/reducer';
import { sidebarMenuInitialState } from '../../apps/Iaso/redux/sidebarMenuReducer';
import { snackBarsInitialState } from '../../apps/Iaso/redux/snackBarsReducer';
import { routerInitialState } from '../../apps/Iaso/redux/routerReducer';
import { linksInitialState } from '../../apps/Iaso/domains/links/reducer';
import { usersInitialState } from '../../apps/Iaso/domains/users/reducer';

import { renderWithIntl } from './intl';

import { renderWithMuiTheme } from './muiTheme';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const getMockedStore = storeObject => mockStore(storeObject);

const initialState = {
    sidebar: sidebarMenuInitialState,
    orgUnits: orgUnitsInitialState,
    instances: instancesInitialState,
    snackBar: snackBarsInitialState,
    routerCustom: routerInitialState,
    links: linksInitialState,
    users: usersInitialState,
    mappings: mappingsInitialState,
};

export const renderWithStore = (component, state = null) => (
    <Provider store={getMockedStore({ ...initialState, ...state })}>
        <LinkProvider linkComponent={Link}>
            {renderWithMuiTheme(renderWithIntl(component))}
        </LinkProvider>
    </Provider>
);

export const mockedStore = state =>
    getMockedStore({ ...initialState, ...state });

export const renderWithMutableStore = (component, store) => (
    <Provider store={store}>
        <LinkProvider linkComponent={Link}>
            {renderWithIntl(component)}
        </LinkProvider>
    </Provider>
);
