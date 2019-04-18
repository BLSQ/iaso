import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { homeReducer, homeInitialState } from './redux/home';
import App from '../App';

import HomePage from './pages/Home';

export default function datasApp(appConfig, element, baseUrl) {
    const routes = [
        <Route
            path="/"
            component={HomePage}
        />,
        <Redirect path="*" to="/" />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        currentUser: currentUserInitialState,
        home: homeInitialState,
    }, {
        load: loadReducer,
        currentUser: currentUserReducer,
        home: homeReducer,
    }, [
        routerMiddleware(history),
    ]);

    history = syncHistoryWithStore(
        history,
        store,
    );

    ReactDOM.render(
        <App
            store={store}
            routes={routes}
            history={history}
        />,
        element,
    );
}
