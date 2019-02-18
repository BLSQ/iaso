import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import EpidemiologyPage from './EpidemiologyContainer';
import DatasMonitoringPage from './DatasMonitoringContainer';
import { filtersInitialState, filtersReducer } from '../../redux/filtersRedux';

export default function statsApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `epidemiology/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultPathMonitoring = `datas_monitoring/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="epidemiology/date_from/:date_from/date_to/:date_to(/source/:source)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/coordination_id/:coordination_id)"
            component={EpidemiologyPage}
        />,
        <Route
            path="datas_monitoring/date_from/:date_from/date_to/:date_to(/source/:source)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/coordination_id/:coordination_id)"
            component={DatasMonitoringPage}
        />,
        <Redirect path="/epidemiology" to={defaultPath} />,
        <Redirect path="/datas_monitoring" to={defaultPathMonitoring} />,
    ];

    let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
        basename: baseUrl,
    });
    const store = createStore({
        load: {},
        filters: filtersInitialState,
    }, {
        load: loadReducer,
        filters: filtersReducer,
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
