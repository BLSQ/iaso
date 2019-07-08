import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';


import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import theme from './utils/theme';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { formsReducer, formsInitialState } from './redux/formsReducer';
import { instancesReducer, instancesInitialState } from './redux/instancesReducer';

import App from '../App';

import Forms from './pages/Forms';
import Instances from './pages/Instances';

export default function datasApp(element, baseUrl) {
    const routes = [
        <Route
            path="/forms(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={Forms}
        />,
        <Route
            path="/instances/formId/:formId(/order/:order)(/pageSize/:pageSize)(/page/:page)(/tab/:tab)"
            component={Instances}
        />,
        <Redirect path="*" to="/forms" />,
    ];

    let history = useRouterHistory(createHistory)({
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
        currentUser: currentUserInitialState,
        forms: formsInitialState,
        instances: instancesInitialState,
    }, {
        load: loadReducer,
        currentUser: currentUserReducer,
        forms: formsReducer,
        instances: instancesReducer,
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
