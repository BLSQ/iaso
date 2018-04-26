import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import StatsContainerComponent from './StatsContainer';

export default function statsApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');

    const routes = [
        <Route
            path="charts(/location/:location)(/source/:source)(/date_from/:date_from)(/date_to/:date_to)"
            component={StatsContainerComponent}
        />,
        <Redirect path="*" to={`charts/date_from/${dateFrom}/date_to/${dateTo}`} />,
    ];

    let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        config: {},
        report: {},
    }, {
        config: (state = {}) => state,
        report: loadReducer,
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
