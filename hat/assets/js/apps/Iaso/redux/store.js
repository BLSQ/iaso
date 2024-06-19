// import { useRouterHistory } from 'react-router';
// import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
// import { createHistory } from 'history';

import createStore from './createStore';

import {
    instancesInitialState,
    instancesReducer,
} from '../domains/instances/reducer';
import {
    orgUnitsInitialState,
    orgUnitsReducer,
} from '../domains/orgUnits/reducer';
import { usersInitialState, usersReducer } from '../domains/users/reducer';

const store = createStore(
    {
        orgUnits: orgUnitsInitialState,
        instances: instancesInitialState,
        users: usersInitialState,
    },
    {
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        users: usersReducer,
    },
    [
        // routerMiddleware(storeHistory),
        thunk,
    ],
);

const { dispatch } = store;

export { dispatch, store };
