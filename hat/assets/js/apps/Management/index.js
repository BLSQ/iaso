import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import ManagementDevicesPage from './pages/ManagementDevices';
import ManagementTeamsPage from './pages/ManagementTeams';
import ManagementCoordinationsPage from './pages/ManagementCoordinations';
import ManagementPlanningsPage from './pages/ManagementPlannings';
import { coordinationsReducer, coordinationsInitialState } from './redux/coordinations';
import { teamsReducer, teamsInitialState } from './redux/teams';

export default function teamsDevicesApp(appConfig, element, baseUrl) {
    /*
  This creates a default route using the parameters
  in the 'appConfig' object from django showing the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06']
  }
  */
    const defaultRoute = (config) => {
        if (config.dates.length) {
            const latestMonth = config.dates.slice(-1).pop();
            return `/devices/date_month/${latestMonth}`;
        }
        return '/devices';
    };

    const routes = [
        <Route
            path="/devices(/location/:location)(/date_month/:date_month)"
            component={ManagementDevicesPage}
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
            path="/plannings(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={ManagementPlanningsPage}
        />,
        <Redirect path="*" to={defaultRoute(appConfig)} />,
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
    }, {
        config: (state = {}) => state,
        load: loadReducer,
        coordinations: coordinationsReducer,
        teams: teamsReducer,
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
