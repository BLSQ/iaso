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
import { vectorReducer, vectorInitialState } from './redux/vectorReducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';

export default function vectorApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="/date_from/:date_from/date_to/:date_to(/zs_id/:zs_id)"
            component={VectorContainer}
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
