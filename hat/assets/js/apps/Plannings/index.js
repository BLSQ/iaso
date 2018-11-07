import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import MicroplanningContainerPage from './MicroplanningContainer';
import RoutesPage from './pages/Route';
import MacroplanningPage from './pages/Macroplanning';
import { planningReducer } from './redux/planning';
import { teamReducer } from './redux/team';
import { coordinationReducer, coordinationInitialState } from './redux/coordination';
import { assignationReducer } from './redux/assignation';
import { selectionReducer, selectionInitialState } from './redux/selection';
import { mapReducer, mapInitialState } from './redux/map';
import { geoScopeMapReducer, geoScopeMapInitialState } from './redux/geoScope';


export default function microplanningApp(element, baseUrl) {
    const currentYear = new Date().getFullYear();
    const years = [1, 2, 3].map(i => currentYear - i);
    const defaultPath = `macro/years/${years.join(',')}`;
    const routes = [
        <Route
            path="micro/years/:years(/planning_id/:planning_id)(/coordination_id/:coordination_id)(/workzone_id/:workzone_id)(/team_id/:team_id)"
            component={MicroplanningContainerPage}
        />,
        <Route
            path="routes(/planning_id/:planning_id)(/team_id/:team_id)(/month_id/:month_id)"
            component={RoutesPage}
        />,
        <Route
            path="macro/years/:years(/planning_id/:planning_id)(/coordination_id/:coordination_id)(/as_id/:as_id)"
            component={MacroplanningPage}
        />,
        <Redirect path="*" to={defaultPath} />,
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
        geosScope: geoScopeMapInitialState,
    }, {
        config: (state = {}) => state,
        load: loadReducer,
        selection: selectionReducer,
        map: mapReducer,
        plannings: planningReducer,
        teams: teamReducer,
        coordinations: coordinationReducer,
        assignations: assignationReducer,
        geosScope: geoScopeMapReducer,
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
