import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';


import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import theme from './utils/theme';

import createStore from '../../redux/createStore';

import { loadReducer } from '../../redux/load';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { formsReducer, formsInitialState } from './domains/forms/reducer';
import { orgUnitsReducer, orgUnitsInitialState } from './domains/orgUnits/reducer';
import { projectsReducer, projectsInitialState } from './redux/projectsReducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { instancesReducer, instancesInitialState } from './domains/instances/reducer';
import { mappingReducer, mappingsInitialState } from './domains/mappings/reducer';
import { sidebarMenuReducer, sidebarMenuInitialState } from './redux/sidebarMenuReducer';
import { snackBarsInitialState, snackBarsReducer } from '../../redux/snackBarsReducer';
import { devicesInitialState, devicesReducer } from './redux/devicesReducer';
import { orgUnitsLevelsInitialState, orgUnitsLevelsReducer } from './redux/orgUnitsLevelsReducer';
import { routerInitialState, routerReducer } from './redux/routerReducer';
import { linksInitialState, linksReducer } from './domains/links/reducer';
import { usersReducer, usersInitialState } from './domains/users/reducer';
import { periodsInitialState, periodsReducer } from './domains/periods/reducer';
import { completenessInitialState, reducer as completenessReducer } from './domains/completeness/reducer';
import { getChipColors } from './constants/chipColors';
import PageError from './components/errors/PageError';

import App from '../App';
import { locationLimitMax } from './domains/orgUnits';

import {
    pathsList,
    getPath,
    formsPath,
    mappingsPath,
    orgUnitsPath,
} from './constants/paths';

import { routeMapping } from './constants/routesMappings';

import AuthorizedUser from './domains/users/components/AuthorizedUser';

import * as zoomBar from '../../components/leaflet/zoom-bar'; // don't delete - needed to override leaflet zoombar

const getRouteComponent = (baseUrl, props) => {
    const routeMap = routeMapping.find(r => r.baseUrl === baseUrl);
    if (routeMap) {
        return routeMap.component(props);
    }
    return null;
};


export default function iasoApp(element, baseUrl) {
    let routes = pathsList.map(currentPath => (
        <Route
            path={getPath(currentPath)}
            component={props => (
                <AuthorizedUser
                    {...props}
                    permission={currentPath.permission}
                    component={getRouteComponent(currentPath.baseUrl, props)}
                />
            )}
        />
    ));

    routes = routes.concat([
        <Route
            path="/401"
            component={props => (
                <PageError {...props} errorCode="401" />
            )}
        />,
        <Route
            path="/404"
            component={props => (
                <PageError {...props} errorCode="404" />
            )}
        />,
        <Route
            path="/500"
            component={props => (
                <PageError {...props} errorCode="500" />
            )}
        />,
        <Redirect path="/" to={formsPath.baseUrl} />,
        <Redirect path={orgUnitsPath.baseUrl} to={`${orgUnitsPath.baseUrl}/locationLimit/${locationLimitMax}/searchTabIndex/0/searches/[{"validated":"both", "color":"${getChipColors(0).replace('#', '')}"}]`} />,
        <Redirect path={mappingsPath.baseUrl} to={`${mappingsPath.baseUrl}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`} />,
    ]);

    let history = useRouterHistory(createHistory)({
        basename: baseUrl,
    });
    const store = createStore({
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
    }, {
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
    }, [
        routerMiddleware(history),
        thunk,
    ]);

    history = syncHistoryWithStore(
        history,
        store,
    );

    ReactDOM.render(
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <App
                store={store}
                routes={routes}
                history={history}
            />
        </MuiThemeProvider>,
        element,
    );
}
