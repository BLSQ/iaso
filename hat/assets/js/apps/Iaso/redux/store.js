// import { useRouterHistory } from 'react-router';
// import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
// import { createHistory } from 'history';

import createStore from './createStore';

import {
    instancesInitialState,
    instancesReducer,
} from '../domains/instances/reducer';

const store = createStore(
    {
        instances: instancesInitialState,
    },
    {
        instances: instancesReducer,
    },
    [
        // routerMiddleware(storeHistory),
        thunk,
    ],
);

const { dispatch } = store;

export { dispatch, store };
