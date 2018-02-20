import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import QualityVideos from './components/QualityVideos';
import QualityImages from './components/QualityImages';
import QualityDashboard from './components/QualityDashboard';


export default function qualitycontrolapp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `/date_from/${dateFrom}/date_to/${dateTo}`;
    const routes = [
        <Route
            path="/date_from/:date_from/date_to/:date_to"
            component={QualityDashboard}
        />,
        <Route
            path="/videos"
            component={QualityVideos}
        />,
        <Route
            path="/images"
            component={QualityImages}
        />,
        <Redirect path="*" to={defaultPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        load: {},
    }, {
        load: loadReducer,
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
