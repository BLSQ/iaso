import React from 'react';
import ReactDOM from 'react-dom';
import { Route, Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import { createHistory } from 'history';

import createStore from '../../redux/createStore';
import { loadReducer } from '../../redux/load';
import App from '../App';

import MonthlyReportContainerComponent from './MonthlyReportContainer';

export default function monthlyReportApp(appConfig, element, baseUrl) {
    /*
  This creates a default route using the parameters
  in the 'appConfig' object from django showing the last month
  Example appConfig object:
  {
    dates: ['2016-04', '2016-05', '2016-06']
  }
  */
    const defaultRoute = (config) => {
        if (config.dates.length) {
            const latestMonth = config.dates.slice(-1).pop();
            return `charts/date_month/${latestMonth}`;
        }
        return 'charts';
    };

    const routes = [
        <Route
            path="charts(/location/:location)(/date_month/:date_month)"
            component={MonthlyReportContainerComponent}
        />,
        <Redirect path="*" to={defaultRoute(appConfig)} />,
    ];

    let history = useRouterHistory(createHistory)({
    // baseUrl is the django route to the page
        basename: baseUrl,
    });

    const store = createStore({
        config: appConfig,
        report: {},
    }, {
        config: (state = {}) => state,
        report: loadReducer,
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
