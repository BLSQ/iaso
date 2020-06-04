import React from 'react';
import ReactDOM from 'react-dom';
import { Route, useRouterHistory } from 'react-router';
import thunk from 'redux-thunk';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import Plannings from './Plannings';
import MicroplanningContainerPage from './MicroplanningContainer';
import RoutesPage from './pages/Routes';
import MacroplanningPage from './pages/Macroplanning';
import { planningReducer } from './redux/planning';
import { teamReducer } from './redux/team';
import { coordinationReducer, coordinationInitialState } from './redux/coordination';
import { assignationReducer } from './redux/assignation';
import { selectionReducer, selectionInitialState } from './redux/selection';
import { mapReducer, mapInitialState } from './redux/map';
import { microplanningInitialState, microplanningReducer } from './redux/microplanning';
import { geoScopeMapReducer, geoScopeMapInitialState } from './redux/geoScope';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';
import { snackBarsInitialState, snackBarsReducer } from '../../redux/snackBarsReducer';
import WorkZones from './WorkZones';

export default function microplanningApp(element, baseUrl) {
    const routes = [
        <Route
            path="list(/order/:order)(/pageSize/:pageSize)(/page/:page)"
            component={Plannings}
        />,
        <Route
            path="/workzones(/order/:order)(/pageSize/:pageSize)(/page/:page)(/planning_id/:planning_id)"
            component={WorkZones}
        />,
        <Route
            path="micro(/years/:years)(/planning_id/:planning_id)(/coordination_id/:coordination_id)(/workzone_id/:workzone_id)(/team_id/:team_id)"
            component={MicroplanningContainerPage}
        />,
        <Route
            path="routes(/planning_id/:planning_id)(/team_id/:team_id)(/month_id/:month_id)"
            component={RoutesPage}
        />,
        <Route
            path="macro(/years/:years)(/planning_id/:planning_id)(/coordination_id/:coordination_id)(/as_id/:as_id)"
            component={MacroplanningPage}
        />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });
    const store = createStore({
        config: {},
        load: {},
        selection: selectionInitialState,
        map: mapInitialState,
        plannings: [],
        teams: [],
        coordinations: coordinationInitialState,
        assignations: [],
        geoScope: geoScopeMapInitialState,
        currentUser: currentUserInitialState,
        microplanning: microplanningInitialState,
        snackBar: snackBarsInitialState,
    }, {
        config: (state = {}) => state,
        load: loadReducer,
        selection: selectionReducer,
        map: mapReducer,
        plannings: planningReducer,
        teams: teamReducer,
        coordinations: coordinationReducer,
        assignations: assignationReducer,
        geoScope: geoScopeMapReducer,
        currentUser: currentUserReducer,
        microplanning: microplanningReducer,
        snackBar: snackBarsReducer,
    }, [
        routerMiddleware(history),
        thunk,
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
