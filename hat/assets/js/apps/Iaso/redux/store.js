// import { useRouterHistory } from 'react-router';
// import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
// import { createHistory } from 'history';

import createStore from './createStore';

import { localeMiddleware } from '../domains/app/middleware';
import {
    instancesInitialState,
    instancesReducer,
} from '../domains/instances/reducer';
import {
    mappingReducer,
    mappingsInitialState,
} from '../domains/mappings/reducer';
import {
    orgUnitsInitialState,
    orgUnitsReducer,
} from '../domains/orgUnits/reducer';
import { usersInitialState, usersReducer } from '../domains/users/reducer';
import { routerInitialState, routerReducer } from './routerReducer';
import {
    sidebarMenuReducer,
    sidebarMenuInitialState,
    sidebarMenuReducer,
} from './sidebarMenuReducer';

// eslint-disable-next-line react-hooks/rules-of-hooks
// let storeHistory = useRouterHistory(createHistory)({
//     basename: '/dashboard',
// });
// TODO: to check, this initial state argument is probably useless
const store = createStore(
    {
        sidebar: sidebarMenuInitialState,
        orgUnits: orgUnitsInitialState,
        instances: instancesInitialState,
        routerCustom: routerInitialState,
        users: usersInitialState,
    },
    {
        sidebar: sidebarMenuReducer,
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        routerCustom: routerReducer,
        users: usersReducer,
    },
    [
        // routerMiddleware(storeHistory),
        thunk,
        localeMiddleware,
    ],
);

// storeHistory = syncHistoryWithStore(storeHistory, store);

// const history = storeHistory;
const { dispatch } = store;

export {
    // history,
    dispatch,
    store
};

