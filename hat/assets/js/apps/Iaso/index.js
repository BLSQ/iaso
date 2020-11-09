import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import theme from './utils/theme';

import createStore from './redux/createStore';

import appReducer from './domains/app/reducer';
import { loadReducer } from './redux/load';
import {
    currentUserReducer,
    currentUserInitialState,
} from './redux/currentUserReducer';
import { formsReducer, formsInitialState } from './domains/forms/reducer';
import {
    orgUnitsReducer,
    orgUnitsInitialState,
} from './domains/orgUnits/reducer';
import {
    projectsReducer,
    projectsInitialState,
} from './domains/projects/reducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import {
    instancesReducer,
    instancesInitialState,
} from './domains/instances/reducer';
import {
    mappingReducer,
    mappingsInitialState,
} from './domains/mappings/reducer';
import {
    sidebarMenuReducer,
    sidebarMenuInitialState,
} from './redux/sidebarMenuReducer';
import {
    snackBarsInitialState,
    snackBarsReducer,
} from './redux/snackBarsReducer';
import { devicesInitialState, devicesReducer } from './redux/devicesReducer';
import {
    orgUnitsLevelsInitialState,
    orgUnitsLevelsReducer,
} from './redux/orgUnitsLevelsReducer';
import { routerInitialState, routerReducer } from './redux/routerReducer';
import { linksInitialState, linksReducer } from './domains/links/reducer';
import { usersReducer, usersInitialState } from './domains/users/reducer';
import { periodsInitialState, periodsReducer } from './domains/periods/reducer';
import {
    completenessInitialState,
    reducer as completenessReducer,
} from './domains/completeness/reducer';
import {
    groupsInitialState,
    reducer as groupsReducer,
} from './domains/orgUnits/groups/reducer';
import {
    orgUnitsTypesInitialState,
    reducer as orgUnitsTypesReducer,
} from './domains/orgUnits/types/reducer';

import { getChipColors } from './constants/chipColors';

import App from './domains/app';
import { locationLimitMax } from './domains/orgUnits';

import { routeConfigs, getPath } from './constants/routes';

import { baseUrls } from './constants/urls';

import ProtectedRoute from './domains/users/components/ProtectedRoute';

import * as zoomBar from './components/leaflet/zoom-bar'; // don't delete - needed to override leaflet zoombar

export default function iasoApp(element, baseUrl) {
    let routes = routeConfigs.map(routeConfig => (
        <Route
            path={getPath(routeConfig)}
            component={props => (
                <ProtectedRoute
                    {...props}
                    permission={routeConfig.permission}
                    component={routeConfig.component(props)}
                    isRootUrl={routeConfig.isRootUrl}
                />
            )}
        />
    ));

    routes = routes.concat([
        <Redirect path="/" to={baseUrls.forms} />,
        <Redirect
            path={baseUrls.orgUnits}
            to={`${
                baseUrls.orgUnits
            }/locationLimit/${locationLimitMax}/order/id/pageSize/50/page/1/searchTabIndex/0/searches/[{"validation_status":"all", "color":"${getChipColors(
                0,
            ).replace('#', '')}"}]`}
        />,
        <Redirect
            path={baseUrls.mappings}
            to={`${baseUrls.mappings}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.users}
            to={`${baseUrls.users}/order/user__username/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.groups}
            to={`${baseUrls.groups}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.orgUnitTypes}
            to={`${baseUrls.orgUnitTypes}/order/name/pageSize/20/page/1`}
        />,
    ]);

    let history = useRouterHistory(createHistory)({
        basename: baseUrl,
    });
    // TODO: to check, this initial state argument is probably useless
    const store = createStore(
        {
            load: {},
            currentUser: currentUserInitialState,
            sidebar: sidebarMenuInitialState,
            forms: formsInitialState,
            orgUnits: orgUnitsInitialState,
            instances: instancesInitialState,
            snackBar: snackBarsInitialState,
            map: mapInitialState,
            devices: devicesInitialState,
            orgUnitsLevels: orgUnitsLevelsInitialState,
            routerCustom: routerInitialState,
            links: linksInitialState,
            users: usersInitialState,
            periods: periodsInitialState,
            completeness: completenessInitialState,
            projects: projectsInitialState,
            mappings: mappingsInitialState,
            groups: groupsInitialState,
            orgUnitsTypes: orgUnitsTypesInitialState,
        },
        {
            app: appReducer,
            load: loadReducer,
            currentUser: currentUserReducer,
            sidebar: sidebarMenuReducer,
            forms: formsReducer,
            orgUnits: orgUnitsReducer,
            instances: instancesReducer,
            snackBar: snackBarsReducer,
            map: mapReducer,
            devices: devicesReducer,
            orgUnitsLevels: orgUnitsLevelsReducer,
            routerCustom: routerReducer,
            links: linksReducer,
            users: usersReducer,
            periods: periodsReducer,
            completeness: completenessReducer,
            projects: projectsReducer,
            mappings: mappingReducer,
            groups: groupsReducer,
            orgUnitsTypes: orgUnitsTypesReducer,
        },
        [routerMiddleware(history), thunk],
    );

    history = syncHistoryWithStore(history, store);

    ReactDOM.render(
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <App store={store} routes={routes} history={history} />
        </MuiThemeProvider>,
        element,
    );
}
