import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';
import { filtersReducer, filtersInitialState } from '../../redux/filters';

import CasesPage from './pages/cases';

export default function datasApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `/cases/order/form_year/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="/cases/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search/:search)(/team_id/:team_id)(/coordination_id/:coordination_id)"
            component={CasesPage}
        />,
        <Redirect path="*" to={defaultPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        cases: filtersInitialState,
    }, {
        load: loadReducer,
        cases: filtersReducer,
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
