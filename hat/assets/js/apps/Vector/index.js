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
import VectorSync from './pages/VectorSync';
import { vectorReducer, vectorInitialState } from './redux/vectorReducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { filtersReducer, filtersInitialState } from '../../redux/filtersRedux';

export default function vectorApp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').subtract(3, 'years').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultMapPath = `/map/dateFrom/${dateFrom}/dateTo/${dateTo}/sites/true/tab/map`;
    const defaulSyncPath = `/sync/dateFrom/${dateFrom}/dateTo/${dateTo}/tab/sites`;
    const routes = [
        <Route
            path={'/map/dateFrom/:dateFrom/dateTo/:dateTo(/sites/:sites)' +
            '(/targets/:targets)(/endemicVillages/:endemicVillages)' +
            '(/nonEndemicVillages/:nonEndemicVillages)(/tab/:tab)' +
            '(/sitesPage/:sitesPage)(/sitesPageSize/:sitesPageSize)' +
            '(/trapsPage/:trapsPage)(/trapsPageSize/:trapsPageSize)' +
            '(/targetsPage/:targetsPage)(/targetsPageSize/:targetsPageSize)' +
            '(/orderSites/:orderSites)(/orderTraps/:orderTraps)(/orderTargets/:orderTargets)(/userId/:userId)' +
            '(/habitats/:habitats)(/onlyReferenceTraps/:onlyReferenceTraps)' +
            '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)' +
            '(/onlyIgnoredTraps/:onlyIgnoredTraps)(/onlyIgnoredTargets/:onlyIgnoredTargets)'}
            component={VectorContainer}
        />,
        <Route
            path={'/sync/dateFrom/:dateFrom/dateTo/:dateTo/tab/:tab' +
            '(/sitesPage/:sitesPage)(/sitesPageSize/:sitesPageSize)' +
            '(/targetsPage/:targetsPage)(/targetsPageSize/:targetsPageSize)' +
            '(/orderSites/:orderSites)(/orderTargets/:orderTargets)(/userId/:userId)'}
            component={VectorSync}
        />,
        <Route
            path="/upload"
            component={GpxUpload}
        />,
        <Redirect path="/map" to={defaultMapPath} />,
        <Redirect path="/sync" to={defaulSyncPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        vectors: vectorInitialState,
        map: mapInitialState,
        geoFilters: filtersInitialState,
    }, {
        load: loadReducer,
        vectors: vectorReducer,
        map: mapReducer,
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
