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
import { patientsReducer, patientsInitialState } from './redux/patients';

import CasesPage from './pages/Cases';
import PatientsPage from './pages/Patients';
import PatientDetailPage from './pages/PatientDetails';
import PatientsDuplicates from './pages/PatientsDuplicates';
import PatientDuplicateDetails from './pages/PatientDuplicateDetails';

export default function datasApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPathRegister = `/register/list/order/last_name/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultPathDuplicates = `/register/duplicates/order/id/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultPathTests = `/tests/order/form_year/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="/tests/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/located/:located)(/test_type/:test_type)"
            component={CasesPage}
        />,
        <Route
            path="/register/list/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)"
            component={PatientsPage}
        />,
        <Route
            path="/register/detail/patient_id/:patient_id/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)"
            component={PatientDetailPage}
        />,
        <Route
            path="/register/duplicates/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)"
            component={PatientsDuplicates}
        />,
        <Route
            path="/register/duplicates/detail/patient_id/:patient_id/patient_id_2/:patient_id_2/duplicate_id/:duplicate_id/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)"
            component={PatientDuplicateDetails}
        />,
        <Redirect path="/register/list" to={defaultPathRegister} />,
        <Redirect path="/tests" to={defaultPathTests} />,
        <Redirect path="/register/duplicates" to={defaultPathDuplicates} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        testsFilters: filtersInitialState,
        patientsFilters: filtersInitialState,
        patients: patientsInitialState,
    }, {
        load: loadReducer,
        testsFilters: filtersReducer,
        patientsFilters: filtersReducer,
        patients: patientsReducer,
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
