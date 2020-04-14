import React, { Fragment } from 'react';
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

import App from '../App';

import Forms from './domains/forms';
import OrgUnits, { locationLimitMax } from './domains/orgUnits';
import Links from './domains/links';
import Runs from './domains/links/Runs';
import OrgUnitDetail from './domains/orgUnits/details';
import Completeness from './domains/completeness';
import Instances from './domains/instances';
import InstanceDetail from './domains/instances/details';
import Mappings from './domains/mappings';
import MappingDetails from './domains/mappings/details';

import {
    formsPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    instanceDetailPath,
    getPath,
} from './constants/paths';

import SidebarMenu from './components/nav/SidebarMenuComponent';
import AuthorizedUser from './domains/users/components/AuthorizedUser';

import * as zoomBar from '../../components/leaflet/zoom-bar'; // don't delete - needed to override leaflet zoombar


export default function iasoApp(element, baseUrl) {
    const routes = [
        <Route
            path={getPath(formsPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Forms {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(mappingsPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Mappings {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(mappingDetailPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <MappingDetails {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(instancesPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Instances {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(instanceDetailPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <InstanceDetail {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(orgUnitsPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <OrgUnits {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(orgUnitsDetailsPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <OrgUnitDetail {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(linksPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Links {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path={getPath(algosPath)}
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Runs {...props} />
                </AuthorizedUser>
            )}
        />,
        <Route
            path="/forms/completeness"
            component={props => (
                <AuthorizedUser {...props}>
                    <SidebarMenu {...props} />
                    <Completeness {...props} />
                </AuthorizedUser>
            )}
        />,

        <Redirect path="/" to={formsPath.baseUrl} />,
        <Redirect path={orgUnitsPath.baseUrl} to={`${orgUnitsPath.baseUrl}/locationLimit/${locationLimitMax}/searchTabIndex/0/searches/[{"validated":"both", "color":"${getChipColors(0).replace('#', '')}"}]`} />,
        <Redirect path={mappingsPath.baseUrl} to={`${mappingsPath.baseUrl}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`} />,
    ];

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
