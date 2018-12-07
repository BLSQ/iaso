import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import VectorContainer from './VectorContainer';
import GpxUpload from './pages/GpxUpload';
import { vectorReducer, vectorInitialState } from './redux/vectorReducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';

export default function vectorApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `/map/date_from/${dateFrom}/date_to/${dateTo}/sites/true`;
    const routes = [
        <Route
            path="/map/date_from/:date_from/date_to/:date_to(/sites/:sites)(/targets/:targets)(/endemicVillages/:endemicVillages)(/nonEndemicVillages/:nonEndemicVillages)(/tab/:tab)"
            component={VectorContainer}
        />,
        <Route
            path="/upload"
            component={GpxUpload}
        />,
        <Redirect path="*" to={defaultPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        vectors: vectorInitialState,
        map: mapInitialState,
    }, {
        load: loadReducer,
        vectors: vectorReducer,
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
