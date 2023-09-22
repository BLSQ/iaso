import {
    combineReducers,
    createStore as _createStore,
    applyMiddleware,
    compose,
} from 'redux';
import { routerReducer } from 'react-router-redux';

const createReducer = (appReducers, pluginReducers) => {
    return combineReducers({
        routing: routerReducer,
        ...appReducers,
        ...pluginReducers,
    });
};

export default (initialState = {}, reducers = {}, middleWare = []) => {
    const store = _createStore(
        createReducer(reducers),
        initialState,
        compose(
            applyMiddleware(...middleWare),
            window.__REDUX_DEVTOOLS_EXTENSION__
                ? window.__REDUX_DEVTOOLS_EXTENSION__()
                : f => f,
        ),
    );
    store.pluginReducers = {};
    store.injectReducer = (key, pluginReducer) => {
        store.pluginReducers[key] = pluginReducer;
        store.replaceReducer(createReducer(reducers, store.pluginReducers));
    };
    return store;
};
