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
import DataMonitoringPage from './DataMonitoringContainer';
import ReportsPage from './pages/Reports';
import { filtersInitialState, filtersReducer } from '../../redux/filtersRedux';
import minDateDataMonitoring from './constants';


export default function statsApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateFromMonitoring = minDateDataMonitoring;
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultMonitoringPath = `/date_from/${dateFromMonitoring}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="epidemiology/date_from/:date_from/date_to/:date_to(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/coordination_id/:coordination_id)"
            component={EpidemiologyPage}
        />,
        <Route
            path="data_monitoring/date_from/:date_from/date_to/:date_to"
            component={DataMonitoringPage}
        />,
        <Route
            path="reports/date_from/:date_from/date_to/:date_to(/team_id/:team_id)(/user_id/:user_id)"
            component={ReportsPage}
        />,
        <Redirect path="/epidemiology" to={`epidemiology${defaultPath}`} />,
        <Redirect path="/data_monitoring" to={`data_monitoring${defaultMonitoringPath}`} />,
        <Redirect path="/reports" to={`reports${defaultPath}`} />,
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
