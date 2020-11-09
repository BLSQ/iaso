import {
    combineReducers,
    createStore as _createStore,
    applyMiddleware,
    compose,
} from 'redux';
import { routerReducer } from 'react-router-redux';

export default (initialState = {}, reducers = {}, middleWare = []) =>
    _createStore(
        combineReducers(
            Object.assign(
                {
                    routing: routerReducer,
                },
                reducers,
            ),
        ),
        initialState,
        compose(
            applyMiddleware(...middleWare),
            // use devTools extension (or identity function if not available)
            window.devToolsExtension ? window.devToolsExtension() : f => f,
        ),
    );
