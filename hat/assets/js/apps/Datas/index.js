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
import { casesReducer, casesInitialState } from './redux/cases';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';

import CasesPage from './pages/Cases';
import PatientsPage from './pages/Patients';
import PatientDetailPage from './pages/PatientDetails';
import PatientsDuplicates from './pages/PatientsDuplicates';
import PatientDuplicateDetails from './pages/PatientDuplicateDetails';
import MonitoringPAge from './pages/Monitoring';

export default function datasApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPathRegister = '/register/list/order/last_name/pageSize/50/page/1';
    const defaultPathDuplicates = '/register/duplicates/order/id/pageSize/50/page/1';
    const defaultPathTests = `/tests/order/form_year/pageSize/50/page/1/date_from/${dateFrom}/date_to/${dateTo}`;
    const defaultMonitoringPath = `/monitoring/screenerOrder/tester__user__last_name/confirmerOrder/tester__user__last_name/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path={'/tests/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to' +
            '(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)' +
            '(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_mother_name/:search_mother_name)' +
            '(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/screening_type/:screening_type)(/back/:back)' +
            '(/located/:located)(/test_type/:test_type)(/tester_type/:tester_type)(/device_id/:device_id)(/pictures/:pictures)(/videos/:videos)(/anonymous/:anonymous)'}
            component={CasesPage}
        />,
        <Route
            path={'/tests/detail/patient_id/:patient_id/case_id/:case_id/order/:order/pageSize/:pageSize/page/:page/date_from/:date_from/date_to/:date_to' +
            '(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)' +
            '(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_mother_name/:search_mother_name)' +
            '(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/screening_type/:screening_type)' +
            '(/located/:located)(/test_type/:test_type)(/tester_type/:tester_type)(/prov_id/:prov_id)' +
            '(/ZS_id/:ZS_id)(/AS_id/:AS_id)(/vil_id/:vil_id)(/device_id/:device_id)(/pictures/:pictures)' +
            '(/videos/:videos)(/tab/:tab)(/anonymous/:anonymous)'}
            component={PatientDetailPage}
        />,
        <Route
            path={'/register/list/order/:order/pageSize/:pageSize/page/:page(/date_from/:date_from)(/date_to/:date_to)(/workzone_id/:workzone_id)' +
            '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)' +
            '(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)' +
            '(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)' +
            '(/test_type/:test_type)(/only_dupes/:only_dupes)(/treatment_medicine/:treatment_medicine)(/with_treatment/:with_treatment)(/dead/:dead)(/tester_type/:tester_type)' +
            '(/device_id/:device_id)(/pictures/:pictures)(/videos/:videos)(/anonymous/:anonymous)(/screening_type/:screening_type)(/back/:back)'}
            component={PatientsPage}
        />,
        <Route
            path={'/register/detail/patient_id/:patient_id/order/:order/pageSize/:pageSize/page/:page(/date_from/:date_from)(/date_to/:date_to)' +
            '(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)' +
            '(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)(/search_prename/:search_prename)' +
            '(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)(/test_type/:test_type)(/only_dupes/:only_dupes)' +
            '(/treatment_medicine/:treatment_medicine)(/with_treatment/:with_treatment)(/dead/:dead)(/tester_type/:tester_type)(/tab/:tab)(/screening_type/:screening_type)' +
            '(/prov_id/:prov_id)(/ZS_id/:ZS_id)(/AS_id/:AS_id)(/vil_id/:vil_id)(/device_id/:device_id)(/pictures/:pictures)(/videos/:videos)(/anonymous/:anonymous)'}
            component={PatientDetailPage}
        />,
        <Route
            path={'/register/duplicates/order/:order/pageSize/:pageSize/page/:page(/date_from/:date_from)(/date_to/:date_to)(/workzone_id/:workzone_id)' +
            '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_id/:village_id)(/screening_result/:screening_result)' +
            '(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)' +
            '(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)' +
            '(/search_mother_name/:search_mother_name)(/test_type/:test_type)(/back/:back)'}
            component={PatientsDuplicates}
        />,
        <Route
            path={'/register/duplicates/detail/patient_id/:patient_id/patient_id_2/:patient_id_2/duplicate_id/:duplicate_id/(order/:order)(/pageSize/:pageSize)' +
            '/page/:page(/date_from/:date_from)(/date_to/:date_to)(/workzone_id/:workzone_id)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)' +
            '(/village_id/:village_id)(/screening_result/:screening_result)(/confirmation_result/:confirmation_result)(/source/:source)(/search_name/:search_name)' +
            '(/search_prename/:search_prename)(/search_lastname/:search_lastname)(/teams/:teams)(/coordination_id/:coordination_id)(/search_mother_name/:search_mother_name)' +
            '(/test_type/:test_type)(/manual_merge/:manual_merge)'}
            component={PatientDuplicateDetails}
        />,
        <Route
            path="/monitoring/screenerOrder/:screenerOrder/confirmerOrder/:confirmerOrder/date_from/:date_from/date_to/:date_to(/tab/:tab)"
            component={MonitoringPAge}
        />,
        <Redirect path="/register/list" to={defaultPathRegister} />,
        <Redirect path="/tests" to={defaultPathTests} />,
        <Redirect path="/register/duplicates" to={defaultPathDuplicates} />,
        <Redirect path="/monitoring" to={defaultMonitoringPath} />,
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
        cases: casesInitialState,
        map: mapInitialState,
        currentUser: currentUserInitialState,
        geoFilters: filtersInitialState,
    }, {
        load: loadReducer,
        testsFilters: filtersReducer,
        patientsFilters: filtersReducer,
        patients: patientsReducer,
        cases: casesReducer,
        map: mapReducer,
        currentUser: currentUserReducer,
        geoFilters: filtersReducer,
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
