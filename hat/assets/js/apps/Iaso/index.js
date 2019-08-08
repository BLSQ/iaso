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
import { instancesReducer, instancesInitialState } from './redux/instancesReducer';
import { sidebarMenuReducer, sidebarMenuInitialState } from './redux/sidebarMenuReducer';
import { snackBarsInitialState, snackBarsReducer } from '../../redux/snackBarsReducer';

import App from '../App';

import Forms from './pages/Forms';
import Instances from './pages/Instances';
import OrgUnits from './pages/OrgUnits';
import OrgUnitDetail from './pages/OrgUnitDetail';

import SidebarMenu from './components/nav/SidebarMenuComponent';

export default function datasApp(element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const routes = [
        <Route
            path="/forms/date_from/:date_from/date_to/:date_to(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <Forms {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={'/instances/formId/:formId/date_from/:date_from/date_to/:date_to(/formOrder/:formOrder)'
            + '(/formPageSize/:formPageSize)(/formPage/:formPage)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/tab/:tab)'}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <Instances {...props} />
                </Fragment>
            )}
        />,
        <Route
            path="/orgunits/validated/:validated(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <OrgUnits {...props} />
                </Fragment>
            )}
        />,
        <Route
            path={'/orgunits/detail/orgUnitId/:orgUnitId(/validated/:validated)(/orgUnitsOrder/:orgUnitsOrder)'
            + '(/orgUnitsPageSize/:orgUnitsPageSize)(/orgUnitsPage/:orgUnitsPage)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/tab/:tab)'}
            component={props => (
                <Fragment>
                    <SidebarMenu />
                    <OrgUnitDetail {...props} />
                </Fragment>
            )}
        />,
        <Redirect path="/" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/forms" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/instances" to={`/forms/date_from/${dateFrom}/date_to/${dateTo}`} />,
        <Redirect path="/orgunits" to="/orgunits/validated/true" />,
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
    }, {
        load: loadReducer,
        currentUser: currentUserReducer,
        sidebar: sidebarMenuReducer,
        forms: formsReducer,
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        snackBar: snackBarsReducer,
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
