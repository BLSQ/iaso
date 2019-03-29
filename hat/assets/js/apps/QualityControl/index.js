import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';
import moment from 'moment';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import QualityDetail from './pages/QualityDetail';
import QualityDashboard from './pages/QualityDashboard';
import QualityStats from './pages/QualityStats';
import { dashboardReducer, dashboardInitialStte } from './redux/dashboard';
import { filtersReducer, filtersInitialState } from '../../redux/filtersRedux';
import { testReducer, testInitialState } from './redux/test';
import { currentUserReducer, currentUserInitialState } from '../../redux/currentUserReducer';

export default function qualitycontrolapp(appConfig, element, baseUrl) {
    const dateFrom = moment().startOf('year').format('YYYY-MM-DD');
    const dateTo = moment().format('YYYY-MM-DD');
    const defaultPath = `dashboard/date_from/${dateFrom}/date_to/${dateTo}/imagePageSize/50/imagePage/1/videoPageSize/50/videoPage/1`;
    const defaulStatsPath = `/stats/date_from/${dateFrom}/date_to/${dateTo}/order/id`;
    const routes = [
        <Route
            path={'dashboard/date_from/:date_from/date_to/:date_to/imagePageSize/:imagePageSize/imagePage/:imagePage' +
                '/videoPageSize/:videoPageSize/videoPage/:videoPage' +
                '(/test_type_image/:test_type_image)(/test_type_video/:test_type_video)(/userId/:userId)' +
                '(/tab/:tab)(/imageOrder/:imageOrder)(/videoOrder/:videoOrder)' +
                '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)'}
            component={QualityDashboard}
        />,
        <Route
            path={'video/test_id/:test_id/date_from/:date_from/date_to/:date_to/imagePageSize/:imagePageSize/imagePage/:imagePage' +
                '/videoPageSize/:videoPageSize/videoPage/:videoPage' +
                '(/test_type_image/:test_type_image)(/test_type_video/:test_type_video)(/userId/:userId)' +
                '(/tab/:tab)(/imageOrder/:imageOrder)(/videoOrder/:videoOrder)' +
                '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)'}
            component={QualityDetail}
        />,
        <Route
            path={'image/test_id/:test_id/date_from/:date_from/date_to/:date_to/imagePageSize/:imagePageSize/imagePage/:imagePage' +
                '/videoPageSize/:videoPageSize/videoPage/:videoPage' +
                '(/test_type_image/:test_type_image)(/test_type_video/:test_type_video)(/userId/:userId)' +
                '(/tab/:tab)(/imageOrder/:imageOrder)(/videoOrder/:videoOrder)' +
                '(/province_id/:province_id)(/zs_id/:zs_id)(/as_id/:as_id)'}
            component={QualityDetail}
        />,
        <Route
            path="/stats/date_from/:date_from/date_to/:date_to/order/:order(/coordination_id/:coordination_id)(/type/:type)(/pageSize/:pageSize)(/page/:page)"
            component={QualityStats}
        />,
        <Redirect exact path="/dashboard" to={defaultPath} />,
        <Redirect path="/stats" to={defaulStatsPath} />,
    ];

    let history = useRouterHistory(createHistory)({
        // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        dashboard: dashboardInitialStte,
        test: testInitialState,
        currentUser: currentUserInitialState,
        load: {},
        geoFilters: filtersInitialState,
    }, {
        dashboard: dashboardReducer,
        test: testReducer,
        currentUser: currentUserReducer,
        load: loadReducer,
        geoFilters: filtersReducer,
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
