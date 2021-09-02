import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

import createStore from './createStore';

import appReducer from '../domains/app/reducer';
import { formsReducer, formsInitialState } from '../domains/forms/reducer';
import {
    orgUnitsReducer,
    orgUnitsInitialState,
} from '../domains/orgUnits/reducer';
import {
    projectsReducer,
    projectsInitialState,
} from '../domains/projects/reducer';
import { mapReducer, mapInitialState } from './mapReducer';
import {
    instancesReducer,
    instancesInitialState,
} from '../domains/instances/reducer';
import {
    mappingReducer,
    mappingsInitialState,
} from '../domains/mappings/reducer';
import {
    sidebarMenuReducer,
    sidebarMenuInitialState,
} from './sidebarMenuReducer';
import { snackBarsInitialState, snackBarsReducer } from './snackBarsReducer';
import { devicesInitialState, devicesReducer } from './devicesReducer';
import { routerInitialState, routerReducer } from './routerReducer';
import { linksInitialState, linksReducer } from '../domains/links/reducer';
import { usersReducer, usersInitialState } from '../domains/users/reducer';
import {
    periodsInitialState,
    periodsReducer,
} from '../domains/periods/reducer';
import {
    groupsInitialState,
    reducer as groupsReducer,
} from '../domains/orgUnits/groups/reducer';
import {
    orgUnitsTypesInitialState,
    reducer as orgUnitsTypesReducer,
} from '../domains/orgUnits/types/reducer';

// TODO pass baseUrl without hardcoding it
let storeHistory = useRouterHistory(createHistory)({
    basename: '/dashboard',
});
// TODO: to check, this initial state argument is probably useless
const store = createStore(
    {
        sidebar: sidebarMenuInitialState,
        forms: formsInitialState,
        orgUnits: orgUnitsInitialState,
        instances: instancesInitialState,
        snackBar: snackBarsInitialState,
        map: mapInitialState,
        devices: devicesInitialState,
        routerCustom: routerInitialState,
        links: linksInitialState,
        users: usersInitialState,
        periods: periodsInitialState,
        projects: projectsInitialState,
        mappings: mappingsInitialState,
        groups: groupsInitialState,
        orgUnitsTypes: orgUnitsTypesInitialState,
    },
    {
        app: appReducer,
        sidebar: sidebarMenuReducer,
        forms: formsReducer,
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        snackBar: snackBarsReducer,
        map: mapReducer,
        devices: devicesReducer,
        routerCustom: routerReducer,
        links: linksReducer,
        users: usersReducer,
        periods: periodsReducer,
        projects: projectsReducer,
        mappings: mappingReducer,
        groups: groupsReducer,
        orgUnitsTypes: orgUnitsTypesReducer,
    },
    [routerMiddleware(storeHistory), thunk],
);
// TODO: see if mutation necessary. If not don't reassign history and initialize history const here
storeHistory = syncHistoryWithStore(storeHistory, store);

const history = storeHistory;
const { dispatch } = store;

export { store, history, dispatch };
