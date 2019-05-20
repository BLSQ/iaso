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
import ManagementWorkZones from './pages/ManagementWorkZones';
import ManagementPlanningsPage from './pages/ManagementPlannings';
import ManagementUsersPage from './pages/ManagementUsers';
import ManagementVillagesPage from './pages/ManagementVillages';
import { coordinationsReducer, coordinationsInitialState } from './redux/coordinations';
import { teamsReducer, teamsInitialState } from './redux/teams';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { planningsReducer, planningsInitialState } from './redux/plannings';
import { detailsReducer, detailsInitialState } from './redux/details';
import { userReducer, usersInitialState } from './redux/users';
import { villageReducer, villagesInitialState } from './redux/villages';
import { filtersReducer, filtersInitialState } from '../../redux/filtersRedux';
import { devicesReducer, devicesInitialState } from './redux/devices';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';

export default function teamsDevicesApp(appConfig, element, baseUrl) {
    /*
  This creates a default route using the parameters
  in the 'appConfig' object from django showing the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06']
  }
  */

    const routes = [
        <Route
            path="/devices(/order/:order)(/with_tests_devices/:with_tests_devices)(/coordination_id/:coordination_id)(/teams/:teams)(/profile_id/:profile_id)(/back/:back)"
            component={ManagementDevicesPage}
        />,
        <Route
            path="/detail(/deviceId/:deviceId)(/with_tests_devices/:with_tests_devices)(/coordination_id/:coordination_id)(/teams/:teams)(/profile_id/:profile_id)(/type/:type)(/deviceOrder/:deviceOrder)(/teamOrder/:teamOrder)(/teamId/:teamId)/from/:from/to/:to(/order/:order)(/tab/:tab)"
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
            path="/workzones(/order/:order)(/pageSize/:pageSize)(/page/:page)(/planning_id/:planning_id)"
            component={ManagementWorkZones}
        />,
        <Route
            path="/plannings(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={ManagementPlanningsPage}
        />,
        <Route
            path="/users(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/institution_id/:institution_id)(/team_type/:team_type)"
            component={ManagementUsersPage}
        />,
        <Route
            path="/villages(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_official/:village_official)(/village_source/:village_source)(/population/:population)(/unlocated/:unlocated)(/results/:results)"
            component={ManagementVillagesPage}
        />,
        <Redirect path="*" to="/devices" />,
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
        details: detailsInitialState,
        users: usersInitialState,
        villages: villagesInitialState,
        geoFilters: filtersInitialState,
        geoFiltersModale: filtersInitialState,
        devices: devicesInitialState,
        currentUser: currentUserInitialState,
        devicesFilters: filtersInitialState,
    }, {
        config: (state = {}) => state,
        load: loadReducer,
        coordinations: coordinationsReducer,
        teams: teamsReducer,
        plannings: planningsReducer,
        map: mapReducer,
        details: detailsReducer,
        users: userReducer,
        villages: villageReducer,
        geoFilters: filtersReducer,
        geoFiltersModale: filtersReducer,
        devices: devicesReducer,
        currentUser: currentUserReducer,
        devicesFilters: filtersReducer,
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
