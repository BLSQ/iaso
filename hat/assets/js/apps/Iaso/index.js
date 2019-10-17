import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';


import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import theme from './utils/theme';

import createStore from '../../redux/createStore';

import { loadReducer } from '../../redux/load';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { formsReducer, formsInitialState } from './redux/formsReducer';
import { orgUnitsReducer, orgUnitsInitialState } from './redux/orgUnitsReducer';
import { mapReducer, mapInitialState } from './redux/mapReducer';
import { instancesReducer, instancesInitialState } from './redux/instancesReducer';
import { sidebarMenuReducer, sidebarMenuInitialState } from './redux/sidebarMenuReducer';
import { snackBarsInitialState, snackBarsReducer } from '../../redux/snackBarsReducer';
import { devicesInitialState, devicesReducer } from './redux/devicesReducer';
import { orgUnitsLevelsInitialState, orgUnitsLevelsReducer } from './redux/orgUnitsLevelsReducer';
import { routerInitialState, routerReducer } from './redux/routerReducer';
import { linksInitialState, linksReducer } from './redux/linksReducer';
import { profilesInitialState, profilesReducer } from './redux/profilesReducer';

import App from '../App';

import Forms from './pages/Forms';
import Instances from './pages/Instances';
import OrgUnits, { locationLimitMax } from './pages/OrgUnits';
import Links from './pages/Links';
import OrgUnitDetail from './pages/OrgUnitDetail';

import {
    formsPath,
    instancesPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
} from './constants/paths';

import SidebarMenu from './components/nav/SidebarMenuComponent';
import * as zoomBar from '../../components/leaflet/zoom-bar';


export default function datasApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const routes = [
        <Route
            path={formsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <Forms {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={instancesPath}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <Instances {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={orgUnitsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <OrgUnits {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={orgUnitsDetailsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <OrgUnitDetail {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={linksPath}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <Links {...props} />
                </Fragment>
            )}
        />,
        <Redirect path="/" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/forms" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/instances" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/orgunits" to={`/orgunits/validated/true/locationLimit/${locationLimitMax}`} />,
        <Redirect path="/links" to={`/links/date_from/${dateFrom}/date_to/${dateTo}`} />,

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
        profiles: profilesInitialState,
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
        profiles: profilesReducer,
    }, [
        routerMiddleware(history),
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
