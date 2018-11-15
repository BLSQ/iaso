import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';
import { filtersReducer, filtersInitialState } from '../../redux/filtersRedux';

import CasesPage from './pages/cases';
import RegisterPage from './pages/register';

export default function datasApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPathRegister = `/register/order/last_name/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultPathTests = `/tests/order/form_year/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="/tests/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/located/:located)(/test_type/:test_type)"
            component={CasesPage}
        />,
        <Route
            path="/register/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)"
            component={RegisterPage}
        />,
        <Redirect path="/register" to={defaultPathRegister} />,
        <Redirect path="/tests" to={defaultPathTests} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        testsFilters: filtersInitialState,
        patientsFilters: filtersInitialState,
    }, {
        load: loadReducer,
        testsFilters: filtersReducer,
        patientsFilters: filtersReducer,
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
