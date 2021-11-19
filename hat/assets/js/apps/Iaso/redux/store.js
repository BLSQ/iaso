import { useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

import createStore from './createStore';

import appReducer from '../domains/app/reducer';
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
import { localeMiddleware } from '../domains/app/middleware';

// TODO pass baseUrl without hardcoding it
// eslint-disable-next-line react-hooks/rules-of-hooks
let storeHistory = useRouterHistory(createHistory)({
    basename: '/dashboard',
});
// TODO: to check, this initial state argument is probably useless
const store = createStore(
    {
        sidebar: sidebarMenuInitialState,
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
    [routerMiddleware(storeHistory), thunk, localeMiddleware],
);
// TODO: see if mutation necessary. If not don't reassign history and initialize history const here
storeHistory = syncHistoryWithStore(storeHistory, store);

const history = storeHistory;
const { dispatch } = store;

export { store, history, dispatch };
