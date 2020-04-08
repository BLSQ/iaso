import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';
import moment from 'moment';


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
import { profilesInitialState, profilesReducer } from './redux/profilesReducer';
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
import MappingDetails from './domains/mappings/details'

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
} from './constants/paths';

import SidebarMenu from './components/nav/SidebarMenuComponent';
import * as zoomBar from '../../components/leaflet/zoom-bar'; // don't delete - needed to override leaflet zoombar


export default function iasoApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');

    const routes = [
        <Route
            path={formsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Forms {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={mappingsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Mappings {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={mappingDetailPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <MappingDetails {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={instancesPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Instances {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={instanceDetailPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <InstanceDetail {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={orgUnitsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <OrgUnits {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={orgUnitsDetailsPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <OrgUnitDetail {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={linksPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Links {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={algosPath}
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Runs {...props} />
                </Fragment>
            )}
        />,
        <Route
            path="completeness"
            component={props => (
                <Fragment>
                    <SidebarMenu {...props} />
                    <Completeness {...props} />
                </Fragment>
            )}
        />,

        <Redirect path="/" to="/forms" />,
        <Redirect path="/instances" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/orgunits" to={`/orgunits/locationLimit/${locationLimitMax}/searchTabIndex/0/searches/[{"validated":"both", "color":"${getChipColors(0).replace('#', '')}"}]`} />,
        <Redirect path="/links/list" to="/links/list" />,
        <Redirect path="/settings/mappings" to="/settings/mappings/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1" />,
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
        profiles: profilesReducer,
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
