import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import LocatorComponent from './pages/Locator';
import ListLocatorComponent from './pages/ListLocator';
import { locatorReducer, locatorInitialState } from './redux/locator';
import { caseReducer } from './redux/case';
import { mapReducer, mapInitialState } from './redux/mapReducer';


export default function locator(appConfig, element, baseUrl) {
    const defaultPath = 'list/order/form_number/pageSize/50/page/1';
    const routes = [
        <Route
            path="list/order/:order/pageSize/:pageSize/page/:page"
            component={ListLocatorComponent}
        />,
        <Route
            path="case_id/:case_id(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={LocatorComponent}
        />,
        <Redirect path="*" to={defaultPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });
    const store = createStore({
        kase: {},
        load: {},
        locator: locatorInitialState,
        map: mapInitialState,
    }, {
        load: loadReducer,
        kase: caseReducer,
        locator: locatorReducer,
        map: mapReducer,
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
