import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import ManagementDevicesPage from './pages/ManagementDevices';
import ManagementDetailsPage from './pages/ManagementDetails/ManagementDetails';
import ManagementTeamsPage from './pages/ManagementTeams';
import ManagementCoordinationsPage from './pages/ManagementCoordinations';
import ManagementUsersPage from './pages/ManagementUsers';
import ManagementVillagesPage from './pages/ManagementVillages';
import ManagementLogs from './pages/ManagementLogs';
import ManagementLogsDetails from './pages/ManagementLogsDetails';
import ManagementZonesPage from './pages/ManagementZones';
import ManagementAreasPage from './pages/ManagementAreas';

import { coordinationsReducer, coordinationsInitialState } from './redux/coordinations';
import { teamsReducer, teamsInitialState } from './redux/teams';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { smallMapReducer, smallMapInitialState } from '../../redux/smallMapReducer';
import { planningsReducer, planningsInitialState } from './redux/plannings';
import { detailsReducer, detailsInitialState } from './redux/details';
import { userReducer, usersInitialState } from './redux/users';
import { villageReducer, villagesInitialState } from './redux/villages';
import { zoneReducer, zonesInitialState } from './redux/zones';
import { areaReducer, areasInitialState } from './redux/areas';
import { filtersReducer, filtersInitialState } from '../../redux/filtersRedux';
import { geoReducer, geoInitialState } from '../../redux/geoRedux';
import { devicesReducer, devicesInitialState } from './redux/devices';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { logsReducer, logsInitialState } from '../../redux/logs';
import { snackBarsInitialState, snackBarsReducer } from '../../redux/snackBarsReducer';

export default function teamsDevicesApp(appConfig, element, baseUrl) {
    /*
  This creates a default route using the parameters
  in the 'appConfig' object from django showing the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06']
  }
  */

    const defaultLogsTests = '/logs/order/-created_at/pageSize/50/page/1/';
    const routes = [
        <Route
            path="/devices(/order/:order)(/with_tests_devices/:with_tests_devices)(/coordination_id/:coordination_id)(/teams/:teams)(/profile_id/:profile_id)(/back/:back)"
            component={ManagementDevicesPage}
        />,
        <Route
            path="/detail(/deviceId/:deviceId)(/with_tests_devices/:with_tests_devices)(/coordination_id/:coordination_id)(/teams/:teams)(/profile_id/:profile_id)(/type/:type)(/deviceOrder/:deviceOrder)(/teamOrder/:teamOrder)(/team_type/:team_type)(/teamId/:teamId)/from/:from/to/:to(/order/:order)(/tab/:tab)"
            component={ManagementDetailsPage}
        />,
        <Route
            path="/teams(/coordination_id/:coordination_id)(/type/:type)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/team_type/:team_type)"
            component={ManagementTeamsPage}
        />,
        <Route
            path="/coordinations(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={ManagementCoordinationsPage}
        />,
        <Route
            path="/users(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/institution_id/:institution_id)(/team_type/:team_type)(/active/:active)(/inactive/:inactive)"
            component={ManagementUsersPage}
        />,
        <Route
            path="/villages(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_official/:village_official)(/village_source/:village_source)(/population/:population)(/unlocated/:unlocated)(/results/:results)(/years/:years)(/includeMerged/:includeMerged)"
            component={ManagementVillagesPage}
        />,
        <Route
            path="/logs/order/:order/pageSize/:pageSize/page/:page(/search/:search)(/date_from/:date_from)(/date_to/:date_to)(/userId/:userId)(/back/:back)"
            component={ManagementLogs}
        />,
        <Route
            path="/logs/detail/log_id/:log_id/order/:order/pageSize/:pageSize/page/:page(/search/:search)(/date_from/:date_from)(/userId/:userId)(/date_to/:date_to)"
            component={ManagementLogsDetails}
        />,
        <Route
            path="/zones(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/province_id/:province_id)(/shapes/:shapes)"
            component={ManagementZonesPage}
        />,
        <Route
            path="/areas(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/province_id/:province_id)(/zs_id/:zs_id)(/shapes/:shapes)"
            component={ManagementAreasPage}
        />,
        <Redirect path="/logs" to={defaultLogsTests} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        config: appConfig,
        load: {},
        coordinations: coordinationsInitialState,
        teams: teamsInitialState,
        plannings: planningsInitialState,
        map: mapInitialState,
        smallMap: smallMapInitialState,
        details: detailsInitialState,
        users: usersInitialState,
        zones: zonesInitialState,
        areas: areasInitialState,
        villages: villagesInitialState,
        geoFilters: filtersInitialState,
        geoFiltersModale: geoInitialState,
        devices: devicesInitialState,
        currentUser: currentUserInitialState,
        devicesFilters: filtersInitialState,
        logs: logsInitialState,
        snackBar: snackBarsInitialState,
    }, {
        config: (state = {}) => state,
        load: loadReducer,
        coordinations: coordinationsReducer,
        teams: teamsReducer,
        plannings: planningsReducer,
        map: mapReducer,
        smallMap: smallMapReducer,
        details: detailsReducer,
        users: userReducer,
        zones: zoneReducer,
        areas: areaReducer,
        villages: villageReducer,
        geoFilters: filtersReducer,
        geoFiltersModale: geoReducer,
        devices: devicesReducer,
        currentUser: currentUserReducer,
        devicesFilters: filtersReducer,
        logs: logsReducer,
        snackBar: snackBarsReducer,
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
