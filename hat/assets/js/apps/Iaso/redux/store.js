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
import { routerInitialState, routerReducer } from './routerReducer';
import { linksInitialState, linksReducer } from '../domains/links/reducer';
import { usersReducer, usersInitialState } from '../domains/users/reducer';
import {
    orgUnitsTypesInitialState,
    reducer as orgUnitsTypesReducer,
} from '../domains/orgUnits/orgUnitTypes/reducer';
import { localeMiddleware } from '../domains/app/middleware';

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
        routerCustom: routerInitialState,
        links: linksInitialState,
        users: usersInitialState,
        projects: projectsInitialState,
        mappings: mappingsInitialState,
        orgUnitsTypes: orgUnitsTypesInitialState,
    },
    {
        app: appReducer,
        sidebar: sidebarMenuReducer,
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        snackBar: snackBarsReducer,
        routerCustom: routerReducer,
        links: linksReducer,
        users: usersReducer,
        projects: projectsReducer,
        mappings: mappingReducer,
        orgUnitsTypes: orgUnitsTypesReducer,
    },
    [routerMiddleware(storeHistory), thunk, localeMiddleware],
);

storeHistory = syncHistoryWithStore(storeHistory, store);

const history = storeHistory;
const { dispatch } = store;

export { store, history, dispatch };
