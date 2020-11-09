import React from 'react';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { currentUserInitialState } from '../../apps/Iaso/redux/currentUserReducer';
import { formsInitialState } from '../../apps/Iaso/domains/forms/reducer';
import { orgUnitsInitialState } from '../../apps/Iaso/domains/orgUnits/reducer';
import { projectsInitialState } from '../../apps/Iaso/domains/projects/reducer';
import { mapInitialState } from '../../apps/Iaso/redux/mapReducer';
import { instancesInitialState } from '../../apps/Iaso/domains/instances/reducer';
import { mappingsInitialState } from '../../apps/Iaso/domains/mappings/reducer';
import { sidebarMenuInitialState } from '../../apps/Iaso/redux/sidebarMenuReducer';
import { snackBarsInitialState } from '../../apps/Iaso/redux/snackBarsReducer';
import { devicesInitialState } from '../../apps/Iaso/redux/devicesReducer';
import { orgUnitsLevelsInitialState } from '../../apps/Iaso/redux/orgUnitsLevelsReducer';
import { routerInitialState } from '../../apps/Iaso/redux/routerReducer';
import { linksInitialState } from '../../apps/Iaso/domains/links/reducer';
import { usersInitialState } from '../../apps/Iaso/domains/users/reducer';
import { periodsInitialState } from '../../apps/Iaso/domains/periods/reducer';
import { completenessInitialState } from '../../apps/Iaso/domains/completeness/reducer';
import { groupsInitialState } from '../../apps/Iaso/domains/orgUnits/groups/reducer';
import { orgUnitsTypesInitialState } from '../../apps/Iaso/domains/orgUnits/types/reducer';

import { renderWithIntl } from './intl';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const getMockedStore = storeObject => mockStore(storeObject);

const initialState = {
    load: {},
    currentUser: currentUserInitialState,
    sidebar: sidebarMenuInitialState,
    forms: formsInitialState,
    orgUnits: orgUnitsInitialState,
    instances: instancesInitialState,
    snackBar: snackBarsInitialState,
    map: mapInitialState,
    devices: devicesInitialState,
    orgUnitsLevels: orgUnitsLevelsInitialState,
    routerCustom: routerInitialState,
    links: linksInitialState,
    users: usersInitialState,
    periods: periodsInitialState,
    completeness: completenessInitialState,
    projects: projectsInitialState,
    mappings: mappingsInitialState,
    groups: groupsInitialState,
    orgUnitsTypes: orgUnitsTypesInitialState,
};

export const renderWithStore = (component, state = null) => (
    <Provider store={getMockedStore({ ...initialState, ...state })}>
        {renderWithIntl(component)}
    </Provider>
);
