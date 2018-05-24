import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import QualityVideos from './pages/QualityVideos';
import QualityImages from './pages/QualityImages';
import QualityDashboard from './pages/QualityDashboard';
import QualityStats from './pages/QualityStats';
import { dashboardReducer } from './redux/dashboard';
import { imageReducer } from './redux/image';
import { videoReducer } from './redux/video';


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
            path="/videos/date_from/:date_from/date_to/:date_to"
            component={QualityVideos}
        />,
        <Route
            path="/images/date_from/:date_from/date_to/:date_to"
            component={QualityImages}
        />,
        <Route
            path="/stats/date_from/:date_from/date_to/:date_to/order/:order(/coordination_id/:coordination_id)(/type/:type)(/pageSize/:pageSize)(/page/:page)"
            component={QualityStats}
        />,
        <Redirect path="*" to={defaultPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        infos: null,
        imageList: null,
        videoList: null,
        load: {},
    }, {
        infos: dashboardReducer,
        imageList: imageReducer,
        videoList: videoReducer,
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
