import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import ManagementDevicesPage from './pages/ManagementDevices';
import ManagementDetailsPage from './pages/ManagementDetails';
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
            path="/devices(/order/:order)"
            component={ManagementDevicesPage}
        />,
        <Route
            path="/detail(/coordination_id/:coordination_id)(/type/:type)(/deviceOrder/:deviceOrder)(/teamOrder/:teamOrder)(/deviceId/:deviceId)(/teamId/:teamId)/from/:from/to/:to(/order/:order)(/tab/:tab)"
            component={ManagementDetailsPage}
        />,
        <Route
            path="/teams(/coordination_id/:coordination_id)(/type/:type)(/order/:order)(/pageSize/:pageSize)(/page/:page)"
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
            path="/users(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/institutionId/:institutionId)"
            component={ManagementUsersPage}
        />,
        <Route
            path="/villages(/order/:order)(/pageSize/:pageSize)(/page/:page)(/search/:search)(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)(/village_official/:village_official)(/population/:population)(/unlocated/:unlocated)(/results/:results)"
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
